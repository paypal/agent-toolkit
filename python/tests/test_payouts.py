import json
from unittest.mock import MagicMock

import pytest
import requests
from pydantic import ValidationError

from paypal_agent_toolkit.shared.configuration import Configuration, Context, is_tool_allowed
from paypal_agent_toolkit.shared.tools import tools
from paypal_agent_toolkit.shared.payouts.tool_handlers import (
    create_payout_batch,
    get_payout_batch,
    get_payout_item,
    cancel_unclaimed_payout_item,
)

PAYOUT_BATCH_ID = "5UXD2E8A7EBQJ"
PAYOUT_ITEM_ID = "8AELMXH8UB2P8"


def payout_batch_params():
    return {
        "sender_batch_header": {
            "sender_batch_id": "Payouts_2026_10_04_001",
            "recipient_type": "EMAIL",
            "email_subject": "You have a payout!",
        },
        "items": [
            {
                "receiver": "seller@example.com",
                "amount": {"currency": "USD", "value": "12.34"},
                "note": "Thanks for selling with us!",
                "sender_item_id": "seller-42",
            }
        ],
    }


def http_error(status_code, body):
    response = MagicMock(status_code=status_code)
    if body is None:
        response.json.side_effect = ValueError("No JSON")
    else:
        response.json.return_value = body
    return requests.exceptions.HTTPError(f"{status_code} Client Error", response=response)


@pytest.fixture
def client():
    client = MagicMock()
    client.post.return_value = {"batch_header": {"payout_batch_id": PAYOUT_BATCH_ID, "batch_status": "PENDING"}}
    client.get.return_value = {"payout_item_id": PAYOUT_ITEM_ID, "transaction_status": "UNCLAIMED"}
    return client


def test_create_payout_batch_posts_the_payout_request(client):
    result = create_payout_batch(client, payout_batch_params())

    client.post.assert_called_once_with(uri="/v1/payments/payouts", payload=payout_batch_params())
    assert json.loads(result)["batch_header"]["payout_batch_id"] == PAYOUT_BATCH_ID


def test_create_payout_batch_sends_no_paypal_request_id_and_drops_unknown_fields(client):
    params = payout_batch_params()
    params["sender_batch_header"]["sender_batch_id"] = "Auszahlung-März-2026"
    params["paypal_request_id"] = "3f2b7c1e-other-key"

    create_payout_batch(client, params)

    _, kwargs = client.post.call_args
    assert set(kwargs) == {"uri", "payload"}
    assert kwargs["payload"]["sender_batch_header"]["sender_batch_id"] == "Auszahlung-März-2026"
    assert "paypal_request_id" not in kwargs["payload"]


@pytest.mark.parametrize("value", ["-10.00", "ten", "", "1e3", "0", "0.00", ".0", "10."])
def test_create_payout_batch_rejects_invalid_amounts_before_calling_paypal(client, value):
    params = payout_batch_params()
    params["items"][0]["amount"]["value"] = value

    with pytest.raises(ValidationError):
        create_payout_batch(client, params)
    client.post.assert_not_called()


@pytest.mark.parametrize("value", ["10", "0.01", ".5", "10.123456"])
def test_create_payout_batch_leaves_currency_precision_to_paypal(client, value):
    params = payout_batch_params()
    params["items"][0]["amount"]["value"] = value

    create_payout_batch(client, params)

    client.post.assert_called_once()


def test_create_payout_batch_requires_at_least_one_item(client):
    params = {**payout_batch_params(), "items": []}

    with pytest.raises(ValidationError):
        create_payout_batch(client, params)
    client.post.assert_not_called()


def test_create_payout_batch_requires_a_recipient_type(client):
    params = payout_batch_params()
    del params["sender_batch_header"]["recipient_type"]

    with pytest.raises(ValidationError, match="recipient_type"):
        create_payout_batch(client, params)

    params["items"][0]["recipient_type"] = "EMAIL"
    create_payout_batch(client, params)
    client.post.assert_called_once()


def test_create_payout_batch_tells_the_agent_when_the_sender_batch_id_was_already_used(client):
    client.post.side_effect = http_error(400, {
        "name": "USER_BUSINESS_ERROR",
        "message": "User business error.",
        "debug_id": "f750689cd0de3",
        "details": [{
            "field": "SENDER_BATCH_ID",
            "location": "body",
            "issue": "Batch with given sender_batch_id already exists",
            "link": [{"href": "https://api.sandbox.paypal.com/v1/payments/payouts/TFPR9J39QYK4J", "rel": "self", "method": "GET"}],
        }],
    })

    result = create_payout_batch(client, payout_batch_params())

    assert json.loads(result) == {
        "ok": False,
        "status": 400,
        "code": "PAYPAL_API_HTTP_ERROR",
        "name": "USER_BUSINESS_ERROR",
        "message": "User business error.: Batch with given sender_batch_id already exists",
        "debug_id": "f750689cd0de3",
        "links": ["https://api.sandbox.paypal.com/v1/payments/payouts/TFPR9J39QYK4J"],
    }


def test_payout_tools_return_paypal_errors_to_the_agent(client):
    client.get.side_effect = http_error(404, {"name": "INVALID_RESOURCE_ID", "message": "The requested resource ID was not found", "debug_id": "f7990111970dc"})

    result = json.loads(get_payout_item(client, {"payout_item_id": PAYOUT_ITEM_ID}))

    assert result == {"ok": False, "status": 404, "code": "PAYPAL_API_HTTP_ERROR", "name": "INVALID_RESOURCE_ID", "message": "The requested resource ID was not found", "debug_id": "f7990111970dc"}


def test_payout_tools_handle_error_responses_without_a_json_body(client):
    client.post.side_effect = http_error(503, None)

    result = json.loads(cancel_unclaimed_payout_item(client, {"payout_item_id": PAYOUT_ITEM_ID}))

    assert result == {"ok": False, "status": 503, "code": "PAYPAL_API_HTTP_ERROR", "message": "503 Client Error"}


def test_get_payout_batch_requests_the_first_page_by_default(client):
    get_payout_batch(client, {"payout_batch_id": PAYOUT_BATCH_ID})

    client.get.assert_called_once_with(
        uri=f"/v1/payments/payouts/{PAYOUT_BATCH_ID}?page=1&page_size=100&total_required=true"
    )


def test_get_payout_batch_forwards_paging(client):
    get_payout_batch(client, {"payout_batch_id": PAYOUT_BATCH_ID, "page": 3, "page_size": 50, "total_required": False})

    client.get.assert_called_once_with(
        uri=f"/v1/payments/payouts/{PAYOUT_BATCH_ID}?page=3&page_size=50&total_required=false"
    )


def test_get_payout_item(client):
    result = get_payout_item(client, {"payout_item_id": PAYOUT_ITEM_ID})

    client.get.assert_called_once_with(uri=f"/v1/payments/payouts-item/{PAYOUT_ITEM_ID}")
    assert json.loads(result)["transaction_status"] == "UNCLAIMED"


def test_cancel_unclaimed_payout_item(client):
    cancel_unclaimed_payout_item(client, {"payout_item_id": PAYOUT_ITEM_ID})

    client.post.assert_called_once_with(uri=f"/v1/payments/payouts-item/{PAYOUT_ITEM_ID}/cancel", payload={})


@pytest.mark.parametrize(
    "handler, params",
    [
        (get_payout_batch, {"payout_batch_id": "../../v1/oauth2/token"}),
        (get_payout_batch, {"payout_batch_id": "A" * 31}),
        (get_payout_item, {"payout_item_id": ""}),
        (cancel_unclaimed_payout_item, {"payout_item_id": "8AELMXH8UB2P8/../../x"}),
    ],
)
def test_payout_ids_are_validated_before_calling_paypal(client, handler, params):
    with pytest.raises(ValidationError):
        handler(client, params)
    client.get.assert_not_called()
    client.post.assert_not_called()


def test_payout_tools_are_gated_by_the_payouts_actions():
    configuration = Configuration(actions={"payouts": {"get": True, "getItem": True}}, context=Context(sandbox=True))

    allowed = {tool["method"] for tool in tools if is_tool_allowed(tool, configuration)}

    assert allowed == {"get_payout_batch", "get_payout_item"}
