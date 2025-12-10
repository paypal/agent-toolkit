"""
Validation helper functions for PayPal Payment Links

These functions help identify API limitations before making requests,
providing clear error messages that align with PayPal API behavior.
"""

from typing import List, Optional, Dict, Any, TypedDict


class ValidationResult(TypedDict):
    valid: bool
    error: Optional[str]
    field: Optional[str]


def validate_tax_config(taxes: Optional[List[Dict[str, Any]]]) -> ValidationResult:
    """
    Validate tax configuration

    Validates tax values are correct for their type.
    Note: Type enum is now restricted at schema level to PERCENTAGE and PREFERENCE only.
    """
    if not taxes:
        return {"valid": True, "error": None, "field": None}

    # Validate PERCENTAGE values are numeric
    percentage_taxes = [t for t in taxes if t.get("type") == "PERCENTAGE"]
    for tax in percentage_taxes:
        value = tax.get("value", "")
        try:
            num_value = float(value)
            if num_value < 0 or num_value > 100:
                return {
                    "valid": False,
                    "error": f'Tax percentage value must be a number between 0 and 100. Got: "{value}"',
                    "field": "taxes[].value"
                }
        except ValueError:
            return {
                "valid": False,
                "error": f'Tax percentage value must be numeric. Got: "{value}"',
                "field": "taxes[].value"
            }

    # Validate PREFERENCE values
    preference_taxes = [t for t in taxes if t.get("type") == "PREFERENCE"]
    for tax in preference_taxes:
        value = tax.get("value")
        if value != "PROFILE":
            return {
                "valid": False,
                "error": f'Tax PREFERENCE type requires value "PROFILE". Got: "{value}"',
                "field": "taxes[].value"
            }

    return {"valid": True, "error": None, "field": None}


def validate_shipping_config(shipping: Optional[List[Dict[str, Any]]]) -> ValidationResult:
    """
    Validate shipping configuration

    Validates shipping values are correct for their type.
    Note: Type enum is now restricted at schema level to FLAT and PREFERENCE only.
    """
    if not shipping:
        return {"valid": True, "error": None, "field": None}

    # Validate FLAT values are numeric
    flat_shipping = [s for s in shipping if s.get("type") == "FLAT"]
    for ship in flat_shipping:
        value = ship.get("value", "")
        try:
            num_value = float(value)
            if num_value < 0:
                return {
                    "valid": False,
                    "error": f'Shipping FLAT value must be a non-negative number. Got: "{value}"',
                    "field": "shipping[].value"
                }
        except ValueError:
            return {
                "valid": False,
                "error": f'Shipping FLAT value must be numeric. Got: "{value}"',
                "field": "shipping[].value"
            }

    # Validate PREFERENCE values
    preference_shipping = [s for s in shipping if s.get("type") == "PREFERENCE"]
    for ship in preference_shipping:
        value = ship.get("value")
        if value != "PROFILE":
            return {
                "valid": False,
                "error": f'Shipping PREFERENCE type requires value "PROFILE". Got: "{value}"',
                "field": "shipping[].value"
            }

    return {"valid": True, "error": None, "field": None}


def validate_variants(line_item: Dict[str, Any]) -> ValidationResult:
    """
    Validate variant configuration

    Requirements:
    - Must have exactly 1 primary dimension
    - Cannot have unit_amount at both product level and variant option level
    """
    variants = line_item.get("variants")
    if not variants:
        return {"valid": True, "error": None, "field": None}

    dimensions = variants.get("dimensions", [])

    # Check primary dimension count
    primary_dimensions = [d for d in dimensions if d.get("primary", False)]

    if len(primary_dimensions) == 0:
        return {
            "valid": False,
            "error": "Expected exactly 1 primary dimension, found 0. Set one dimension to primary: true",
            "field": "variants.dimensions[].primary"
        }

    if len(primary_dimensions) > 1:
        return {
            "valid": False,
            "error": f"Expected exactly 1 primary dimension, found {len(primary_dimensions)}. Only one dimension can have primary: true, others must be primary: false",
            "field": "variants.dimensions[].primary"
        }

    # Check for pricing conflicts
    has_variant_pricing = any(
        any(option.get("unit_amount") is not None for option in dim.get("options", []))
        for dim in dimensions
    )

    if has_variant_pricing and line_item.get("unit_amount"):
        return {
            "valid": False,
            "error": "Cannot specify unit_amount at both product level and variant option level. Remove unit_amount from the product level OR from all variant options.",
            "field": "unit_amount / variants.dimensions[].options[].unit_amount"
        }

    # Validate dimension count
    if len(dimensions) < 1 or len(dimensions) > 5:
        return {
            "valid": False,
            "error": f"Variants must have 1-5 dimensions. Found {len(dimensions)}",
            "field": "variants.dimensions"
        }

    # Validate options count per dimension
    for i, dim in enumerate(dimensions):
        options = dim.get("options", [])
        if len(options) < 1 or len(options) > 10:
            return {
                "valid": False,
                "error": f'Dimension "{dim.get("name")}" must have 1-10 options. Found {len(options)}',
                "field": f"variants.dimensions[{i}].options"
            }

    return {"valid": True, "error": None, "field": None}


def validate_currency(currency_code: str, value: str) -> ValidationResult:
    """
    Validate currency code and amount
    """
    # Check currency code length
    if len(currency_code) != 3:
        return {
            "valid": False,
            "error": f'Currency code must be 3 characters (ISO-4217). Got: "{currency_code}"',
            "field": "unit_amount.currency_code"
        }

    # Check if value is numeric
    try:
        num_value = float(value)
    except ValueError:
        return {
            "valid": False,
            "error": f'Currency value must be a valid number. Got: "{value}"',
            "field": "unit_amount.value"
        }

    # Special validation for zero-decimal currencies
    zero_decimal_currencies = ['JPY', 'KRW', 'VND', 'CLP', 'TWD', 'PYG']

    if currency_code.upper() in zero_decimal_currencies:
        if '.' in value:
            return {
                "valid": False,
                "error": f'{currency_code} is a zero-decimal currency and should not have decimal places. Use whole numbers (e.g., "15000" not "15000.00")',
                "field": "unit_amount.value"
            }

    # Check decimal places (max 3)
    if '.' in value:
        decimal_part = value.split('.')[1]
        if len(decimal_part) > 3:
            return {
                "valid": False,
                "error": f'Currency value supports up to 3 decimal places. Got {len(decimal_part)} decimal places in "{value}"',
                "field": "unit_amount.value"
            }

    return {"valid": True, "error": None, "field": None}


def validate_reusable_mode(reusable: str, payment_type: str) -> ValidationResult:
    """
    Validate reusable mode

    Note: Reusable is now restricted at schema level to "MULTIPLE" only.
    This validation is kept for consistency but should not trigger with proper typing.
    """
    if reusable != 'MULTIPLE':
        return {
            "valid": False,
            "error": f'Reusable must be "MULTIPLE". Got: "{reusable}"',
            "field": "reusable"
        }

    return {"valid": True, "error": None, "field": None}


def validate_payment_link_type(payment_type: str) -> ValidationResult:
    """
    Validate payment link type
    """
    supported_types = ['BUY_NOW']

    if payment_type not in supported_types:
        return {
            "valid": False,
            "error": f'Payment link type must be one of: {", ".join(supported_types)}. Got: "{payment_type}"',
            "field": "type"
        }

    return {"valid": True, "error": None, "field": None}


def validate_line_item(line_item: Dict[str, Any]) -> ValidationResult:
    """
    Validate complete line item

    Runs all validations on a line item.
    """
    # Validate taxes
    tax_result = validate_tax_config(line_item.get("taxes"))
    if not tax_result["valid"]:
        return tax_result

    # Validate shipping
    shipping_result = validate_shipping_config(line_item.get("shipping"))
    if not shipping_result["valid"]:
        return shipping_result

    # Validate variants
    variants_result = validate_variants(line_item)
    if not variants_result["valid"]:
        return variants_result

    # Validate currency if unit_amount exists
    unit_amount = line_item.get("unit_amount")
    if unit_amount:
        currency_result = validate_currency(
            unit_amount.get("currency_code", ""),
            unit_amount.get("value", "")
        )
        if not currency_result["valid"]:
            return currency_result
    elif not line_item.get("variants"):
        # If no unit_amount and no variants, that's an error
        return {
            "valid": False,
            "error": "Line item must have either unit_amount (product-level pricing) or variants with pricing in options",
            "field": "unit_amount"
        }

    return {"valid": True, "error": None, "field": None}


def validate_create_payment_link(params: Dict[str, Any]) -> ValidationResult:
    """
    Validate complete payment link creation request
    """
    # Validate type
    payment_type = params.get("type", "")
    type_result = validate_payment_link_type(payment_type)
    if not type_result["valid"]:
        return type_result

    # Validate reusable
    reusable_value = params.get("reusable", "MULTIPLE")
    reusable_result = validate_reusable_mode(reusable_value, payment_type)
    if not reusable_result["valid"]:
        return reusable_result

    # Validate line items exist
    line_items = params.get("line_items", [])
    if not line_items:
        return {
            "valid": False,
            "error": "At least one line item is required",
            "field": "line_items"
        }

    # Validate each line item
    for i, line_item in enumerate(line_items):
        item_result = validate_line_item(line_item)
        if not item_result["valid"]:
            return {
                "valid": False,
                "error": item_result["error"],
                "field": f'line_items[{i}].{item_result["field"]}'
            }

    return {"valid": True, "error": None, "field": None}
