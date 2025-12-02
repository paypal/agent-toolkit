from .parameters import (
    CreatePaymentLinkParameters,
    ListPaymentLinksParameters,
    GetPaymentLinkParameters,
    UpdatePaymentLinkParameters,
    DeletePaymentLinkParameters
)
import json


def create_payment_link(client, params: dict):
    """
    Create a payment link on PayPal.

    Args:
        client: PayPal client instance
        params: Dictionary containing payment link parameters

    Returns:
        JSON string with payment link details including the shareable link URL
    """
    validated = CreatePaymentLinkParameters(**params)
    payload = validated.model_dump()

    # Ensure required fields have defaults
    if 'integration_mode' not in payload or not payload['integration_mode']:
        payload['integration_mode'] = 'LINK'
    if 'reusable' not in payload or not payload['reusable']:
        payload['reusable'] = 'MULTIPLE'

    url = "/v1/checkout/payment-resources"
    response = client.post(uri=url, payload=payload)

    return json.dumps(response)


def list_payment_links(client, params: dict):
    """
    List payment links from PayPal.

    Args:
        client: PayPal client instance
        params: Dictionary containing pagination parameters

    Returns:
        JSON string with list of payment links
    """
    validated = ListPaymentLinksParameters(**params)

    # Build query string
    query_params = []
    if validated.page:
        query_params.append(f"page={validated.page}")
    if validated.page_size:
        query_params.append(f"page_size={validated.page_size}")
    if validated.total_required is not None:
        query_params.append(f"total_required={str(validated.total_required).lower()}")

    query_string = "&".join(query_params)
    url = f"/v1/checkout/payment-resources?{query_string}" if query_string else "/v1/checkout/payment-resources"

    response = client.get(uri=url)
    return json.dumps(response)


def get_payment_link(client, params: dict):
    """
    Get a specific payment link from PayPal.

    Args:
        client: PayPal client instance
        params: Dictionary containing payment_link_id

    Returns:
        JSON string with payment link details
    """
    validated = GetPaymentLinkParameters(**params)
    url = f"/v1/checkout/payment-resources/{validated.payment_link_id}"

    response = client.get(uri=url)
    return json.dumps(response)


def update_payment_link(client, params: dict):
    """
    Update a payment link on PayPal (full replacement).

    Args:
        client: PayPal client instance
        params: Dictionary containing payment link parameters

    Returns:
        JSON string with updated payment link details
    """
    validated = UpdatePaymentLinkParameters(**params)
    payment_link_id = validated.payment_link_id

    # Build payload excluding the ID
    payload = validated.model_dump(exclude={'payment_link_id'})

    # Ensure required fields have defaults
    if 'integration_mode' not in payload or not payload['integration_mode']:
        payload['integration_mode'] = 'LINK'
    if 'reusable' not in payload or not payload['reusable']:
        payload['reusable'] = 'MULTIPLE'

    url = f"/v1/checkout/payment-resources/{payment_link_id}"
    response = client.put(uri=url, payload=payload)

    return json.dumps(response)


def delete_payment_link(client, params: dict):
    """
    Delete a payment link from PayPal.

    Args:
        client: PayPal client instance
        params: Dictionary containing payment_link_id

    Returns:
        JSON string with deletion confirmation
    """
    validated = DeletePaymentLinkParameters(**params)
    url = f"/v1/checkout/payment-resources/{validated.payment_link_id}"

    response = client.delete(uri=url)

    # DELETE often returns None for 204 No Content
    if response is None:
        return json.dumps({"success": True, "payment_link_id": validated.payment_link_id})

    return json.dumps(response)

