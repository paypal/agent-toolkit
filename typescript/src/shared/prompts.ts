import type { Context } from './configuration';

// === INVOICE PARAMETERS ===

export const createInvoicePrompt = (context: Context) => `
Create a draft invoice in PayPal and then send the invoice to customer. Show the response link to the user that comes under "sendResult".
Required parameters are: invoicer.email_address (email address), primary_recipients[0].billing_info.email_address (recipient's email address), items[0].name (product name), amount.breakdown.custom.amount.value (product cost)
High level: detail, invoicer, primary_recipients, items, amount are required json objects.

Below are the required parameters to input referencing the json payload below:
invoicer.email_address (email address), primary_recipients[0].billing_info.email_address (recipient's email address), items[0].name (product name), amount.breakdown.custom.amount.value (product cost),
amount.breakdown.tax.percent (tax percent), amount.breakdown.discount.invoice_discount.percent (discount)

Also specific amount must be double or integer.
Below are the parameters you need to take care of:
invoice_number -> auto-generate invoice number starting with # followed by 10 random numbers
invoice_date -> today's date
currency_code -> "USD"
payment_term.term_type -> "NET_10"
payment_term.due_date -> within 10 days
Populate other fields with test data.
Below is the payload request structure:
{
  "detail": {
    "invoice_number": "#12334263331",
    "reference": "deal-ref",
    "invoice_date": "2018-11-12",
    "currency_code": "USD",
    "note": "Thank you for your business.",
    "term": "No refunds after 30 days.",
    "memo": "This is a long contract",
    "payment_term": {
      "term_type": "NET_10",
      "due_date": "2018-11-22"
    }
  },
  "invoicer": {
    "name": {
      "given_name": "David",
      "surname": "Larusso"
    },
    "email_address": "sb-onrga38364250@business.example.com",
  },
  "primary_recipients": [
    {
        "billing_info": {
          "email_address": "bill-me@example.com"
        }
    }
  ],
  "items": [
    {
      "name": "Yoga Mat",
      "description": "Elastic mat to practice yoga.",
      "quantity": 1,
      "unit_amount": {
        "currency_code": "USD",
        "value": 50.00
      },
      "tax": {
        "name": "Sales Tax",
        "percent": 7.25
      },
      "discount": {
        "percent": 5
      },
      "unit_of_measure": "QUANTITY"
    }
  ],
  "amount": {
    "breakdown": {
      "custom": {
        "label": "Packing Charges",
        "amount": {
          "currency_code": "USD",
          "value": 10.00
        }
      },
      "discount": {
        "invoice_discount": {
          "percent": 5
        }
      }
    }
  }
}
`;

export const listInvoicesPrompt = (context: Context) => `
List invoices from PayPal.

This function retrieves a list of invoices with optional pagination parameters.
`;

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


// === ORDER PROMPTS ===


