import logging
import re
from urllib.parse import urlencode

def parse_order_details(params: dict) -> dict:
    try:
        # use snake_case keys
        curr_code     = params["currency_code"]
        items_in      = params.get("items", [])
        shipping_cost = params.get("shipping_cost", 0)
        discount      = params.get("discount", 0)

        sub_total = sum(item["item_cost"] * item.get("quantity", 1) for item in items_in)
        tax_amount = sum(
            item["item_cost"] * item.get("tax_percent", 0) * item.get("quantity", 1) / 100
            for item in items_in
        )
        total = sub_total + tax_amount + shipping_cost - discount

        amount_breakdown = {
            "item_total": {
                "value": f"{sub_total:.2f}",
                "currency_code": curr_code,
            },
            "shipping": {
                "value": f"{shipping_cost:.2f}",
                "currency_code": curr_code,
            },
            "tax_total": {
                "value": f"{tax_amount:.2f}",
                "currency_code": curr_code,
            },
            "discount": {
                "value": f"{discount:.2f}",
                "currency_code": curr_code,
            },
        }

        items = []
        for item in items_in:
            items.append({
                "name": item["name"],
                "description": item.get("description", ""),
                "unit_amount": {
                    "value": f"{item['item_cost']:.2f}",
                    "currency_code": curr_code,
                },
                "quantity": str(item.get("quantity", 1)),
                "tax": {
                    "value": f"{(item['item_cost'] * item.get('tax_percent', 0) / 100):.2f}",
                    "currency_code": curr_code,
                }
            })

        base_purchase_unit = {
            "amount": {
                "value": f"{total:.2f}",
                "currency_code": curr_code,
                "breakdown": amount_breakdown,
            },
            "items": items,
        }

        if params.get("shipping_address"):
            base_purchase_unit["shipping"] = {"address": params["shipping_address"]}

        request = {
            "intent": "CAPTURE",
            "purchase_units": [base_purchase_unit],
        }

        experience_context = {}
        if params.get("return_url"):
            experience_context["return_url"] = str(params["return_url"])
        if params.get("cancel_url"):
            experience_context["cancel_url"] = str(params["cancel_url"])

        if experience_context:
            request["payment_source"] = {
                "paypal": {
                    "experience_context": experience_context
                }
            }

        return request

    except Exception as e:
        logging.error("parse_order_details error:", e)
        raise ValueError("Failed to parse order details") from e



def to_snake_case_keys(obj):
    """
    Recursively convert dict keys from camelCase (or mixed) to snake_case.
    """
    if isinstance(obj, list):
        return [to_snake_case_keys(v) for v in obj]
    elif isinstance(obj, dict):
        new = {}
        for k, v in obj.items():
            # insert underscore before capital letters, then lower()
            new_key = re.sub(r"(?<!^)(?=[A-Z])", "_", k).lower()
            new[new_key] = to_snake_case_keys(v)
        return new
    else:
        return obj


def to_camel_case_keys(obj):
    """
    Recursively convert dict keys from snake_case (or mixed) to camelCase.
    """
    if isinstance(obj, list):
        return [to_camel_case_keys(v) for v in obj]
    elif isinstance(obj, dict):
        new = {}
        for k, v in obj.items():
            parts = k.split("_")
            camel = parts[0] + "".join(word.title() for word in parts[1:])
            new[camel] = to_camel_case_keys(v)
        return new
    else:
        return obj


def to_query_string(params: dict) -> str:
    """
    Build a URL query string from a flat dict, ignoring None values.
    """
    filtered = {k: v for k, v in params.items() if v is not None}
    # urlencode will properly escape keys and values
    return urlencode({k: str(v) for k, v in filtered.items()})
