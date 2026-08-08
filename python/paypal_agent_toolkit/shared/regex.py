
"""
Regex patterns for PayPal resource identifiers.
These can be used with Pydantic `constr(regex=...)` or `re` directly.
"""

import re

INVOICE_ID_REGEX = re.compile(r"^[A-Za-z0-9_-]{1,127}$")
ORDER_ID_REGEX = re.compile(r"^[A-Z0-9]{17,32}$")
SUBSCRIPTION_ID_REGEX = re.compile(r"^[A-Za-z0-9_-]{3,50}$")
PRODUCT_ID_REGEX = re.compile(r"^[A-Za-z0-9_-]{12,50}$")
PLAN_ID_REGEX = re.compile(r"^[A-Za-z0-9_-]{12,32}$")
DISPUTE_ID_REGEX = re.compile(r"^[A-Za-z0-9_-]{1,255}$")
REFUND_ID_REGEX = re.compile(r"^[A-Za-z0-9_-]{12,32}$")
CAPTURE_ID_REGEX = re.compile(r"^[A-Za-z0-9_-]{12,32}$")
TRANSACTION_ID_REGEX = re.compile(r"^[A-Za-z0-9_-]{12,255}$")
HEX_COLOR_REGEX = re.compile(r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
DATE_NO_TIME_REGEX = re.compile(r"^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$")
DATE_TIME_REGEX = re.compile(r"^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]+)?(Z|[+-]([01][0-9]|2[0-3]):[0-5][0-9])$")
RECURRING_SERIES_ID_REGEX = re.compile(r"^RI-[A-Z0-9]{17}$")
COUNTRY_CODE_REGEX = re.compile(r"^([A-Z]{2}|C2)$")
LANGUAGE_REGEX = re.compile(r"^[a-z]{2}(-[A-Z][a-z]{3})?(-([A-Z]{2}|[0-9]{3}))?$")
DECIMAL_STRING_REGEX = re.compile(r"^((-?[0-9]+)|(-?([0-9]+)?[.][0-9]+))$")