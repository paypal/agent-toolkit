import json
import requests
from typing import Optional, List, Dict, Any, Union
from .configuration import Context


def create_invoice(context: Context, detail: Dict[str, Any], items: Optional[List[Dict[str, Any]]] = None):
    """
    Create an invoice in PayPal.

    Parameters:
        detail (dict): The details dictionary containing information about the merchant, 
                      primary recipients, and invoice information.
        items (list, optional): An array of items that the invoice is for.

    Returns:
        dict: The created invoice. If the response matches the expected format for a successful
              invoice creation, it will also automatically send the invoice with a thank you note
              and return both the create and send results.
    """
    invoice_data = {
        "detail": detail
    }
    
    if items:
        invoice_data["items"] = items
        
    # Add merchant_id from context if available
    if context.get("merchant_id") is not None:
        merchant_id = context.get("merchant_id")
        if merchant_id is not None and "detail" in invoice_data and "merchant_info" in invoice_data["detail"]:
            invoice_data["detail"]["merchant_info"]["merchant_id"] = merchant_id
            
    # Make the API call to create the invoice
    headers = get_headers(context)
    url = get_base_url(context) + "/v2/invoicing/invoices"
    response = requests.post(url, headers=headers, json=invoice_data)
    
    if response.status_code in [200, 201, 202]:
        response_data = response.json()
        
        # Check if response matches the expected format for a successful invoice creation
        # Example: {"rel":"self","href":"https://api.sandbox.paypal.com/v2/invoicing/invoices/INV2-CE58-ED48-7TD4-WWGN","method":"GET"}
        if (isinstance(response_data, dict) and 
            response_data.get("rel") == "self" and 
            "href" in response_data and 
            "/v2/invoicing/invoices/" in response_data.get("href", "") and 
            response_data.get("method") == "GET"):
            
            # Extract invoice ID from the href URL
            href = response_data.get("href", "")
            invoice_id = href.split("/")[-1]
            
            # Automatically send the invoice with specific parameters
            try:
                send_result = send_invoice(
                    context=context,
                    invoice_id=invoice_id,
                    note="thank you for choosing us. If there are any issues, feel free to contact us",
                    send_to_recipient=False
                )
                
                # Return both the create and send results
                return {
                    "createResult": response_data,
                    "sendResult": send_result
                }
            except Exception as e:
                # If sending fails, still return the original creation result
                return response_data
        
        return response_data
    else:
        handle_error_response(response)


def list_invoices(
    context: Context,
    page: Optional[int] = None,
    page_size: Optional[int] = None,
    total_required: Optional[bool] = None,
):
    """
    List invoices from PayPal.

    Parameters:
        page (int, optional): The page number of the result set to fetch.
        page_size (int, optional): The number of records to return per page (maximum 100).
        total_required (bool, optional): Indicates whether the response should include the total count of items.

    Returns:
        dict: A list of invoices.
    """
    # Prepare query parameters
    params = {}
    if page is not None:
        params["page"] = page
    if page_size is not None:
        params["page_size"] = page_size
    if total_required is not None:
        params["total_required"] = str(total_required).lower()
        
    # Make the API call to list invoices
    headers = get_headers(context)
    url = get_base_url(context) + "/v2/invoicing/invoices"
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        handle_error_response(response)


def send_invoice(
    context: Context,
    invoice_id: str,
    note: Optional[str] = None,
    send_to_recipient: Optional[bool] = None,
    additional_recipients: Optional[List[str]] = None,
):
    """
    Send an invoice to the recipient(s).

    Parameters:
        invoice_id (str): The ID of the invoice to send.
        note (str, optional): A note to the recipient.
        send_to_recipient (bool, optional): Indicates whether to send the invoice to the recipient.
        additional_recipients (list, optional): Additional email addresses to which to send the invoice.

    Returns:
        dict: The sent invoice.
    """
    send_data = {}
    
    if note is not None:
        send_data["note"] = note
    if send_to_recipient is not None:
        send_data["send_to_recipient"] = send_to_recipient
    if additional_recipients is not None:
        send_data["additional_recipients"] = additional_recipients
        
    # Make the API call to send the invoice
    headers = get_headers(context)
    url = get_base_url(context) + f"/v2/invoicing/invoices/{invoice_id}/send"
    response = requests.post(url, headers=headers, json=send_data)
    
    if response.status_code in [200, 202]:
        return response.json()
    else:
        handle_error_response(response)


def send_invoice_reminder(
    context: Context,
    invoice_id: str,
    subject: Optional[str] = None,
    note: Optional[str] = None,
    additional_recipients: Optional[List[str]] = None,
):
    """
    Send a reminder for an invoice.

    Parameters:
        invoice_id (str): The ID of the invoice for which to send a reminder.
        subject (str, optional): The subject of the reminder email.
        note (str, optional): A note to the recipient.
        additional_recipients (list, optional): Additional email addresses to which to send the reminder.

    Returns:
        dict: The result of the reminder action.
    """
    reminder_data = {}
    
    if subject is not None:
        reminder_data["subject"] = subject
    if note is not None:
        reminder_data["note"] = note
    if additional_recipients is not None:
        reminder_data["additional_recipients"] = additional_recipients
        
    # Make the API call to send the invoice reminder
    headers = get_headers(context)
    url = get_base_url(context) + f"/v2/invoicing/invoices/{invoice_id}/remind"
    response = requests.post(url, headers=headers, json=reminder_data)
    
    if response.status_code in [200, 202]:
        return response.json()
    else:
        handle_error_response(response)


def cancel_sent_invoice(
    context: Context,
    invoice_id: str,
    note: Optional[str] = None,
    send_to_recipient: Optional[bool] = None,
    additional_recipients: Optional[List[str]] = None,
):
    """
    Cancel a sent invoice.

    Parameters:
        invoice_id (str): The ID of the invoice to cancel.
        note (str, optional): A cancellation note to the recipient.
        send_to_recipient (bool, optional): Indicates whether to send the cancellation to the recipient.
        additional_recipients (list, optional): Additional email addresses to which to send the cancellation.

    Returns:
        dict: The result of the cancellation action.
    """
    cancel_data = {}
    
    if note is not None:
        cancel_data["note"] = note
    if send_to_recipient is not None:
        cancel_data["send_to_recipient"] = send_to_recipient
    if additional_recipients is not None:
        cancel_data["additional_recipients"] = additional_recipients
        
    # Make the API call to cancel the invoice
    headers = get_headers(context)
    url = get_base_url(context) + f"/v2/invoicing/invoices/{invoice_id}/cancel"
    response = requests.post(url, headers=headers, json=cancel_data)
    
    if response.status_code in [200, 202, 204]:
        return {"success": True, "invoice_id": invoice_id}
    else:
        handle_error_response(response)


def create_product(
    context: Context,
    name: str,
    type: str,
    description: Optional[str] = None,
    category: Optional[str] = None,
    image_url: Optional[str] = None,
    home_url: Optional[str] = None,
):
    """
    Create a product in PayPal.

    Parameters:
        name (str): The product name.
        description (str, optional): The product description.
        type (str): The product type. Value is PHYSICAL, DIGITAL, or SERVICE.
        category (str, optional): The product category.
        image_url (str, optional): The image URL for the product.
        home_url (str, optional): The home page URL for the product.

    Returns:
        dict: The created product.
    """
    product_data = {
        "name": name,
        "type": type
    }
    
    if description is not None:
        product_data["description"] = description
    if category is not None:
        product_data["category"] = category
    if image_url is not None:
        product_data["image_url"] = image_url
    if home_url is not None:
        product_data["home_url"] = home_url
        
    # Make the API call to create the product
    headers = get_headers(context)
    url = get_base_url(context) + "/v1/catalogs/products"
    response = requests.post(url, headers=headers, json=product_data)
    
    if response.status_code in [200, 201]:
        return response.json()
    else:
        handle_error_response(response)


def list_products(
    context: Context,
    page: Optional[int] = None,
    page_size: Optional[int] = None,
    total_required: Optional[bool] = None,
):
    """
    List products from PayPal.

    Parameters:
        page (int, optional): The page number of the result set to fetch.
        page_size (int, optional): The number of records to return per page (maximum 100).
        total_required (bool, optional): Indicates whether the response should include the total count of products.

    Returns:
        dict: A list of products.
    """
    # Prepare query parameters
    params = {}
    if page is not None:
        params["page"] = page
    if page_size is not None:
        params["page_size"] = page_size
    if total_required is not None:
        params["total_required"] = str(total_required).lower()
        
    # Make the API call to list products
    headers = get_headers(context)
    url = get_base_url(context) + "/v1/catalogs/products"
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        handle_error_response(response)


def update_product(
    context: Context,
    product_id: str,
    operations: List[Dict[str, Any]],
):
    """
    Update a product in PayPal.

    Parameters:
        product_id (str): The ID of the product to update.
        operations (list): The PATCH operations to perform on the product.

    Returns:
        dict: The updated product.
    """
    # Make the API call to update the product
    headers = get_headers(context)
    headers["Content-Type"] = "application/json-patch+json"
    url = get_base_url(context) + f"/v1/catalogs/products/{product_id}"
    response = requests.patch(url, headers=headers, json=operations)
    
    if response.status_code in [200, 204]:
        if response.status_code == 204:
            return {"success": True, "product_id": product_id}
        return response.json()
    else:
        handle_error_response(response)


def create_subscription_plan(
    context: Context,
    product_id: str,
    name: str,
    billing_cycles: List[Dict[str, Any]],
    description: Optional[str] = None,
    payment_preferences: Optional[Dict[str, Any]] = None,
    taxes: Optional[Dict[str, Any]] = None,
):
    """
    Create a subscription plan in PayPal.

    Parameters:
        product_id (str): The ID of the product for which to create the plan.
        name (str): The subscription plan name.
        description (str, optional): The subscription plan description.
        billing_cycles (list): The billing cycles of the plan.
        payment_preferences (dict, optional): The payment preferences for the subscription plan.
        taxes (dict, optional): The tax details.

    Returns:
        dict: The created subscription plan.
    """
    plan_data = {
        "product_id": product_id,
        "name": name,
        "billing_cycles": billing_cycles
    }
    
    if description is not None:
        plan_data["description"] = description
    if payment_preferences is not None:
        plan_data["payment_preferences"] = payment_preferences
    if taxes is not None:
        plan_data["taxes"] = taxes
        
    # Make the API call to create the subscription plan
    headers = get_headers(context)
    url = get_base_url(context) + "/v1/billing/plans"
    response = requests.post(url, headers=headers, json=plan_data)
    
    if response.status_code in [200, 201]:
        return response.json()
    else:
        handle_error_response(response)


def list_subscription_plans(
    context: Context,
    product_id: Optional[str] = None,
    page: Optional[int] = None,
    page_size: Optional[int] = None,
    total_required: Optional[bool] = None,
):
    """
    List subscription plans from PayPal.

    Parameters:
        product_id (str, optional): The ID of the product for which to get subscription plans.
        page (int, optional): The page number of the result set to fetch.
        page_size (int, optional): The number of records to return per page (maximum 100).
        total_required (bool, optional): Indicates whether the response should include the total count of plans.

    Returns:
        dict: A list of subscription plans.
    """
    # Prepare query parameters
    params = {}
    if product_id is not None:
        params["product_id"] = product_id
    if page is not None:
        params["page"] = page
    if page_size is not None:
        params["page_size"] = page_size
    if total_required is not None:
        params["total_required"] = str(total_required).lower()
        
    # Make the API call to list subscription plans
    headers = get_headers(context)
    url = get_base_url(context) + "/v1/billing/plans"
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        handle_error_response(response)


# Helper functions
def get_base_url(context: Context) -> str:
    """
    Get the base URL for the PayPal API.

    Parameters:
        context (Context): The context object which may contain environment settings

    Returns:
        str: The appropriate base URL for API calls
    """
    # Check for sandbox mode in context
    is_sandbox = context.get("sandbox", True)  # Default to sandbox for safety

    if is_sandbox:
        return "https://api-m.sandbox.paypal.com"
    else:
        return "https://api-m.paypal.com"


def get_headers(context: Context) -> Dict[str, str]:
    """
    Get the headers for API requests, including authentication.

    Parameters:
        context (Context): The context object which contains client credentials

    Returns:
        Dict[str, str]: Headers for API requests
    """
    # Basic headers
    headers = {
        "Content-Type": "application/json",
    }

    # Get token if it exists in context
    token = context.get("access_token")

    # If token doesn't exist, generate a new one
    if not token:
        token = _get_auth_token(context)
        # In a real implementation, you might want to update the context with the new token

    # Add authorization header
    if token:
        headers["Authorization"] = f"Bearer {token}"

    # Add additional headers if needed
    if context.get("request_id"):
        headers["PayPal-Request-Id"] = context["request_id"]

    if context.get("tenant_context"):
        headers["PayPal-Tenant-Context"] = json.dumps(context["tenant_context"])

    return headers


def _get_auth_token(context: Context) -> Optional[str]:
    """
    Get OAuth token from PayPal.

    Parameters:
        context (Context): The context object containing client credentials

    Returns:
        Optional[str]: The access token if successful, None otherwise
    """
    # Get client credentials from context
    client_id = context.get("client_id")
    client_secret = context.get("client_secret")

    # Ensure credentials are available
    if not client_id or not client_secret:
        raise ValueError("Client ID and Client Secret are required for authentication")

    # Get the base URL
    base_url = get_base_url(context)
    url = f"{base_url}/v1/oauth2/token"

    # Set up headers
    headers = {
        "Accept": "application/json",
        "Accept-Language": "en_US"
    }

    # Set up data
    data = {"grant_type": "client_credentials"}

    # Make the request
    try:
        response = requests.post(
            url,
            auth=(client_id, client_secret),
            headers=headers,
            data=data
        )

        if response.status_code == 200:
            token = response.json()["access_token"]
            return token
        else:
            handle_error_response(response)
            return None
    except Exception as e:
        raise Exception(f"Failed to get auth token: {str(e)}")


def handle_error_response(response: requests.Response):
    """
    Handle error responses from the PayPal API.

    Parameters:
        response (requests.Response): The response object from the API

    Raises:
        Exception: An exception with details about the API error
    """
    try:
        error_data = response.json()
        error_message = error_data.get("message", "Unknown error")
        error_details = error_data.get("details", [])

        if error_details:
            error_message += ": " + "; ".join([detail.get("description", "") for detail in error_details])

        raise Exception(f"PayPal API error ({response.status_code}): {error_message}")
    except (ValueError, KeyError):
        raise Exception(f"PayPal API error ({response.status_code}): {response.text}")
