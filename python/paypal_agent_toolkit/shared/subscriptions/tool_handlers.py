
from .parameters import *
import json

def unwrap(kwargs):
    if "kwargs" in kwargs and isinstance(kwargs["kwargs"], dict):
        kwargs = kwargs["kwargs"]
    return kwargs
 
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
    subscription_plan_uri = f"/v1/billing/plans?page_size={validated.page_size or 10}&page={validated.page or 1}&total_required={validated.total_required or True}"
    if validated.product_id:
        subscription_plan_uri += f"&product_id={validated.product_id}"
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