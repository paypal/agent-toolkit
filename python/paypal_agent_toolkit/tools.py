from typing import Dict, List

from .prompts import (
    CREATE_INVOICE_PROMPT,
    LIST_INVOICES_PROMPT,
    SEND_INVOICE_PROMPT,
    SEND_INVOICE_REMINDER_PROMPT,
    CANCEL_SENT_INVOICE_PROMPT,
    CREATE_PRODUCT_PROMPT,
    LIST_PRODUCTS_PROMPT,
    UPDATE_PRODUCT_PROMPT,
    CREATE_SUBSCRIPTION_PLAN_PROMPT,
    LIST_SUBSCRIPTION_PLANS_PROMPT,
)

from .schema import (
    CreateInvoice,
    ListInvoices,
    SendInvoice,
    SendInvoiceReminder,
    CancelSentInvoice,
    CreateProduct,
    ListProducts,
    UpdateProduct,
    CreateSubscriptionPlan,
    ListSubscriptionPlans,
)

tools: List[Dict] = [
    {
        "method": "create_invoice",
        "name": "Create Invoice",
        "description": CREATE_INVOICE_PROMPT,
        "args_schema": CreateInvoice,
        "actions": {
            "invoices": {
                "create": True,
            }
        },
    },
    {
        "method": "list_invoices",
        "name": "List Invoices",
        "description": LIST_INVOICES_PROMPT,
        "args_schema": ListInvoices,
        "actions": {
            "invoices": {
                "read": True,
            }
        },
    },
    {
        "method": "send_invoice",
        "name": "Send Invoice",
        "description": SEND_INVOICE_PROMPT,
        "args_schema": SendInvoice,
        "actions": {
            "invoices": {
                "send": True,
            }
        },
    },
    {
        "method": "send_invoice_reminder",
        "name": "Send Invoice Reminder",
        "description": SEND_INVOICE_REMINDER_PROMPT,
        "args_schema": SendInvoiceReminder,
        "actions": {
            "invoices": {
                "remind": True,
            }
        },
    },
    {
        "method": "cancel_sent_invoice",
        "name": "Cancel Sent Invoice",
        "description": CANCEL_SENT_INVOICE_PROMPT,
        "args_schema": CancelSentInvoice,
        "actions": {
            "invoices": {
                "cancel": True,
            }
        },
    },
    {
        "method": "create_product",
        "name": "Create Product",
        "description": CREATE_PRODUCT_PROMPT,
        "args_schema": CreateProduct,
        "actions": {
            "products": {
                "create": True,
            }
        },
    },
    {
        "method": "list_products",
        "name": "List Products",
        "description": LIST_PRODUCTS_PROMPT,
        "args_schema": ListProducts,
        "actions": {
            "products": {
                "read": True,
            }
        },
    },
    {
        "method": "update_product",
        "name": "Update Product",
        "description": UPDATE_PRODUCT_PROMPT,
        "args_schema": UpdateProduct,
        "actions": {
            "products": {
                "update": True,
            }
        },
    },
    {
        "method": "create_subscription_plan",
        "name": "Create Subscription Plan",
        "description": CREATE_SUBSCRIPTION_PLAN_PROMPT,
        "args_schema": CreateSubscriptionPlan,
        "actions": {
            "subscription_plans": {
                "create": True,
            }
        },
    },
    {
        "method": "list_subscription_plans",
        "name": "List Subscription Plans",
        "description": LIST_SUBSCRIPTION_PLANS_PROMPT,
        "args_schema": ListSubscriptionPlans,
        "actions": {
            "subscription_plans": {
                "read": True,
            }
        },
    },
]
