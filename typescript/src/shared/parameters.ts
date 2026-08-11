import { z } from 'zod';
import type { Context } from './configuration';
import {subscriptionKeys} from "./constants";
import {INVOICE_ID_REGEX, ORDER_ID_REGEX, SUBSCRIPTION_ID_REGEX, PRODUCT_ID_REGEX, PLAN_ID_REGEX, DISPUTE_ID_REGEX, REFUND_ID_REGEX, CAPTURE_ID_REGEX, TRANSACTION_ID_REGEX, HEX_COLOR_REGEX, DATE_NO_TIME_REGEX, RECURRING_SERIES_ID_REGEX, COUNTRY_CODE_REGEX, LANGUAGE_REGEX, DECIMAL_STRING_REGEX} from "./regex"

// === INVOICE PARAMETERS ===
// Shared building blocks, reused across create_invoice and create_recurring_series (and
// intended for reuse by a future create_template tool).
//
// Every shared schema below is a FACTORY FUNCTION (returns a fresh z.object() on each
// call) rather than a shared const instance. The MCP SDK converts these zod schemas to
// JSON Schema via zod-to-json-schema, which dedupes repeated *object-identity* schema
// instances into "$ref" pointers -- and tool-schema viewers such as the MCP Inspector
// don't render an input for a "$ref"'d field. Calling these as functions at every usage
// site guarantees each field gets its own independent schema instance, so the generated
// JSON schema is always fully inlined instead of using $ref.

const money = () => z.object({
  currency_code: z.string().describe("The three-character ISO-4217 currency code that identifies the currency."),
  value: z.string().regex(DECIMAL_STRING_REGEX, "value must be a numeric value, e.g. \"50\" or \"50.00\"").describe("The amount, as a signed decimal string with up to 2 decimal places (e.g. '50.00')."),
});

const personName = () => z.object({
  given_name: z.string().optional().describe("The first name of the person."),
  surname: z.string().optional().describe("The last name of the person."),
}).describe("name object");

const address = () => z.object({
  address_line_1: z.string().optional().describe("The first line of the address, for example, number and street."),
  address_line_2: z.string().optional().describe("The second line of the address, for example, suite or apartment number."),
  admin_area_2: z.string().optional().describe("A city, town, or village."),
  admin_area_1: z.string().optional().describe("The highest-level sub-division in a country, such as a state or province."),
  postal_code: z.string().optional().describe("The postal code, which is the zip code or equivalent."),
  country_code: z.string().regex(COUNTRY_CODE_REGEX, "country_code must be a two-character ISO 3166-1 country code").optional().describe("The two-character ISO 3166-1 country code (for example, US or GB)."),
}).describe("address object");

const phone = () => z.object({
  country_code: z.string().describe("The country calling code, in E.164 format (for example, '1' for the United States)."),
  national_number: z.string().describe("The national number, in E.164 format."),
  phone_type: z.enum(["FAX", "HOME", "MOBILE", "OTHER", "PAGER"]).describe("The type of phone number."),
}).describe("phone object");

const tax = () => z.object({
  name: z.string().describe("The name of the tax applied on the item, for example 'Sales Tax'."),
  percent: z.string().regex(DECIMAL_STRING_REGEX, "percent must be a numeric value, e.g. \"18\" or \"18.5\"").describe("The tax rate, as a percent value from 0 to 100. Supports up to five decimal places."),
  tax_note: z.string().optional().describe("A note about the tax, used to track tax-related data."),
}).describe("tax object");

const discount = () => z.object({
  percent: z.string().regex(DECIMAL_STRING_REGEX, "percent must be a numeric value, e.g. \"10\" or \"10.5\"").optional().describe("The discount as a percent value, from 0 to 100. Supports up to five decimal places. Mutually exclusive with amount -- set only one."),
  amount: money().optional().describe("The discount as a fixed amount. Mutually exclusive with percent -- set only one."),
}).refine((val) => val.percent === undefined || val.amount === undefined, {
  message: "percent and amount cannot both be set on the same discount -- use only one.",
  path: ["amount"],
}).describe("discount object");

const invoiceItem = () => z.object({
  name: z.string().describe('The name of the item'),
  description: z.string().optional().describe("The description of the item."),
  quantity: z.string().describe('The quantity of the item that the invoicer provides to the payer. Value is from -1000000 to 1000000. Supports up to five decimal places. Cast to string'),
  unit_amount: money().describe("The unit price of the item. Does not include tax or discount."),
  tax: tax().optional(),
  discount: discount().optional().describe("The discount for this line item, subtracted from the item total."),
  item_date: z.string().regex(DATE_NO_TIME_REGEX, "item_date must be in yyyy-MM-DD format").optional().describe("The date, in yyyy-MM-DD format, when the item or service was provided."),
  unit_of_measure: z.enum(["QUANTITY", "HOURS", "AMOUNT"]).optional().describe("The unit of measure for the invoiced item"),
}).describe("invoice line item object");


const billingInfo = () => z.object({
  business_name: z.string().optional().describe("The business name of the invoice recipient."),
  name: personName().optional().describe("name of the recipient"),
  address: address().optional().describe("The address of the invoice recipient."),
  email_address: z.string().optional().describe("email address of the recipient"),
  phones: z.array(phone()).optional().describe("The invoice recipient's phone numbers."),
  additional_info: z.string().max(40).optional().describe("Any additional information about the recipient."),
  language: z.string().regex(LANGUAGE_REGEX, "language must be a BCP-47 language tag, e.g. en-US").optional().describe("The BCP-47 language tag used for the recipient's email notification (for example, 'en-US'). Only used when the recipient has no PayPal account."),
}).describe("The billing information of the invoice recipient");

const shippingInfo = () => z.object({
  business_name: z.string().optional().describe("The business name for the shipping destination."),
  name: personName().optional().describe("The name for the shipping destination."),
  address: address().optional().describe("The shipping address."),
}).describe("The shipping information of the invoice recipient.");

const primaryRecipient = () => z.object({
  billing_info: billingInfo().optional(),
  shipping_info: shippingInfo().optional(),
});

// create_invoice and create_recurring_series both reuse the nested primaryRecipient()/invoiceItem()
// factories above directly for recipients and items (passed straight through to PayPal); all other
// top-level fields keep their own flat shape for a simpler LLM-facing top level. See
// buildCreateInvoicePayload/buildCreateRecurringSeriesPayload in payloadUtils.ts.

export const createInvoiceParameters = (context: Context) => z.object({
  currency_code: z.string().describe("The three-character ISO-4217 currency code for the invoice (for example, USD). Applies to every monetary amount on the invoice."),
  invoice_number: z.string().optional().describe("The invoice number. If omitted, PayPal auto-increments from the last invoice number used."),
  invoice_date: z.string().regex(DATE_NO_TIME_REGEX, "invoice_date must be in yyyy-MM-DD format").optional().describe("The invoice date in yyyy-MM-DD format."),
  reference: z.string().optional().describe("A reference value, such as a purchase order number."),
  note: z.string().optional().describe("A note to the invoice recipient. Also appears on the invoice notification email."),

  invoicer_business_name: z.string().max(300).optional().describe("The business name of the invoicer."),
  invoicer_given_name: z.string().optional().describe("The first name of the invoicer."),
  invoicer_surname: z.string().optional().describe("The last name of the invoicer."),
  invoicer_email_address: z.string().optional().describe("The email address of the invoicer."),
  invoicer_tax_id: z.string().optional().describe("The invoicer's tax ID."),
  invoicer_address_line_1: z.string().optional().describe("The first line of the invoicer's address, for example, number and street."),
  invoicer_address_line_2: z.string().optional().describe("The second line of the invoicer's address, for example, suite or apartment number."),
  invoicer_city: z.string().optional().describe("The city, town, or village of the invoicer's address."),
  invoicer_state: z.string().optional().describe("The state or province of the invoicer's address."),
  invoicer_postal_code: z.string().optional().describe("The postal code of the invoicer's address."),
  invoicer_country_code: z.string().regex(COUNTRY_CODE_REGEX, "invoicer_country_code must be a two-character ISO 3166-1 country code").optional().describe("The two-character ISO 3166-1 country code of the invoicer's address (for example, US or GB)."),

  primary_recipients: z.array(primaryRecipient()).describe("The recipients who will be billed for this invoice."),
  items: z.array(invoiceItem()).describe("The line items on the invoice."),

  allow_tip: z.boolean().optional().describe("Whether the payer can add a tip when paying. Not available in Hong Kong, Taiwan, India, or Japan."),
  theme_color: z.string().regex(HEX_COLOR_REGEX, "theme_color must be a hex color code, e.g. #000000 or #000").optional().describe("The primary color used to render the invoice, as a hex color code (e.g. #000000). If omitted, the default theme is used."),
  shipping_cost: z.string().regex(DECIMAL_STRING_REGEX, "shipping_cost must be a numeric value, e.g. \"25.00\"").optional().describe("The shipping cost for the invoice, in the invoice's currency_code."),

  enable_pay_by_bank: z.boolean().optional().describe("Whether to enable PAY_BY_BANK as a payment method for this invoice, letting the payer pay directly from their bank account. Available only for US-based merchants and invoices with USD currency."),
  pay_by_bank_exclusive_above_threshold: z.boolean().optional().describe("When true, PAY_BY_BANK becomes the only available payment method once the invoice total exceeds PayPal's system-defined threshold ($1000), disabling all other payment methods above that threshold."),

  allow_partial_payment: z.boolean().optional().describe("Whether the invoice allows a partial payment. If false, the invoice must be paid in full. If true, the invoice allows partial payments. Not available for users in India, Brazil, or Israel."),
  minimum_partial_payment_amount: z.string().regex(DECIMAL_STRING_REGEX, "minimum_partial_payment_amount must be a numeric value, e.g. \"20.00\"").optional().describe("The minimum amount allowed for a partial payment, in the invoice's currency_code. Valid only when allow_partial_payment is true."),
}).describe("Simplified create-invoice request. The tool implementation builds PayPal's actual nested invoicing API request from these flat fields.");

export const createRecurringSeriesParameters = (context: Context) => z.object({
  interval_unit: z.enum(["DAY", "WEEK", "MONTH", "YEAR"]).describe("The time unit for the recurring invoice cycle interval"),
  interval_count: z.number().int().min(1).max(52).describe("The number of intervals between each recurring invoice cycle. For example, an interval_count of 2 with interval_unit of MONTH means the invoice recurs every 2 months"),
  start_series_date: z.string().regex(DATE_NO_TIME_REGEX, "start_series_date must be in yyyy-MM-DD format").describe("The date when the recurring series begins and the first invoice is generated, in yyyy-MM-DD format. Cannot be a past date."),
  total_cycles: z.number().int().min(0).max(99).optional().describe("The total number of invoices to generate in the series. If omitted, the series runs indefinitely until cancelled."),

  reference: z.string().optional().describe("A reference value, such as a purchase order number."),
  currency_code: z.string().describe("Currency code of the recurring invoice series"),
  note: z.string().optional().describe("A note to the invoice recipient. Also appears on the invoice notification email."),

  invoicer_business_name: z.string().max(300).optional().describe("The business name of the invoicer."),
  invoicer_given_name: z.string().optional().describe("The first name of the invoicer."),
  invoicer_surname: z.string().optional().describe("The last name of the invoicer."),
  invoicer_email_address: z.string().optional().describe("The email address of the invoicer."),
  invoicer_tax_id: z.string().optional().describe("The invoicer's tax ID."),
  invoicer_address_line_1: z.string().optional().describe("The first line of the invoicer's address, for example, number and street."),
  invoicer_address_line_2: z.string().optional().describe("The second line of the invoicer's address, for example, suite or apartment number."),
  invoicer_city: z.string().optional().describe("The city, town, or village of the invoicer's address."),
  invoicer_state: z.string().optional().describe("The state or province of the invoicer's address."),
  invoicer_postal_code: z.string().optional().describe("The postal code of the invoicer's address."),
  invoicer_country_code: z.string().regex(COUNTRY_CODE_REGEX, "invoicer_country_code must be a two-character ISO 3166-1 country code").optional().describe("The two-character ISO 3166-1 country code of the invoicer's address (for example, US or GB)."),

  primary_recipients: z.array(primaryRecipient()).min(1).max(1).describe("The primary recipient of the recurring invoices"),
  items: z.array(invoiceItem()).min(1).optional().describe("The line items that will appear on each invoice in the recurring series"),

  allow_tip: z.boolean().optional().describe("Whether the payer can add a tip when paying. Not available in Hong Kong, Taiwan, India, or Japan."),
  shipping_cost: z.string().regex(DECIMAL_STRING_REGEX, "shipping_cost must be a numeric value, e.g. \"25.00\"").optional().describe("The shipping cost for each generated invoice, in the series' currency_code."),

  allow_partial_payment: z.boolean().optional().describe("Whether each generated invoice allows a partial payment. If false, each invoice must be paid in full. If true, each invoice allows partial payments. Not available for users in India, Brazil, or Israel."),
  minimum_partial_payment_amount: z.string().regex(DECIMAL_STRING_REGEX, "minimum_partial_payment_amount must be a numeric value, e.g. \"20.00\"").optional().describe("The minimum amount allowed for a partial payment on each generated invoice, in the series' currency_code. Valid only when allow_partial_payment is true."),
}).describe("Simplified create-recurring-series request. The tool implementation builds PayPal's actual nested recurring-invoicing API request from these flat fields.");

// update_invoicing is one external tool that internally branches to an invoice-update flow
// or a recurring-series-update flow based on resource_type. invoice_update/recurring_series_update
// are full-replacement bodies -- the create schemas extended with the resource's ID (and, for
// invoices, the two query-param booleans) -- since PayPal's update endpoints are full-body PUTs.

export const updateInvoiceBodyParameters = (context: Context) =>
  createInvoiceParameters(context).extend({
    // Optional at the schema level (even though it's required whenever this flow actually runs) so that
    // a client blanking out the unused side of update_invoicing instead of omitting it can still pass
    // validation -- the regex would otherwise reject an empty placeholder before the dispatcher's own
    // "is this side really being used" check ever runs. Presence is enforced at runtime in updateInvoicing.
    invoice_id: z.string().regex(INVOICE_ID_REGEX, "Invalid PayPal Invoice ID").optional().describe("The ID of the invoice to update. Required when resource_type is 'invoice'."),
    send_to_recipient: z.boolean().optional().describe("Whether to send the invoice update notification to the recipient. PayPal defaults to true if omitted."),
    send_to_invoicer: z.boolean().optional().describe("Whether to send the invoice update notification to the merchant (invoicer). PayPal defaults to true if omitted."),
  });

export const updateRecurringSeriesBodyParameters = (context: Context) =>
  createRecurringSeriesParameters(context).extend({
    // Optional for the same reason as invoice_id above; enforced at runtime in updateInvoicing.
    recurring_series_id: z.string().regex(RECURRING_SERIES_ID_REGEX, "Invalid PayPal Recurring Series ID").optional().describe("The ID of the recurring invoice series to update. Required when resource_type is 'recurring_series'."),
  });

export const updateInvoicingParameters = (context: Context) => z.object({
  resource_type: z.enum(["invoice", "recurring_series"]).describe("Which kind of resource to update. 'invoice' updates an individual invoice; 'recurring_series' updates a recurring invoice series."),
  invoice_update: updateInvoiceBodyParameters(context).optional().describe("Full replacement content for the invoice. Set only when resource_type is 'invoice'."),
  recurring_series_update: updateRecurringSeriesBodyParameters(context).optional().describe("Full replacement content for the recurring series. Set only when resource_type is 'recurring_series'."),
}).describe("Update an existing invoice or recurring invoice series on PayPal, depending on resource_type. This is a full-replacement update -- resend the complete content, not just changed fields.");

export const activateRecurringSeriesParameters = (context: Context) => z.object({
  recurring_series_id: z.string()
    .regex(RECURRING_SERIES_ID_REGEX, "Invalid PayPal Recurring Series ID")
    .describe("The ID of the recurring invoice series to activate."),
});

export const getInvoicParameters = (context: Context) => z.object({
  invoice_id: z.string()
        .regex(INVOICE_ID_REGEX, "Invalid PayPal Invoice ID")
        .describe('The ID of the invoice to retrieve.'),
});

export const listInvoicesParameters = (context: Context) =>
  z.object({
    page: z.number().min(1).max(1000).default(1).optional().describe('The page number of the result set to fetch.').default(1),
    page_size: z.number().min(1).max(100).default(100).optional().describe('The number of records to return per page (maximum 100).'),
    total_required: z.boolean().optional().describe('Indicates whether the response should include the total count of items.'),
  });

export const sendInvoiceParameters = (context: Context) =>
  z.object({
    invoice_id: z.string().regex(INVOICE_ID_REGEX, "Invalid PayPal Invoice ID").describe('The ID of the invoice to send.'),
    note: z.string().optional().describe('A note to the recipient.'),
    send_to_recipient: z.boolean().optional().describe('Indicates whether to send the invoice to the recipient.'),
    additional_recipients: z.array(z.string()).optional().describe('Additional email addresses to which to send the invoice.'),
  });

export const sendInvoiceReminderParameters = (context: Context) =>
  z.object({
    invoice_id: z.string().regex(INVOICE_ID_REGEX, "Invalid PayPal Invoice ID").describe('The ID of the invoice for which to send a reminder.'),
    subject: z.string().optional().describe('The subject of the reminder email.'),
    note: z.string().optional().describe('A note to the recipient.'),
    additional_recipients: z.array(z.string()).optional().describe('Additional email addresses to which to send the reminder.'),
  });

export const cancelSentInvoiceParameters = (context: Context) =>
  z.object({
    invoice_id: z.string().regex(INVOICE_ID_REGEX, "Invalid PayPal Invoice ID").describe('The ID of the invoice to cancel.'),
    note: z.string().optional().describe('A cancellation note to the recipient.'),
    send_to_recipient: z.boolean().optional().describe('Indicates whether to send the cancellation to the recipient.'),
    additional_recipients: z.array(z.string()).optional().describe('Additional email addresses to which to send the cancellation.'),
  });

export const generateInvoiceQrCodeParameters = (context: Context) => z.object({
  invoice_id: z.string().regex(INVOICE_ID_REGEX, "Invalid PayPal Invoice ID").describe('The invoice id to generate QR code for'),
  width: z.number().default(300).describe("The QR code width"),
  height: z.number().default(300).describe("The QR code height")
}).describe("generate invoice qr code request payload");

const invoiceReminderConfiguration = z.object({
  type: z.enum(['BEFORE_DUE', 'AFTER_DUE']).describe('The type of reminder. BEFORE_DUE sends a reminder before the invoice due date; AFTER_DUE sends a reminder after the invoice due date.'),
  interval: z.object({
    unit: z.literal('DAY').default('DAY').describe('The unit of time for the reminder interval. The interval unit is always DAY.'),
    value: z.number().int().describe('The number of interval units before/after the due date at which to send the reminder.'),
  }).describe('The interval at which to send the reminder.'),
  repetition: z.number().int().describe('The number of times to send the reminder. Must be 1 for BEFORE_DUE reminders.'),
  notification: z.object({
    send_to_invoicer: z.boolean().optional().describe('Indicates whether to also notify the invoicer when the reminder is sent.'),
  }).optional().describe('Notification settings for the reminder.'),
}).describe('An invoice auto reminder configuration.');

export const setupInvoiceAutoReminderParameters = (context: Context) =>
  z.object({
    configurations: z
      .array(invoiceReminderConfiguration)
      .optional()
      .describe(
        'An array of up to two invoice auto reminder configurations, one for BEFORE_DUE and one for AFTER_DUE. If omitted, both reminder types are created with the default configuration in INACTIVE state. If only one type is provided, the other is created with the default configuration in INACTIVE state.'
      ),
  });

export const updateInvoiceAutoReminderParameters = (context: Context) =>
  z.object({
    reminder_configuration_id: z.string().describe('The ID of the auto reminder configuration to update.'),
    type: z.enum(['BEFORE_DUE', 'AFTER_DUE']),
    status: z.enum(['NONE', 'ACTIVE', 'INACTIVE']).optional().describe('Select an option.'),
    interval: z.object({
      value: z.number().int().describe('The number of interval units before/after the due date at which to send the reminder.'),
    }).describe('The interval at which to send the reminder. The interval unit is always DAY.'),
    repetition: z.number().int().describe('The number of times to send the reminder. Must be 1 for BEFORE_DUE reminders.'),
    notification: z.object({
      send_to_invoicer: z.boolean().optional().describe('Indicates whether to also notify the invoicer when the reminder is sent.'),
    }).optional().describe('Notification settings for the reminder.'),
  }).describe('Full replacement configuration for an existing invoice auto reminder. All required fields must be included since this performs a full update.');


export const updateProductParameters = (context: Context) =>
  z.object({
    product_id: z.string().describe('The ID of the product to update.'),
    operations: z.array(z.object({}).passthrough()).describe('The PATCH operations to perform on the product.'),
  });

export const createShipmentParameters = (context: Context) =>
  z.object({
    order_id: z.string().regex(ORDER_ID_REGEX, "Invalid PayPal Order ID").describe('The ID of the order for which to create a shipment').optional(),
    tracking_number: z.string().describe('The tracking number for the shipment. Id is provided by the shipper. This is required to create a shipment.'),
    transaction_id: z.string().regex(TRANSACTION_ID_REGEX, "Invalid PayPal Transaction ID").describe('The transaction ID associated with the shipment. Transaction id available after the order is paid or captured. This is required to create a shipment.'),
    status: z.string().optional().describe('The status of the shipment. It can be "ON_HOLD", "SHIPPED", "DELIVERED", or "CANCELLED".').default("SHIPPED"),
    carrier: z.string().optional().describe('The carrier handling the shipment.'),
  });

export const getShipmentTrackingParameters = (context: Context) =>
  z.object({
    order_id: z.string().regex(ORDER_ID_REGEX, "Invalid PayPal Order ID").describe('The ID of the order for which to create a shipment.').optional(),
    transaction_id: z.string().regex(TRANSACTION_ID_REGEX, "Invalid PayPal Transaction ID").describe('The transaction ID associated with the shipment tracking to retrieve.').optional(),
  });

export const updateShipmentTrackingParameters = (context: Context) =>
  z.object({
    transaction_id: z.string().regex(TRANSACTION_ID_REGEX, "Invalid PayPal Transaction ID").describe('The transaction ID associated with the shipment tracking to retrieve.'),
    tracking_number: z.string().describe('The tracking number that you want to update.'),
    new_tracking_number: z.string().describe('The new tracking number for the shipment if being updated.').optional(),
    status: z.string().describe('The status of the item shipment. It can be "CANCELLED", "DELIVERED", "LOCAL_PICKUP", "ON_HOLD", or "SHIPPED".'),
    carrier: z.string().describe('The carrier handling the shipment.').optional(),
  })

// === ORDER PARAMETERS ===
/**
 * Parameters are defined and exported both as Type and as ZodSchema to avoid runtime conversions.
 */

const itemDetails = z.object({
  itemCost: z.number().describe('The cost of each item - upto 2 decimal points.'),
  taxPercent: z.number().describe('The tax percent for the specific item.').default(0),
  itemTotal: z.number().describe('The total cost of this line item.'),
});

const lineItem = z.object({
  name: z.string().describe('The name of the item.'),
  quantity: z.number().describe('The item quantity. Must be a whole number.').default(1),
  description: z.string().describe('The detailed item description.').optional(),
}).merge(itemDetails); // Merge itemDetails into lineItem

const shippingAddress = z.object({
  address_line_1: z.string().describe('The first line of the address, such as number and street, for example, `173 Drury Lane`.This field needs to pass the full address.').optional(),
  address_line_2: z.string().describe(`The second line of the address, for example, a suite or apartment number.`).optional(),
  admin_area_2: z.string().describe('A city, town, or village. Smaller than `admin_area_level_1`.').optional(),
  admin_area_1: z.string().describe('The highest-level sub-division in a country, which is usually a province, state, or ISO-3166-2 subdivision. ').optional(),
  postal_code: z.string().describe('The postal code, which is the ZIP code or equivalent. Typically required for countries with a postal code or an equivalent.').optional(),
  country_code: z.string().describe('The 2-character ISO 3166-1 code that identifies the country or region. Note: The country code for Great Britain is `GB` and not `UK` as used in the top-level domain names for that country.').length(2).optional()
}).describe('The shipping address for the order.')

export const createOrderParameters = (context: Context) => z.object({
  currencyCode: z.enum(['USD']).describe('Currency code of the amount.'),
  items: z.array(z.lazy(() => lineItem)).max(50),
  discount: z.number().describe('The discount amount for the order.').default(0).optional(),
  shippingCost: z.number().describe('The cost of shipping for the order.').default(0).optional(),
  shippingAddress: z.optional(shippingAddress.nullable()).default(null).describe('The shipping address for the order.'),
  notes: z.string().optional().nullable().default(null),
  returnUrl: z.string().optional().default('https://example.com/returnUrl'),
  cancelUrl: z.string().optional().default('https://example.com/cancelUrl')
});

export const getOrderParameters = (context: Context) => z.object({
  id: z.string().regex(ORDER_ID_REGEX, "Invalid PayPal Order ID").describe('The order id generated during create call'),
});

export const captureOrderParameters = (context: Context) => z.object({
  id: z.string().regex(ORDER_ID_REGEX, "Invalid PayPal Order ID").describe('The order id generated during create call'),
});

// === Disputes Parameters ===

export const listDisputesParameters = (context: Context) => z.object({
  disputed_transaction_id: z.string().regex(TRANSACTION_ID_REGEX, "Invalid PayPal Dispute ID").nullable().default(null),
  dispute_state: z.enum([
    "REQUIRED_ACTION",
    "REQUIRED_OTHER_PARTY_ACTION",
    "UNDER_PAYPAL_REVIEW",
    "RESOLVED",
    "OPEN_INQUIRIES",
    "APPEALABLE"]).optional().describe("OPEN_INQUIRIES"),
  page_size: z.number().min(1).max(50).default(10).optional(),
  page: z.number().min(1).max(1000).default(1).optional()
});

export const getDisputeParameters = (context: Context) => z.object({
  dispute_id: z.string().regex(DISPUTE_ID_REGEX, "Invalid PayPal Dispute ID").describe('The order id generated during create call'),
})

export const acceptDisputeClaimParameters = (context: Context) => z.object({
  dispute_id: z.string(),
  note: z.string().regex(DISPUTE_ID_REGEX, "Invalid PayPal Dispute ID").describe("A note about why the seller is accepting the claim"),
});

// === Transaction Search ===

export const listTransactionsParameters = (context: Context) => z.object({
  transaction_id: z.string().regex(TRANSACTION_ID_REGEX, "Invalid PayPal Transaction ID").optional().describe('The ID of the transaction to retrieve.').nullable().default(null),
  transaction_status: z.enum([
    "D",
    "P",
    "S",
    "V"]).optional().default("S"),
  start_date: z.string().describe('Filters the transactions in the response by a start date and time, in ISO8601 date and time format. Seconds are required. Fractional seconds are optional.').optional()    .default(() => {
    const now = new Date();
    now.setDate(now.getDate() - 31); // default to 31 days ago
    return now.toISOString();
  }),
  end_date: z.string().describe('Filters the transactions in the response by an end date and time, in ISO8601 date and time format. Seconds are required. Fractional seconds are optional. The maximum supported range is 31 days.').optional().default(() => {
    const now = new Date();
    now.setDate(now.getDate());
    return now.toISOString();
  }),
  search_months: z.number().optional().describe('Number of months to search back for a transaction by ID. Default is 12 months.').default(12),
  page_size: z.number().min(1).max(500).default(100).optional(),
  page: z.number().min(1).max(10000).default(1).optional()
});


//== PRODUCT PARAMETERS ===
export const createProductParameters = (context: Context) => z.object({
  name: z.string().describe('The product name.'),
  type: z.enum(['PHYSICAL', 'DIGITAL', 'SERVICE']).describe('The product type. Value is PHYSICAL, DIGITAL, or SERVICE.'),
  description: z.string().optional().describe('The product description.'),
  category: z.string().optional().describe('The product category.'),
  image_url: z.string().optional().describe('The image URL for the product.'),
  home_url: z.string().optional().describe('The home page URL for the product.'),
});

export const listProductsParameters = (context: Context) => z.object({
  page: z.number().min(1).max(100000).optional().describe('The page number of the result set to fetch.'),
  page_size: z.number().min(1).max(20).optional().describe('The number of records to return per page (maximum 100).'),
  total_required: z.boolean().optional().describe('Indicates whether the response should include the total count of products.'),
});

export const showProductDetailsParameters = (context: Context) => z.object({
  product_id: z.string().regex(PRODUCT_ID_REGEX, "Invalid PayPal Product ID").describe('The ID of the product to update.'),
});

// === SUBSCRIPTION PLAN PARAMETERS ===
const frequencySchema = z.object({
  interval_unit: z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR']).describe('The unit of time for the billing cycle.'),
  interval_count: z.number().describe('The number of units for the billing cycle.'),
}).passthrough();

const fixedPriceSchema = z.object({
  currency_code: z.enum(['USD']).describe('The currency code for the fixed price.'),
  value: z.string().describe('The value of the fixed price.'),
}).passthrough().optional().describe('The fixed price for the subscription plan.')

const pricingSchemeSchema = z.object({
  fixed_price: fixedPriceSchema,
  version: z.string().optional().describe('The version of the pricing scheme.'),
}).passthrough();

const billingCycleSchema = z.object({
  frequency: frequencySchema.describe('The frequency of the billing cycle.'),
  tenure_type: z.enum(['REGULAR', 'TRIAL']).describe('The type of billing cycle tenure.'),
  sequence: z.number().describe('The sequence of the billing cycle.'),
  total_cycles: z.number().optional().describe('The total number of cycles in the billing plan.'),
  pricing_scheme: pricingSchemeSchema.describe('The pricing scheme for the billing cycle.'),
}).passthrough();

const setupFeeSchema = z.object({
  currency_code: z.enum(['USD']).optional().describe('The currency code for the setup fee.'),
  value: z.string().optional().describe('The value of the setup fee.'),
}).passthrough().optional();

const autoBillOutstandingSchema = z.boolean().optional().describe('Indicates whether to automatically bill outstanding amounts.');
const paymentFailureThresholdSchema = z.number().optional().describe('The number of failed payments before the subscription is canceled.');


const paymentPreferencesSchema = z.object({
  auto_bill_outstanding: autoBillOutstandingSchema,
  setup_fee: setupFeeSchema.describe('The setup fee for the subscription plan.'),
  setup_fee_failure_action: z.enum(['CONTINUE', 'CANCEL']).optional().describe('The action to take if the setup fee payment fails.'),
  payment_failure_threshold: paymentFailureThresholdSchema,
}).passthrough().optional();

const taxPercentageSchema = z.string().optional().describe('The tax percentage.');
const taxInclusiveSchema = z.boolean().optional().describe('Indicates whether the tax is inclusive.');

const taxesSchema = z.object({
  percentage: taxPercentageSchema,
  inclusive: taxInclusiveSchema,
}).passthrough().optional();

export const createSubscriptionPlanParameters = (context: Context) => z.object({
  product_id: z.string().describe('The ID of the product for which to create the plan.'),
  name: z.string().describe('The subscription plan name.'),
  description: z.string().optional().describe('The subscription plan description.'),
  billing_cycles: z.array(billingCycleSchema).describe('The billing cycles of the plan.'),
  payment_preferences: paymentPreferencesSchema.describe('The payment preferences for the subscription plan.'),
  taxes: taxesSchema.describe('The tax details.'),
});

export const listSubscriptionPlansParameters = (context: Context) => z.object({
  product_id: z.string().optional().describe('The ID of the product for which to get subscription plans.'),
  page: z.number().min(1).max(100000).optional().describe('The page number of the result set to fetch.'),
  page_size: z.number().min(1).max(20).optional().describe('The number of records to return per page (maximum 100).'),
  total_required: z.boolean().optional().describe('Indicates whether the response should include the total count of plans.'),
});

export const showSubscriptionPlanDetailsParameters = (context: Context) => z.object({
  plan_id: z.string().regex(PLAN_ID_REGEX, "Invalid PayPal Plan ID").describe('The ID of the subscription plan to show.'),
});

// === SUBSCRIPTION PARAMETERS ===
const NameSchema = z.object({
  given_name: z.string().optional().describe('The subscriber given name.'),
  surname: z.string().optional().describe('The subscriber last name.'),
}).optional().describe('The subscriber name.');

const AddressSchema = z.object({
  address_line_1: z.string().describe('The first line of the address.'),
  address_line_2: z.string().optional().describe('The second line of the address.'),
  admin_area_1: z.string().describe('The city or locality.'),
  admin_area_2: z.string().describe('The state or province.'),
  postal_code: z.string().describe('The postal code.'),
  country_code: z.enum(['US']).describe('The country code.'),
}).optional().describe('The shipping address.');

const ShippingAddressSchema = z.object({
  name: NameSchema.describe('The subscriber shipping address name.'),
  address: AddressSchema,
}).optional().describe('The subscriber shipping address.');

const PaymentMethodSchema = z.object({
  payer_selected: z.enum(['PAYPAL', 'CREDIT_CARD']).describe('The payment method selected by the payer.'),
  payee_preferred: z.enum(['IMMEDIATE_PAYMENT_REQUIRED', 'INSTANT_FUNDING_SOURCE']).optional().describe('The preferred payment method for the payee.'),
}).optional().describe('The payment method details.');

const ShippingAmount = z.object({
  currency_code: z.enum(['USD']).describe('The currency code for the shipping amount.'),
  value: z.string().describe('The value of the shipping amount.'),
}).optional().describe('The shipping amount for the subscription.');

const Subscriber = z.object({
  name: NameSchema,
  email_address: z.string().optional().describe('The subscriber email address.'),
  shipping_address: ShippingAddressSchema,
}).optional().describe('The subscriber details.');

const ApplicationContext = z.object({
  brand_name: z.string().describe('The brand name.'),
  locale: z.string().optional().describe('The locale for the subscription.'),
  shipping_preference: z.enum(['SET_PROVIDED_ADDRESS', 'GET_FROM_FILE']).optional().describe('The shipping preference.'),
  user_action: z.enum(['SUBSCRIBE_NOW', 'CONTINUE']).optional().describe('The user action.'),
  return_url: z.string().describe('The return URL after the subscription is created.'),
  cancel_url: z.string().describe('The cancel URL if the user cancels the subscription.'),
  payment_method: PaymentMethodSchema,
}).optional().describe('The application context for the subscription.');


export const createSubscriptionParameters = (context: Context) => z.object({
  plan_id: z.string().describe('The ID of the subscription plan to create.'),
  quantity: z.number().optional().describe('The quantity of the product in the subscription.'),
  shipping_amount: ShippingAmount,
  subscriber: Subscriber,
  application_context: ApplicationContext,
});

export const showSubscriptionDetailsParameters = (context: Context) => z.object({
  subscription_id: z.string().regex(SUBSCRIPTION_ID_REGEX, "Invalid PayPal Subscription ID").describe('The ID of the subscription to show details.'),
  get_additional_details: z.boolean().optional().describe('Get all detailed information for the subscription.'),
});

export const cancelSubscriptionParameters = (context: Context) => z.object({
  subscription_id: z.string().regex(SUBSCRIPTION_ID_REGEX, "Invalid PayPal Subscription ID").describe('The ID of the subscription to show details.'),
  payload: z.object({
    reason: z.string().describe('The reason for the cancellation of a subscription.'),
  }).passthrough().describe('Payload for subscription cancellation.'),
});


export const updatePlanParameters = (context: Context) =>
  z.object({
    plan_id: z.string().regex(PLAN_ID_REGEX, "Invalid PayPal Plan ID").describe('The ID of the plan to update.'),
    description: z.string().optional().describe('Plan description.'),
    auto_bill_outstanding: z.string().optional().describe('Auto bill outstanding'),
    percentage: z.string().optional().describe('Taxes percentage'),
    payment_failure_threshold: z.string().optional().describe('Payment failure threshold'),
    setup_fee: z.object({
      value: z.string().describe('The setup fee amount.'),
      currency_code: z.string().describe('The currency code for the setup fee.')
    }).optional().describe('Setup fee'),
    setup_fee_failure_action: z.string().optional().describe('Setup fee failure action'),
    name: z.string().optional().describe('Plan name'),
    operations: z.string().describe('The PATCH operations to perform on the plan'),
  });


export const updateSubscriptionParameters = (context: Context) => z.object({
  [subscriptionKeys.subscriptionId]: z.string().regex(SUBSCRIPTION_ID_REGEX, "Invalid PayPal Subscription ID").describe('The ID of the subscription to update.'),
  [subscriptionKeys.currencyCode]: z.enum(['USD']).optional().default("USD").describe('Currency code of the amount.'),
  [subscriptionKeys.outstandingBalance]: z.string().optional().describe('Outstanding Balance in the subscription'),
  [subscriptionKeys.customId]: z.string().optional().describe("The custom id for the subscription"),
  [subscriptionKeys.fixedPrice]: z.object({
    value: z.string().describe('The fixed price for the subscription.'),
    sequence: z.number().describe('The order sequence for the billing cycles'),
  }).optional().describe('The fixed price for a billing cycle.'),
  [subscriptionKeys.paymentFailureThreshold]: paymentFailureThresholdSchema,
  [subscriptionKeys.autoBillOutstanding]: autoBillOutstandingSchema,
  [subscriptionKeys.taxesInclusive]: taxInclusiveSchema,
  [subscriptionKeys.taxesPercentage]: taxPercentageSchema,
  [subscriptionKeys.shippingAmount]: z.string().optional().describe('The value of the shipping amount.'),
  [subscriptionKeys.shippingAddress]: ShippingAddressSchema.optional().describe('The shipping address.'),
})

// === REFUND PARAMETERS ===

export const getRefundParameters = (context: Context) => z.object({
  refund_id: z.string().regex(REFUND_ID_REGEX, "Invalid refund ID").describe('The ID of the refund to get details for.'),
});

export const createRefundParameters = (context: Context) => z.object({
  capture_id: z.string().regex(CAPTURE_ID_REGEX, "Invalid Transaction ID").describe('The ID of the capture to refund.'),
  amount: z.object({
    currency_code: z.string(),
    value: z.string(),
  }).optional().describe('The amount to refund. If not specified, the full captured amount is refunded.'),
  invoice_id: z.string().regex(INVOICE_ID_REGEX, "Invalid PayPal Invoice ID").optional().describe('The invoice ID that is used to track this payment.'),
  note_to_payer: z.string().optional().describe('A note to the payer.'),
});

export const getMerchantInsightsParameters = (context: Context) => z.object({
  start_date: z.string().describe('The start date range to filter insights'),
  end_date: z.string().describe('The end date range to filter insights'),
  insight_type: z.string().describe('The type of insight to retrieve. It can be "ORDERS" or "SALES"'),
  time_interval: z.string().describe('The time periods used for segmenting metrics data. It can be "DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", or "YEARLY"'),
})


