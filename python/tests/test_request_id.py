"""PayPal-Request-Id on every money-moving call.

PayPal de-duplicates a request that carries a PayPal-Request-Id: the same id
again returns the original resource instead of creating a second one. These
tests pin that the Python client sends one per call, that a caller's key wins,
and that the defaults are stable where a retry must be safe (capture, send
invoice) and fresh where two calls must never collide (create order, create
subscription).

Run from the `python` directory: `python -m pytest tests`.
"""
import json
from types import SimpleNamespace

import pytest
import requests

from paypal_agent_toolkit.shared.configuration import Context
from paypal_agent_toolkit.shared.paypal_client import PayPalClient
from paypal_agent_toolkit.shared.invoices.tool_handlers import send_invoice
from paypal_agent_toolkit.shared.orders.tool_handlers import capture_order, create_order
from paypal_agent_toolkit.shared.subscriptions.tool_handlers import create_subscription
from paypal_agent_toolkit.shared.tools import tools

HEADER = "PayPal-Request-Id"
ORDER_ID = "5O190127TN364715T"


class _Response:
    """The parts of requests.Response the client and its logger read."""
    status_code = 201
    headers = {}

    def __init__(self, request_headers):
        self.request = SimpleNamespace(headers=request_headers)

    def raise_for_status(self):
        pass

    def json(self):
        return {"id": ORDER_ID, "status": "CREATED"}


@pytest.fixture
def posts(monkeypatch):
    """Capture every POST the client makes; no network."""
    seen = []

    def fake_post(url, headers=None, json=None, **kwargs):
        seen.append({"url": url, "headers": headers, "json": json})
        return _Response(headers)

    monkeypatch.setattr(requests, "post", fake_post)
    monkeypatch.setattr(PayPalClient, "get_access_token", lambda self: "tok")
    return seen


def _client(**context):
    return PayPalClient(client_id="id", secret="secret", context=Context(sandbox=True, **context))


def _order(**extra):
    return {"currency_code": "USD",
            "items": [{"name": "Seat", "item_cost": 48.0, "item_total": 48.0, "quantity": 1}],
            **extra}


def test_create_order_sends_the_callers_key_and_keeps_it_out_of_the_body(posts):
    create_order(_client(), _order(request_id="inv-2026-11-0042"))
    create_order(_client(), _order(request_id="inv-2026-11-0042"))      # a retry
    assert [p["headers"][HEADER] for p in posts] == ["inv-2026-11-0042"] * 2
    assert "request_id" not in json.dumps(posts[0]["json"])
    assert posts[0]["url"].endswith("/v2/checkout/orders")


def test_create_order_without_a_key_never_reuses_one(posts):
    create_order(_client(), _order())
    create_order(_client(), _order())
    ids = [p["headers"][HEADER] for p in posts]
    assert len(ids) == 2 and ids[0] != ids[1] and all(ids)


def test_a_per_call_key_wins_over_the_client_wide_one(posts):
    client = _client(request_id="client-wide")
    create_order(client, _order())                       # fresh key, not the shared one
    create_order(client, _order(request_id="mine"))
    assert posts[0]["headers"][HEADER] != "client-wide"
    assert posts[1]["headers"][HEADER] == "mine"
    client.post("/v1/anything", {})                      # a call with no key: client-wide applies
    assert posts[2]["headers"][HEADER] == "client-wide"


def test_capture_defaults_to_the_order_id(posts):
    capture_order(_client(), {"order_id": ORDER_ID})
    capture_order(_client(), {"order_id": ORDER_ID})     # a retried capture is the same request
    assert [p["headers"][HEADER] for p in posts] == [f"capture-{ORDER_ID}"] * 2
    assert posts[0]["url"].endswith(f"/v2/checkout/orders/{ORDER_ID}/capture")


def test_send_invoice_defaults_to_the_invoice_id(posts):
    send_invoice(_client(), {"invoice_id": "INV2-ABCD-1234", "send_to_recipient": True})
    assert posts[0]["headers"][HEADER] == "send-INV2-ABCD-1234"
    assert posts[0]["json"] == {"invoice_id": "INV2-ABCD-1234", "note": None,
                                "send_to_recipient": True, "additional_recipients": None}


def test_create_subscription_is_fresh_per_call_and_body_is_clean(posts):
    create_subscription(_client(), {"plan_id": "P-5ML4271244454362WXNWU5NQ"})
    create_subscription(_client(), {"plan_id": "P-5ML4271244454362WXNWU5NQ"})
    ids = [p["headers"][HEADER] for p in posts]
    assert ids[0] != ids[1]
    assert "request_id" not in posts[0]["json"]


def test_no_header_when_nothing_sets_one(posts):
    _client().post("/v1/anything", {})
    assert HEADER not in posts[0]["headers"]


def test_tool_schemas_expose_request_id():
    by_method = {t["method"]: t["args_schema"] for t in tools}
    # the toolkit registers capture_order under the method name pay_order
    for method in ("create_order", "pay_order", "create_subscription", "send_invoice"):
        assert "request_id" in by_method[method].model_fields, method
