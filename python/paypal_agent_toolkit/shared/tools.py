from paypal_agent_toolkit.shared.orders.prompts import (
    CREATE_ORDER_PROMPT,
    CAPTURE_ORDER_PROMPT,
    GET_ORDER_PROMPT,
)
from paypal_agent_toolkit.shared.subscriptions.prompts import (
    CREATE_PRODUCT_PROMPT,
    LIST_PRODUCTS_PROMPT,
    SHOW_PRODUCT_DETAILS_PROMPT,
    CREATE_SUBSCRIPTION_PLAN_PROMPT,
    LIST_SUBSCRIPTION_PLANS_PROMPT,
    SHOW_SUBSCRIPTION_PLAN_DETAILS_PROMPT,
    CREATE_SUBSCRIPTION_PROMPT,
    SHOW_SUBSCRIPTION_DETAILS_PROMPT,
    CANCEL_SUBSCRIPTION_PROMPT,
)

from paypal_agent_toolkit.shared.invoices.prompts import (
    CREATE_INVOICE_PROMPT,
    LIST_INVOICE_PROMPT,
    GET_INVOICE_PROMPT,
    SEND_INVOICE_PROMPT,
    SEND_INVOICE_REMINDER_PROMPT,
    CANCEL_SENT_INVOICE_PROMPT,
    GENERATE_INVOICE_QRCODE_PROMPT,
)

from paypal_agent_toolkit.shared.orders.parameters import (
    
    CreateOrderParameters,
    OrderIdParameters,
)

from paypal_agent_toolkit.shared.subscriptions.parameters import (
    
    CreateProductParameters,
    ListProductsParameters,
    ShowProductDetailsParameters,
    CreateSubscriptionPlanParameters,
    ListSubscriptionPlansParameters,
    ShowSubscriptionPlanDetailsParameters,
    CreateSubscriptionParameters,
    ShowSubscriptionDetailsParameters,
    CancelSubscriptionParameters,
)

from paypal_agent_toolkit.shared.invoices.parameters import (
    CreateInvoiceParameters,
    SendInvoiceParameters,
    ListInvoicesParameters,
    GetInvoiceParameters,
    SendInvoiceReminderParameters,
    CancelSentInvoiceParameters,
    GenerateInvoiceQrCodeParameters,
)

from paypal_agent_toolkit.shared.orders.tool_handlers import (
    create_order,
    capture_order,
    get_order_details,
)

from paypal_agent_toolkit.shared.subscriptions.tool_handlers import (
    create_product,
    list_products,
    show_product_details,
    create_subscription_plan,
    list_subscription_plans,
    show_subscription_plan_details,
    create_subscription,
    show_subscription_details,
    cancel_subscription,
)

from paypal_agent_toolkit.shared.invoices.tool_handlers import (
    create_invoice,
    send_invoice,
    list_invoices,
    get_invoice,
    send_invoice_reminder,
    cancel_sent_invoice,
    generate_invoice_qrcode
)

from pydantic import BaseModel

tools = [
    {
        "method": "create_order",
        "name": "Create PayPal Order",
        "description": CREATE_ORDER_PROMPT.strip(),
        "args_schema": CreateOrderParameters.model_json_schema(),
        "actions": {"orders": {"create": True}},
        "execute": create_order,
    },
    {
        "method": "capture_order",
        "name": "Capture PayPal Order",
        "description": CAPTURE_ORDER_PROMPT.strip(),
        "args_schema": OrderIdParameters.model_json_schema(),
        "actions": {"orders": {"capture": True}},
        "execute": capture_order,
    },
    {
        "method": "get_order_details",
        "name": "Get PayPal Order Details",
        "description": GET_ORDER_PROMPT.strip(),
        "args_schema": OrderIdParameters.model_json_schema(),
        "actions": {"orders": {"get": True}},
        "execute": get_order_details,
    },
    {
        "method": "create_product",
        "name": "Create PayPal Product",
        "description": CREATE_PRODUCT_PROMPT.strip(),
        "args_schema": CreateProductParameters.model_json_schema(),
        "actions": {"products": {"create": True}},
        "execute": create_product,
    },
    {
        "method": "list_products",
        "name": "List PayPal Products",
        "description": LIST_PRODUCTS_PROMPT.strip(),
        "args_schema": ListProductsParameters.model_json_schema(),
        "actions": {"products": {"list": True}},
        "execute": list_products,
    },
    {
        "method": "show_product_details",
        "name": "Show PayPal Prodcut Details",
        "description": SHOW_PRODUCT_DETAILS_PROMPT.strip(),
        "args_schema": ShowProductDetailsParameters.model_json_schema(),
        "actions": {"products": {"show": True}},
        "execute": show_product_details,
    },
    {
        "method": "create_subscription_plan",
        "name": "Create PayPal Subscription Plan",
        "description": CREATE_SUBSCRIPTION_PLAN_PROMPT.strip(),
        "args_schema": CreateSubscriptionPlanParameters.model_json_schema(),
        "actions": {"subscriptionPlans": {"create": True}},
        "execute": create_subscription_plan,
    },
    {
        "method": "list_subscription_plans",
        "name": "List PayPal Subscription Plans",
        "description": LIST_SUBSCRIPTION_PLANS_PROMPT.strip(),
        "args_schema": ListSubscriptionPlansParameters.model_json_schema(),
        "actions": {"subscriptionPlans": {"list": True}},
        "execute": list_subscription_plans,
    },
    {
        "method": "show_subscription_plan_details",
        "name": "List PayPal Subscription Plan Details",
        "description": SHOW_SUBSCRIPTION_PLAN_DETAILS_PROMPT.strip(),
        "args_schema": ShowSubscriptionPlanDetailsParameters.model_json_schema(),
        "actions": {"subscriptionPlans": {"show": True}},
        "execute": show_subscription_plan_details,
    },
    {
        "method": "create_subscription",
        "name": "Create PayPal Subscription",
        "description": CREATE_SUBSCRIPTION_PROMPT.strip(),
        "args_schema": CreateSubscriptionParameters.model_json_schema(),
        "actions": {"subscriptions": {"create": True}},
        "execute": create_subscription,
    },
    {
        "method": "show_subscription_details",
        "name": "Show PayPal Subscription Details",
        "description": SHOW_SUBSCRIPTION_DETAILS_PROMPT.strip(),
        "args_schema": ShowSubscriptionDetailsParameters.model_json_schema(),
        "actions": {"subscriptions": {"show": True}},
        "execute": show_subscription_details,
    },
    {
        "method": "cancel_subscription",
        "name": "Cancel PayPal Subscription",
        "description": CANCEL_SUBSCRIPTION_PROMPT.strip(),
        "args_schema": CancelSubscriptionParameters.model_json_schema(),
        "actions": {"subscriptions": {"cancel": True}},
        "execute": cancel_subscription,
    },
    {
        "method": "create_invoice",
        "name": "Create PayPal Invoice",
        "description": CREATE_INVOICE_PROMPT.strip(),
        "args_schema": CreateInvoiceParameters.model_json_schema(),
        "actions": {"invoices": {"create": True}},
        "execute": create_invoice,
    },
    {
        "method": "list_invoices",
        "name": "List Invoices",
        "description": LIST_INVOICE_PROMPT.strip(),
        "args_schema": ListInvoicesParameters.model_json_schema(),
        "actions": {"invoices": {"list": True}},
        "execute": list_invoices,
    },
    {
        "method": "get_invoice",
        "name": "Get Invoice",
        "description": GET_INVOICE_PROMPT.strip(),
        "args_schema": GetInvoiceParameters.model_json_schema(),
        "actions": {"invoices": {"get": True}},
        "execute": get_invoice,
    },
    {
        "method": "send_invoice",
        "name": "Send Invoice",
        "description": SEND_INVOICE_PROMPT.strip(),
        "args_schema": SendInvoiceParameters.model_json_schema(),
        "actions": {"invoices": {"send": True}},
        "execute": send_invoice,
    },
    {
        "method": "send_invoice_reminder",
        "name": "Send Invoice Reminder",
        "description": SEND_INVOICE_REMINDER_PROMPT.strip(),
        "args_schema": SendInvoiceReminderParameters.model_json_schema(),
        "actions": {"invoices": {"sendReminder": True}},
        "execute": send_invoice_reminder,
    },
    {
        "method": "cancel_sent_invoice",
        "name": "Cancel Sent Invoice",
        "description": CANCEL_SENT_INVOICE_PROMPT.strip(),
        "args_schema": CancelSentInvoiceParameters.model_json_schema(),
        "actions": {"invoices": {"cancel": True}},
        "execute": cancel_sent_invoice,
    },
    {
        "method": "generate_invoice_qr_code",
        "name": "Generate Invoice QR Code",
        "description": GENERATE_INVOICE_QRCODE_PROMPT.strip(),
        "args_schema": GenerateInvoiceQrCodeParameters.model_json_schema(),
        "actions": {"invoices": {"generateQRC": True}},
        "execute": generate_invoice_qrcode,
    },
    
]
