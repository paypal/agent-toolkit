
from paypal_agent_toolkit.common.parameters import *
from .payload_util import parse_order_details
import logging
import json

def unwrap(kwargs):
    if "kwargs" in kwargs and isinstance(kwargs["kwargs"], dict):
        kwargs = kwargs["kwargs"]
    return kwargs

def create_order(client, kwargs):

    kwargs = unwrap(kwargs)
    validated = CreateOrderParameters(**json.loads(kwargs))
    order_payload = parse_order_details(validated.model_dump())
    
    order_uri = "/v2/checkout/orders"
    response = client.post(uri=order_uri, payload=order_payload)
    return json.dumps(response)



def capture_order(client, kwargs):
    validated = CaptureOrderParameters(**json.loads(kwargs))
    order_capture_uri = f"/v2/checkout/orders/{validated.order_id}/capture"
    result = client.post(uri=order_capture_uri, payload=None)
    status = result.get("status")
    amount = result.get("purchase_units", [{}])[0].get("payments", {}).get("captures", [{}])[0].get("amount", {}).get("value")
    currency = result.get("purchase_units", [{}])[0].get("payments", {}).get("captures", [{}])[0].get("amount", {}).get("currency_code")

    return json.dumps({
        "message": f"The PayPal order {validated.order_id} has been successfully captured.",
        "status": status,
        "amount": f"{currency} {amount}" if amount and currency else "N/A",
        "raw": result 
    })


def get_order_details(client, kwargs):
    validated = OrderIdParameters(**json.loads(kwargs))
    order_get_uri = f"/v2/checkout/orders/{validated.order_id}"
    
    result = client.get(order_get_uri)
    status = result.get("status")
    amount = result.get("purchase_units", [{}])[0].get("payments", {}).get("captures", [{}])[0].get("amount", {}).get("value")
    currency = result.get("purchase_units", [{}])[0].get("payments", {}).get("captures", [{}])[0].get("amount", {}).get("currency_code")

    return json.dumps({
        "message": f"The PayPal order {validated.order_id} has been successfully captured.",
        "status": status,
        "amount": f"{currency} {amount}" if amount and currency else "N/A",
        "raw": result 
    })

 
def create_product(client, kwargs):

    kwargs = unwrap(kwargs)
    validated = CreateProductParameters(**json.loads(kwargs))
    product_uri = "/v1/catalogs/products"
    result = client.post(uri = product_uri, payload = validated.model_dump())
    return json.dumps(result)


def list_products(client, kwargs):

    kwargs = unwrap(kwargs)
    validated = ListProductsParameters(**json.loads(kwargs))
    product_uri = f"/v1/catalogs/products?page_size={validated.page_size or 10}&page={validated.page or 1}&total_required={validated.total_required or 'true'}"
    result = client.get(uri = product_uri)
    return json.dumps(result)


def show_product_details(client, kwargs):

    kwargs = unwrap(kwargs)
    validated = ShowProductDetailsParameters(**json.loads(kwargs))
    product_uri = f"/v1/catalogs/products/{validated.product_id}"
    result = client.get(uri = product_uri)
    return json.dumps(result)


def create_subscription_plan(client, kwargs):

    kwargs = unwrap(kwargs)
    validated = CreateSubscriptionPlanParameters(**json.loads(kwargs))
    subscription_plan_uri = "/v1/billing/plans"
    result = client.post(uri = subscription_plan_uri, payload = validated.model_dump())
    return json.dumps(result)


def list_subscription_plans(client, kwargs):

    kwargs = unwrap(kwargs)
    validated = ListSubscriptionPlansParameters(**json.loads(kwargs))
    subscription_plan_uri = f"/v1/billing/plans?page_size={validated.page_size or 10}&page={validated.page or 1}&total_required=${validated.total_required or 'true'}"
    if validated.product_id:
        apiUrl += f"&product_id={validated.product_id}"
    result = client.get(uri = subscription_plan_uri)
    return json.dumps(result)


def show_subscription_plan_details(client, kwargs):

    kwargs = unwrap(kwargs)
    validated = ShowSubscriptionPlanDetailsParameters(**json.loads(kwargs))
    subscription_plan_uri = f"/v1/billing/plans/{validated.plan_id}"
    result = client.get(uri = subscription_plan_uri)
    return json.dumps(result)


def create_subscription(client, kwargs):

    kwargs = unwrap(kwargs)
    validated = CreateSubscriptionParameters(**json.loads(kwargs))
    subscription_plan_uri = "/v1/billing/subscriptions"
    result = client.post(uri = subscription_plan_uri, payload = validated.model_dump())
    return json.dumps(result)


def show_subscription_details(client, kwargs):

    kwargs = unwrap(kwargs)
    validated = ShowSubscriptionDetailsParameters(**json.loads(kwargs))
    subscription_plan_uri = f"/v1/billing/subscriptions/{validated.subscription_id}"
    result = client.get(uri = subscription_plan_uri)
    return json.dumps(result)


def cancel_subscription(client, kwargs):

    kwargs = unwrap(kwargs)
    validated = CancelSubscriptionParameters(**json.loads(kwargs))
    subscription_plan_uri = f"/v1/billing/subscriptions/{validated.subscription_id}/cancel"
    result = client.post(uri = subscription_plan_uri, payload = validated.payload.model_dump())
    if not result:
        return "Successfully cancelled the subscription."
    return json.dumps(result)