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
High level: product_id, name, description, taxes, status: {CREATED|INACTIVE|ACTIVE}, billing_cycles, payment_preferences are required in json object.
While creating billing_cycles object, trial(second) billing cycle should precede regular billing cycle.
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
Create a subscription in PayPal using the subscription - create subscription API.
This function allows you to create a new subscription for a specific plan, enabling the management of recurring payments.
The only required parameter is plan_id (the ID of the subscription plan). All other fields are optional and can be omitted if not provided.
The subscriber field is optional. If no subscriber information is provided, omit the subscriber field in the request payload.
The shipping address is optional. If no shipping address is provided, set the shipping_preference to GET_FROM_FILE in the application context.
The application context is also optional. If no application context information is provided, omit the application context field in the request payload.
`;

export const showSubscriptionDetailsPrompt = (context: Context) => `
Show subscription details from PayPal.
This function retrieves the details of a specific subscription using its ID.
Required parameters are: subscription_id (the ID of the subscription).
`;


export const cancelSubscriptionPrompt = (context: Context) => `
Cancel a customer subscription in PayPal.

This function cancels an active subscription for a customer. It requires the subscription ID and an optional reason for cancellation.
Required parameters are: subscription_id (the ID of the subscription to be canceled).
Below is the payload request structure:
{
    "reason": "Customer requested cancellation"
}
You MUST ask the user for: 
 - subscription_id
 - reason for cancellation.

Return all of the above as structured JSON in your response.
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
Below is the payload request structure:
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

This tool is used to list transactions with optional filtering parameters within a date range of 31 days. This tool can also be used to list details of a transaction given the transaction ID.

- The start_date and end_date should be specified in ISO8601 date and time format. Example dates: 1996-12-19T16:39:57-08:00, 1985-04-12T23:20:50.52Z, 1990-12-31T23:59:60Z
- The transaction_status accepts the following 4 values:
    1. "D" - represents denied transactions.
    2. "P" - represents pending transactions.
    3. "S" - represents successful transactions.
    4. "V" - represents transactions that were reversed.
- The transaction_id is the unique identifier for the transaction.
`

export const updatePlanPrompt = (context: Context) => `
Update a billing plan in PayPal using the Plans API (PATCH).

This function updates an existing plan with status CREATED or ACTIVE. For INACTIVE plans, only status updates are allowed.
You can patch the following attributes and objects in one call:

    - name
    - description
    - payment_preferences.auto_bill_outstanding
    - payment_preferences.payment_failure_threshold
    - payment_preferences.setup_fee
    - payment_preferences.setup_fee_failure_action
    - taxes.percentage

`;
