
from .parameters import *
import json

 
def create_product(client, params: dict):

    validated = CreateProductParameters(**params)
    product_uri = "/v1/catalogs/products"
    result = client.post(uri = product_uri, payload = validated.model_dump())
    return json.dumps(result)


def list_products(client, params: dict):

    validated = ListProductsParameters(**params)
    product_uri = f"/v1/catalogs/products?page_size={validated.page_size or 10}&page={validated.page or 1}&total_required={validated.total_required or 'true'}"
    result = client.get(uri = product_uri)
    return json.dumps(result)


def show_product_details(client, params: dict):

    validated = ShowProductDetailsParameters(**params)
    product_uri = f"/v1/catalogs/products/{validated.product_id}"
    result = client.get(uri = product_uri)
    return json.dumps(result)


def create_subscription_plan(client, params: dict):

    validated = CreateSubscriptionPlanParameters(**params)
    subscription_plan_uri = "/v1/billing/plans"
    result = client.post(uri = subscription_plan_uri, payload = validated.model_dump())
    return json.dumps(result)


def list_subscription_plans(client, params: dict):

    validated = ListSubscriptionPlansParameters(**params)
    subscription_plan_uri = f"/v1/billing/plans?page_size={validated.page_size or 10}&page={validated.page or 1}&total_required={validated.total_required or True}"
    if validated.product_id:
        subscription_plan_uri += f"&product_id={validated.product_id}"
    result = client.get(uri = subscription_plan_uri)
    return json.dumps(result)


def show_subscription_plan_details(client, params: dict):

    validated = ShowSubscriptionPlanDetailsParameters(**params)
    subscription_plan_uri = f"/v1/billing/plans/{validated.plan_id}"
    result = client.get(uri = subscription_plan_uri)
    return json.dumps(result)


def create_subscription(client, params: dict):

    validated = CreateSubscriptionParameters(**params)
    subscription_plan_uri = "/v1/billing/subscriptions"
    result = client.post(uri = subscription_plan_uri, payload = validated.model_dump())
    return json.dumps(result)


def show_subscription_details(client, params: dict):

    validated = ShowSubscriptionDetailsParameters(**params)
    subscription_plan_uri = f"/v1/billing/subscriptions/{validated.subscription_id}"
    result = client.get(uri = subscription_plan_uri)
    return json.dumps(result)


def cancel_subscription(client, params: dict):

    validated = CancelSubscriptionParameters(**params)
    subscription_plan_uri = f"/v1/billing/subscriptions/{validated.subscription_id}/cancel"
    result = client.post(uri = subscription_plan_uri, payload = validated.payload.model_dump())
    if not result:
        return "Successfully cancelled the subscription."
    return json.dumps(result)