import json
from unittest.mock import Mock

import pytest
from pydantic import ValidationError

from paypal_agent_toolkit.shared.orders.tool_handlers import create_order

ORDER = {
    "currency_code": "USD",
    "items": [{"name": "Water bottle", "quantity": 1, "item_cost": 24, "tax_percent": 0, "item_total": 24}],
}


def sent_order(params):
    client = Mock(spec=["post"])
    client.post.return_value = {"id": "5O190127TN364715T", "status": "CREATED"}
    json.loads(create_order(client, params))
    client.post.assert_called_once()
    assert client.post.call_args.kwargs["uri"] == "/v2/checkout/orders"
    return client.post.call_args.kwargs["payload"]


def test_creates_a_capture_order_with_no_custom_id_by_default():
    order = sent_order(ORDER)
    assert order["intent"] == "CAPTURE"
    assert "custom_id" not in order["purchase_units"][0]


def test_creates_an_authorize_order_when_asked_to():
    assert sent_order({**ORDER, "intent": "AUTHORIZE"})["intent"] == "AUTHORIZE"


def test_sends_custom_id_on_the_purchase_unit():
    order = sent_order({**ORDER, "custom_id": "cart-8f14e45f"})
    assert order["purchase_units"][0]["custom_id"] == "cart-8f14e45f"


@pytest.mark.parametrize("extra", [{"intent": "SALE"}, {"custom_id": "x" * 256}, {"custom_id": ""}])
def test_rejects_values_paypal_does_not_accept(extra):
    client = Mock(spec=["post"])
    with pytest.raises(ValidationError):
        create_order(client, {**ORDER, **extra})
    client.post.assert_not_called()
