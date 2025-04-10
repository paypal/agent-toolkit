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
Create a product in PayPal.

This function creates a new product that can be used for payments, invoices, or subscription plans.
`;

export const listProductsPrompt = (context: Context) => `
List products from PayPal.

This function retrieves a list of products with optional pagination parameters.
`;

export const updateProductPrompt = (context: Context) => `
Update a product in PayPal.

This function updates an existing product using JSON Patch operations.
`;

export const createSubscriptionPlanPrompt = (context: Context) => `
Create a subscription plan in PayPal.

This function creates a new subscription plan for recurring payments based on a product.
`;

export const listSubscriptionPlansPrompt = (context: Context) => `
List subscription plans from PayPal.

This function retrieves a list of subscription plans with optional product filtering and pagination parameters.
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
