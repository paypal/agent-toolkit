from ..shared.orders.prompts import (
    CREATE_ORDER_PROMPT,
    CAPTURE_ORDER_PROMPT,
    GET_ORDER_PROMPT,
)
from ..shared.subscriptions.prompts import (
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

from ..shared.invoices.prompts import (
    CREATE_INVOICE_PROMPT,
    LIST_INVOICE_PROMPT,
    GET_INVOICE_PROMPT,
    SEND_INVOICE_PROMPT,
    SEND_INVOICE_REMINDER_PROMPT,
    CANCEL_SENT_INVOICE_PROMPT,
    GENERATE_INVOICE_QRCODE_PROMPT,
)

from ..shared.disputes.prompts import (
    LIST_DISPUTES_PROMPT,
    GET_DISPUTE_PROMPT,
    ACCEPT_DISPUTE_CLAIM_PROMPT,
)

from ..shared.tracking.prompts import (
    CREATE_SHIPMENT_PROMPT,
    GET_SHIPMENT_TRACKING_PROMPT,
)

from ..shared.transactions.prompt import (
    LIST_TRANSACTIONS_PROMPT
)

from ..shared.orders.parameters import (
    
    CreateOrderParameters,
    OrderIdParameters,
)

from ..shared.subscriptions.parameters import (
    
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

from ..shared.invoices.parameters import (
    CreateInvoiceParameters,
    SendInvoiceParameters,
    ListInvoicesParameters,
    GetInvoiceParameters,
    SendInvoiceReminderParameters,
    CancelSentInvoiceParameters,
    GenerateInvoiceQrCodeParameters,
)

from ..shared.disputes.parameters import (
   ListDisputesParameters,
   GetDisputeParameters,
   AcceptDisputeClaimParameters,
)

from ..shared.tracking.parameters import (
    CreateShipmentParameters,
    GetShipmentTrackingParameters,
)

from ..shared.transactions.parameters import (
    ListTransactionsParameters
)

from ..shared.orders.tool_handlers import (
    create_order,
    capture_order,
    get_order_details,
)

from ..shared.subscriptions.tool_handlers import (
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

from ..shared.invoices.tool_handlers import (
    create_invoice,
    send_invoice,
    list_invoices,
    get_invoice,
    send_invoice_reminder,
    cancel_sent_invoice,
    generate_invoice_qrcode
)


from ..shared.disputes.tool_handlers import (
    list_disputes,
    get_dispute,
    accept_dispute_claim
)

from ..shared.tracking.tool_handlers import (
    create_shipment_tracking,
    get_shipment_tracking,
)

from ..shared.transactions.tool_handlers import (
    list_transactions
)

from pydantic import BaseModel

tools = [
    {
        "method": "create_order",
        "name": "Create PayPal Order",
        "description": CREATE_ORDER_PROMPT.strip(),
        "args_schema": CreateOrderParameters,
        "actions": {"orders": {"create": True}},
        "execute": create_order,
    },
    {
        "method": "pay_order",
        "name": "Process payment for PayPal Order",
        "description": CAPTURE_ORDER_PROMPT.strip(),
        "args_schema": OrderIdParameters,
        "actions": {"orders": {"capture": True}},
        "execute": capture_order,
    },
    {
        "method": "get_order_details",
        "name": "Get PayPal Order Details",
        "description": GET_ORDER_PROMPT.strip(),
        "args_schema": OrderIdParameters,
        "actions": {"orders": {"get": True}},
        "execute": get_order_details,
    },
    {
        "method": "create_product",
        "name": "Create PayPal Product",
        "description": CREATE_PRODUCT_PROMPT.strip(),
        "args_schema": CreateProductParameters,
        "actions": {"products": {"create": True}},
        "execute": create_product,
    },
    {
        "method": "list_products",
        "name": "List PayPal Products",
        "description": LIST_PRODUCTS_PROMPT.strip(),
        "args_schema": ListProductsParameters,
        "actions": {"products": {"list": True}},
        "execute": list_products,
    },
    {
        "method": "show_product_details",
        "name": "Show PayPal Product Details",
        "description": SHOW_PRODUCT_DETAILS_PROMPT.strip(),
        "args_schema": ShowProductDetailsParameters,
        "actions": {"products": {"show": True}},
        "execute": show_product_details,
    },
    {
        "method": "create_subscription_plan",
        "name": "Create PayPal Subscription Plan",
        "description": CREATE_SUBSCRIPTION_PLAN_PROMPT.strip(),
        "args_schema": CreateSubscriptionPlanParameters,
        "actions": {"subscriptionPlans": {"create": True}},
        "execute": create_subscription_plan,
    },
    {
        "method": "list_subscription_plans",
        "name": "List PayPal Subscription Plans",
        "description": LIST_SUBSCRIPTION_PLANS_PROMPT.strip(),
        "args_schema": ListSubscriptionPlansParameters,
        "actions": {"subscriptionPlans": {"list": True}},
        "execute": list_subscription_plans,
    },
    {
        "method": "show_subscription_plan_details",
        "name": "List PayPal Subscription Plan Details",
        "description": SHOW_SUBSCRIPTION_PLAN_DETAILS_PROMPT.strip(),
        "args_schema": ShowSubscriptionPlanDetailsParameters,
        "actions": {"subscriptionPlans": {"show": True}},
        "execute": show_subscription_plan_details,
    },
    {
        "method": "create_subscription",
        "name": "Create PayPal Subscription",
        "description": CREATE_SUBSCRIPTION_PROMPT.strip(),
        "args_schema": CreateSubscriptionParameters,
        "actions": {"subscriptions": {"create": True}},
        "execute": create_subscription,
    },
    {
        "method": "show_subscription_details",
        "name": "Show PayPal Subscription Details",
        "description": SHOW_SUBSCRIPTION_DETAILS_PROMPT.strip(),
        "args_schema": ShowSubscriptionDetailsParameters,
        "actions": {"subscriptions": {"show": True}},
        "execute": show_subscription_details,
    },
    {
        "method": "cancel_subscription",
        "name": "Cancel PayPal Subscription",
        "description": CANCEL_SUBSCRIPTION_PROMPT.strip(),
        "args_schema": CancelSubscriptionParameters,
        "actions": {"subscriptions": {"cancel": True}},
        "execute": cancel_subscription,
    },
    {
        "method": "create_invoice",
        "name": "Create PayPal Invoice",
        "description": CREATE_INVOICE_PROMPT.strip(),
        "args_schema": CreateInvoiceParameters,
        "actions": {"invoices": {"create": True}},
        "execute": create_invoice,
    },
    {
        "method": "list_invoices",
        "name": "List Invoices",
        "description": LIST_INVOICE_PROMPT.strip(),
        "args_schema": ListInvoicesParameters,
        "actions": {"invoices": {"list": True}},
        "execute": list_invoices,
    },
    {
        "method": "get_invoice",
        "name": "Get Invoice",
        "description": GET_INVOICE_PROMPT.strip(),
        "args_schema": GetInvoiceParameters,
        "actions": {"invoices": {"get": True}},
        "execute": get_invoice,
    },
    {
        "method": "send_invoice",
        "name": "Send Invoice",
        "description": SEND_INVOICE_PROMPT.strip(),
        "args_schema": SendInvoiceParameters,
        "actions": {"invoices": {"send": True}},
        "execute": send_invoice,
    },
    {
        "method": "send_invoice_reminder",
        "name": "Send Invoice Reminder",
        "description": SEND_INVOICE_REMINDER_PROMPT.strip(),
        "args_schema": SendInvoiceReminderParameters,
        "actions": {"invoices": {"sendReminder": True}},
        "execute": send_invoice_reminder,
    },
    {
        "method": "cancel_sent_invoice",
        "name": "Cancel Sent Invoice",
        "description": CANCEL_SENT_INVOICE_PROMPT.strip(),
        "args_schema": CancelSentInvoiceParameters,
        "actions": {"invoices": {"cancel": True}},
        "execute": cancel_sent_invoice,
    },
    {
        "method": "generate_invoice_qr_code",
        "name": "Generate Invoice QR Code",
        "description": GENERATE_INVOICE_QRCODE_PROMPT.strip(),
        "args_schema": GenerateInvoiceQrCodeParameters,
        "actions": {"invoices": {"generateQRC": True}},
        "execute": generate_invoice_qrcode,
    },
    {
        "method": "list_disputes",
        "name": "List Disputes",
        "description": LIST_DISPUTES_PROMPT.strip(),
        "args_schema": ListDisputesParameters,
        "actions": {"disputes": {"list": True}},
        "execute": list_disputes,
    },
    {
        "method": "get_dispute",
        "name": "Get Dispute",
        "description": GET_DISPUTE_PROMPT.strip(),
        "args_schema": GetDisputeParameters,
        "actions": {"disputes": {"get": True}},
        "execute": get_dispute,
    },
    {
        "method": "accept_dispute_claim",
        "name": "Accept Dispute Claim",
        "description": ACCEPT_DISPUTE_CLAIM_PROMPT.strip(),
        "args_schema": AcceptDisputeClaimParameters,
        "actions": {"disputes": {"create": True}},
        "execute": accept_dispute_claim,
    },
    {
        "method": "create_shipment_tracking",
        "name": "Create Shipment",
        "description": CREATE_SHIPMENT_PROMPT.strip(),
        "args_schema": CreateShipmentParameters,
        "actions": {"shipment": {"create": True}},
        "execute": create_shipment_tracking,
    },
    {
        "method": "get_shipment_tracking",
        "name": "Get Shipment Tracking",
        "description": GET_SHIPMENT_TRACKING_PROMPT.strip(),
        "args_schema": GetShipmentTrackingParameters,
        "actions": {"shipment": {"get": True}},
        "execute": get_shipment_tracking,
    },

    {
        "method": "list_transactions",
        "name": "List Transactions",
        "description": LIST_TRANSACTIONS_PROMPT.strip(),
        "args_schema": ListTransactionsParameters,
        "actions": {"transactions": {"list": True}},
        "execute": list_transactions,
    }
    
]
