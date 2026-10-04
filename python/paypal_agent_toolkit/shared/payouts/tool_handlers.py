import json
from typing import Any, Dict
import requests
from .parameters import (
    CreatePayoutBatchParameters,
    GetPayoutBatchParameters,
    GetPayoutItemParameters,
    CancelUnclaimedPayoutItemParameters,
)


def create_payout_batch(client, params: Dict[str, Any]):

    validated = CreatePayoutBatchParameters(**params)
    payload = validated.model_dump(exclude_none=True)

    url = "/v1/payments/payouts"
    try:
        response = client.post(uri=url, payload=payload)
    except requests.exceptions.HTTPError as error:
        return _paypal_error_response(error)

    return json.dumps(response)


def get_payout_batch(client, params: Dict[str, Any]):

    validated = GetPayoutBatchParameters(**params)
    total_required = "true" if validated.total_required else "false"

    url = f"/v1/payments/payouts/{validated.payout_batch_id}?page={validated.page}&page_size={validated.page_size}&total_required={total_required}"
    try:
        response = client.get(uri=url)
    except requests.exceptions.HTTPError as error:
        return _paypal_error_response(error)

    return json.dumps(response)


def get_payout_item(client, params: Dict[str, Any]):

    validated = GetPayoutItemParameters(**params)

    url = f"/v1/payments/payouts-item/{validated.payout_item_id}"
    try:
        response = client.get(uri=url)
    except requests.exceptions.HTTPError as error:
        return _paypal_error_response(error)

    return json.dumps(response)


def cancel_unclaimed_payout_item(client, params: Dict[str, Any]):

    validated = CancelUnclaimedPayoutItemParameters(**params)

    url = f"/v1/payments/payouts-item/{validated.payout_item_id}/cancel"
    try:
        response = client.post(uri=url, payload={})
    except requests.exceptions.HTTPError as error:
        return _paypal_error_response(error)

    return json.dumps(response)


# Returned rather than raised so that the model sees PayPal's reason (for example a duplicate
# sender_batch_id) in every framework; the OpenAI Agents SDK aborts the run on a raised tool error.
def _paypal_error_response(error: requests.exceptions.HTTPError) -> str:
    response = error.response
    if response is None:
        raise error
    try:
        body = response.json()
    except ValueError:
        body = {}

    details = body.get("details") or []
    issues = [detail.get("description") or detail.get("issue") for detail in details if detail.get("description") or detail.get("issue")]
    message = body.get("message") or body.get("error_description") or body.get("name") or str(error)
    if issues:
        message = f"{message}: {'; '.join(issues)}"

    error_response: Dict[str, Any] = {
        "ok": False,
        "status": response.status_code,
        "code": "PAYPAL_API_HTTP_ERROR",
        "name": body.get("name"),
        "message": message,
        "debug_id": body.get("debug_id"),
    }
    links = [link["href"] for detail in details for link in detail.get("link") or [] if link.get("href")]
    if links:
        error_response["links"] = links

    return json.dumps({key: value for key, value in error_response.items() if value is not None})
