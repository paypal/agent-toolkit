import type { Context } from './configuration';

// === INVOICE PARAMETERS ===

export const createInvoicePrompt = (context: Context) => `
Create Invoices on PayPal.

This function is used to create an invoice in the PayPal system. It allows you to generate a new invoice, specifying details such as customer information, items, quantities, pricing, and tax information. Once created, an invoice can be sent to the customer for payment.
`;

export const listInvoicesPrompt = (context: Context) => `
List invoices from PayPal.

This function retrieves a list of invoices with optional pagination parameters.
`;

export const getInvoicePrompt = (context: Context) => `
Get an invoice from PayPal.

This function retrieves details of a specific invoice using its ID.
`

export const sendInvoicePrompt = (context: Context) => `
Send an invoice to the recipient(s).

This function sends a previously created invoice to its intended recipients.
`;

export const sendInvoiceReminderPrompt = (context: Context) => `
Send a reminder for an invoice.

This function sends a reminder for an invoice that has already been sent but hasn't been paid yet.
`;

export const cancelSentInvoicePrompt = (context: Context) => `
Cancel a sent invoice.

This function cancels an invoice that has already been sent to the recipient(s).
`;

export const generateInvoiceQrCodePrompt = (context: Context) => `
Generate a QR code for an invoice.

This function generates a QR code for an invoice, which can be used to pay the invoice using a mobile device or scanning app.
`;

export const createProductPrompt = (context: Context) => `
Create a product in PayPal using product catalog - create products API.
This function creates a new product that will be used in subscription plans, subscriptions.
Required parameters are: name (product name), type (product type).
High level: 
    - id: (auto-generated or specify SKU of the product) The ID of the product
    - name: {product_name} (required) 
    - description: {product_description} (optional)
    - type {DIGITAL | PHYSICAL | SERVICE} (required)
    - category: {product_category} (optional) 
    - image_url: {image_url} (optional)
    - home_url: {home_url} (optional)

Below is the payload request structure:
{
    "id": "#PROD-XYAB12ABSB7868434",
    "name": "Video Streaming Service",
    "description": "Service for streaming latest series, movies etc.",
    "type": "SERVICE",
    "category": "SOFTWARE",
    "image_url": "https://example.com/streaming.jpg",
    "home_url": "https://example.com/home"
}

`;

export const listProductsPrompt = (context: Context) => `
List products from PayPal.

This function retrieves a list of products with optional pagination parameters.
`;

export const showProductDetailsPrompt = (context: Context) => `
List products from PayPal.

This function retrieves a list of products with optional pagination parameters.
`;

export const updateProductPrompt = (context: Context) => `
Update a product in PayPal.

This function updates an existing product using JSON Patch operations.
`;

export const createSubscriptionPlanPrompt = (context: Context) => `
Create a subsctiption plan in PayPal using subscription - create plan API.
This function creates a new subscription plan that defines pricing and billing cycle details for subscriptions.
Required parameters are: product_id (the ID of the product for which to create the plan), name (subscription plan name), billing_cycles (billing cycle details).
High level:
    - product_id: {product_id} (required) The ID of the product for which to create the plan.
    - name: {subscription_plan_name} (required) The name of the subscription plan.
    - description: {subscription_plan_description} (optional) The description of the subscription plan.
    - taxes: {taxes} (optional) The tax details for the subscription plan.
    - status: {CREATED|INACTIVE|ACTIVE} (optional) The status of the subscription plan.
    - billing_cycles: {billing_cycles} (required) The billing cycles for the subscription plan. Each cycle defines the frequency and duration of billing.
    - payment_preferences: {payment_preferences} (optional) The payment preferences for the subscription plan. This includes auto-billing, setup fee, and payment failure threshold.


Below is the payload request structure:
{
    "product_id": "#PROD-XYAB12ABSB7868434",
    "name": "Monthly Video Streaming Subscription",
    "description": "Monthly subscription Service for Video Streaming",
    "billing_cycles": [
        {
            "frequency": {
                "interval_unit": "MONTH",
                "interval_count": 1
            },
            "tenure_type": "REGULAR",
            "sequence": 1,
            "total_cycles": 12,
            "pricing_scheme": {
                "fixed_price": {
                    "currency_code": "USD",
                    "value": 10
                }
            }
        }
    ],
    "payment_preferences": {
        "auto_bill_outstanding": true,
        "setup_fee": {
            "currency_code": "USD",
            "value": 10
        },
        "setup_fee_failure_action": "CONTINUE",
        "payment_failure_threshold": 3
    },
    "taxes": {
        "percentage": "10",
        "inclusive": false
    }
}

`;

export const listSubscriptionPlansPrompt = (context: Context) => `
List subscription plans from PayPal.

This function retrieves a list of subscription plans with optional product filtering and pagination parameters.
`;

export const showSubscriptionPlanDetailsPrompt = (context: Context) => `
Show subscription plan details from PayPal.
This function retrieves the details of a specific subscription plan using its ID.
Required parameters are: plan_id (the ID of the subscription plan).
`;

export const createSubscriptionPrompt = (context: Context) => `
Create a subscription in PayPal using subscription - create subscription API.
This function creates a new subscription for a specific plan, allowing you to manage recurring payments.
Required parameters are: plan_id (the ID of the subscription plan), subscriber (subscriber details).
High level:
    - plan_id: {plan_id} (required) The ID of the subscription plan.
    - subscriber: {subscriber} (required) The subscriber details, including name and email.
    - application_context: {application_context} (optional) The application context for the subscription, including return URL, cancel URL, and locale.
    - start_time: {start_time} (optional) The start time for the subscription.
    - shipping_amount: {shipping_amount} (optional) The shipping amount for the subscription.
    - shipping_preference: {shipping_preference} (optional) The shipping preference for the subscription.
    - tax: {tax} (optional) The tax details for the subscription.
    - items: {items} (optional) The items included in the subscription.
Below is the payload request structure:
{
  "plan_id": "P-5ML4271244454362WXNWU5NQ",
  "start_time": "2018-11-01T00:00:00Z",
  "quantity": "20",
  "shipping_amount": {
    "currency_code": "USD",
    "value": "10.00"
  },
  "subscriber": {
    "name": {
      "given_name": "John",
      "surname": "Doe"
    },
    "email_address": "customer@example.com",
    "shipping_address": {
      "name": {
        "full_name": "John Doe"
      },
      "address": {
        "address_line_1": "2211 N First Street",
        "address_line_2": "",
        "admin_area_2": "San Jose",
        "admin_area_1": "CA",
        "postal_code": "95131",
        "country_code": "US"
      }
    }
  },
  "application_context": {
    "brand_name": "walmart",
    "locale": "en-US",
    "shipping_preference": "SET_PROVIDED_ADDRESS",
    "user_action": "SUBSCRIBE_NOW",
    "payment_method": {
      "payer_selected": "PAYPAL",
      "payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED"
    },
    "return_url": "https://example.com/returnUrl",
    "cancel_url": "https://example.com/cancelUrl"
  }
}
`;

export const showSubscriptionDetailsPrompt = (context: Context) => `
Show subscription details from PayPal.
This function retrieves the details of a specific subscription using its ID.
Required parameters are: subscription_id (the ID of the subscription).
`;


export const createShipmentPrompt = (context: Context) => `
Create a shipment for a transaction in PayPal.
This function creates a shipment record for a specific transaction, allowing you to track the shipment status and details.
The transaction_id can fetch from the captured payment details in the order information.
Required parameters are: tracking_number (the tracking number for the shipment), transaction_id (the transaction ID associated with the shipment). 
High level: tracking_number, transaction_id, status (optional), carrier (optional) are required json objects.
Below is the payload request structure:
{
    "tracking_number": "1234567890",
    "transaction_id": "9XJ12345ABC67890",
    "status": "SHIPPED", // Required: ON_HOLD, SHIPPED, DELIVERED, CANCELLED
    "carrier": "UPS" // Required: The carrier handling the shipment. Link to supported carriers: http://developer.paypal.com/docs/tracking/reference/carriers/
}
`;

export const getShipmentTrackingPrompt = (context: Context) => `
Get tracking information for a shipment by ID.
This function retrieves tracking information for a specific shipment using the transaction ID and tracking number.
The transaction_id can fetch from the captured payment details in the order information.
Required parameters are: transaction_id (the transaction ID associated with the shipment), tracking_number (the tracking number for the shipment).
Below is the payload request structure:
{
    "transaction_id": "9XJ12345ABC67890",
    "tracking_number": "1234567890"
}
`;

// === ORDER PROMPTS ===

export const createOrderPrompt = (context: Context) => `
Create an order in PayPal.

This tool is used to create a new order in PayPal. This is typically the first step in initiating a payment flow. It sets up an order with specified details such as item(s) to be purchased, quantity, amount, currency, and other details.
`;

export const getOrderPrompt = (context: Context) => `
Retrieves the order details from PayPal for a given order ID.

This tool is used to retrieve details of an existing order in PayPal. It provides information about the order, including items, amounts, status, and other relevant details.
`;

export const captureOrderPrompt = (context: Context) => `
Capture a payment for an order.

This tool is used to capture a payment for an order. It allows you to capture funds that have been authorized for a specific order but not yet captured.
`;
// === DISPUTE PROMPTS ===

export const listDisputesPrompt = (context: Context) => `
List disputes from PayPal.

This function retrieves a list of disputes with optional pagination and filtering parameters.
`;

export const getDisputePrompt = (context: Context) => `
Get details for a specific dispute from PayPal.

This tool is used to lists disputes with a summary set of details, which shows the dispute_id, reason, status, dispute_state, dispute_life_cycle_stage, dispute_channel, dispute_amount, create_time and update_time fields.
`;

export const acceptDisputeClaimPrompt = (context: Context) => `
Accept liability for a dispute claim.

This tool is used to accept liability for a dispute claim. When you accept liability for a dispute claim, the dispute closes in the customer's favor and PayPal automatically refunds money to the customer from the merchant's account.
`

export const listTransactionsPrompt = (context: Context) => `
List transactions from PayPal.

This tool is used to lists transactions with optional filtering parameters within a date range of 31 days. 

- The start_date and end_date should be specified in Internet date and time format. Example dates: 1996-12-19T16:39:57-08:00, 1985-04-12T23:20:50.52Z, 1990-12-31T23:59:60Z
- The transaction_status accepts the following 4 values:
    1. "D" - represents denied transactions.
    2. "P" - represents pending transactions.
    3. "S" - represents successful transactions.
    4. "V" - represents transactions that were reversed.
`
