
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