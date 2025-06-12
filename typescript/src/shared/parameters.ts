import { z } from 'zod';
import type { Context } from './configuration';
import {subscriptionKeys} from "./constants";

// === INVOICE PARAMETERS ===
const invoiceItem = z.object({
  name: z.string().describe('The name of the item'),
  quantity: z.string().describe('The quantity of the item that the invoicer provides to the payer. Value is from -1000000 to 1000000. Supports up to five decimal places. Cast to string'),
  unit_amount: z.object({
    currency_code: z.string().describe('Currency code of the unit amount'),
    value: z.string().describe('The unit price. Up to 2 decimal points'),
  }).describe("unit amount object"),
  tax: z.object({
    name: z.string().optional().describe("Tax name"),
    percent: z.string().optional().describe("Tax Percent"),
  }).optional().describe("tax object"),
  unit_of_measure: z.enum(["QUANTITY", "HOURS", "AMOUNT"]).optional().describe("The unit of measure for the invoiced item"),
}).describe("invoice line item object");


export const createInvoiceParameters = (context: Context) => z.object({
  detail: z.object({
    invoice_date: z.string().optional().describe("The invoice date in YYYY-MM-DD format"),
    currency_code: z.string().describe("currency code of the invoice"),
  }).describe("The invoice detail"),
  invoicer: z.object({
    business_name: z.string().max(300).describe("business name of the invoicer"),
    name: z.object({
      given_name: z.string().optional().describe("given name of the invoicer"),
      surname: z.string().optional().describe("surname of the invoicer")
    }).optional().describe("name of the invoicer"),
    email_address: z.string().optional().describe("email address of the invoicer"),
  }).optional().describe("The invoicer business information that appears on the invoice."),
  primary_recipients: z.array(z.object({
    billing_info: z.object({
      name: z.object({
        given_name: z.string().optional().describe("given name of the recipient"),
        surname: z.string().optional().describe("surname of the recipient"),
      }).optional().describe("name of the recipient"),
      email_address: z.string().describe("email address of the recipient").optional(),
    }).describe("The billing information of the invoice recipient").optional(),
  })).describe("array of recipients").optional(),
  items: z.array(invoiceItem).describe("Array of invoice line items").optional(),
}).describe("create invoice request payload");

export const getInvoicParameters = (context: Context) => z.object({
  invoice_id: z.string().describe('The ID of the invoice to retrieve.'),
});

export const listInvoicesParameters = (context: Context) =>
  z.object({
    page: z.number().default(1).optional().describe('The page number of the result set to fetch.').default(1),
    page_size: z.number().min(1).max(100).default(100).optional().describe('The number of records to return per page (maximum 100).'),
    total_required: z.boolean().optional().describe('Indicates whether the response should include the total count of items.'),
  });

export const sendInvoiceParameters = (context: Context) =>
  z.object({
    invoice_id: z.string().describe('The ID of the invoice to send.'),
    note: z.string().optional().describe('A note to the recipient.'),
    send_to_recipient: z.boolean().optional().describe('Indicates whether to send the invoice to the recipient.'),
    additional_recipients: z.array(z.string()).optional().describe('Additional email addresses to which to send the invoice.'),
  });

export const sendInvoiceReminderParameters = (context: Context) =>
  z.object({
    invoice_id: z.string().describe('The ID of the invoice for which to send a reminder.'),
    subject: z.string().optional().describe('The subject of the reminder email.'),
    note: z.string().optional().describe('A note to the recipient.'),
    additional_recipients: z.array(z.string()).optional().describe('Additional email addresses to which to send the reminder.'),
  });

export const cancelSentInvoiceParameters = (context: Context) =>
  z.object({
    invoice_id: z.string().describe('The ID of the invoice to cancel.'),
    note: z.string().optional().describe('A cancellation note to the recipient.'),
    send_to_recipient: z.boolean().optional().describe('Indicates whether to send the cancellation to the recipient.'),
    additional_recipients: z.array(z.string()).optional().describe('Additional email addresses to which to send the cancellation.'),
  });

export const generateInvoiceQrCodeParameters = (context: Context) => z.object({
  invoice_id: z.string().describe('The invoice id to generate QR code for'),
  width: z.number().default(300).describe("The QR code width"),
  height: z.number().default(300).describe("The QR code height")
}).describe("generate invoice qr code request payload");


export const updateProductParameters = (context: Context) =>
  z.object({
    product_id: z.string().describe('The ID of the product to update.'),
    operations: z.array(z.object({}).passthrough()).describe('The PATCH operations to perform on the product.'),
  });

export const createShipmentParameters = (context: Context) =>
  z.object({
    order_id: z.string().describe('The ID of the order for which to create a shipment').optional(),
    tracking_number: z.string().describe('The tracking number for the shipment. Id is provided by the shipper. This is required to create a shipment.'),
    transaction_id: z.string().describe('The transaction ID associated with the shipment. Transaction id available after the order is paid or captured. This is required to create a shipment.'),
    status: z.string().optional().describe('The status of the shipment. It can be "ON_HOLD", "SHIPPED", "DELIVERED", or "CANCELLED".').default("SHIPPED"),
    carrier: z.string().optional().describe('The carrier handling the shipment.'),
  });

export const getShipmentTrackingParameters = (context: Context) =>
  z.object({
    order_id: z.string().describe('The ID of the order for which to create a shipment.').optional(),
    transaction_id: z.string().describe('The transaction ID associated with the shipment tracking to retrieve.').optional(),
  });

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
  id: z.string().describe('The order id generated during create call'),
});

export const captureOrderParameters = (context: Context) => z.object({
  id: z.string().describe('The order id generated during create call'),
});

// === Disputes Parameters ===

export const listDisputesParameters = (context: Context) => z.object({
  disputed_transaction_id: z.string().nullable().default(null),
  dispute_state: z.enum([
    "REQUIRED_ACTION",
    "REQUIRED_OTHER_PARTY_ACTION",
    "UNDER_PAYPAL_REVIEW",
    "RESOLVED",
    "OPEN_INQUIRIES",
    "APPEALABLE"]).optional().describe("OPEN_INQUIRIES"),
  page_size: z.number().default(10).optional(),
  page: z.number().default(1).optional()
});

export const getDisputeParameters = (context: Context) => z.object({
  dispute_id: z.string().describe('The order id generated during create call'),
})

export const acceptDisputeClaimParameters = (context: Context) => z.object({
  dispute_id: z.string(),
  note: z.string().describe("A note about why the seller is accepting the claim"),
});

// === Transaction Search ===

export const listTransactionsParameters = (context: Context) => z.object({
  transaction_id: z.string().optional().describe('The ID of the transaction to retrieve.').nullable().default(null),
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
  page_size: z.number().default(100).optional(),
  page: z.number().default(1).optional()
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
  page: z.number().optional().describe('The page number of the result set to fetch.'),
  page_size: z.number().optional().describe('The number of records to return per page (maximum 100).'),
  total_required: z.boolean().optional().describe('Indicates whether the response should include the total count of products.'),
});

export const showProductDetailsParameters = (context: Context) => z.object({
  product_id: z.string().describe('The ID of the product to update.'),
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
  page: z.number().optional().describe('The page number of the result set to fetch.'),
  page_size: z.number().optional().describe('The number of records to return per page (maximum 100).'),
  total_required: z.boolean().optional().describe('Indicates whether the response should include the total count of plans.'),
});

export const showSubscriptionPlanDetailsParameters = (context: Context) => z.object({
  plan_id: z.string().describe('The ID of the subscription plan to show.'),
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
  subscription_id: z.string().describe('The ID of the subscription to show details.'),
  get_additional_details: z.boolean().optional().describe('Get all detailed information for the subscription.'),
});

export const cancelSubscriptionParameters = (context: Context) => z.object({
  subscription_id: z.string().describe('The ID of the subscription to show details.'),
  payload: z.object({
    reason: z.string().describe('The reason for the cancellation of a subscription.'),
  }).passthrough().describe('Payload for subscription cancellation.'),
});

export const updateSubscriptionParameters = (context: Context) => z.object({
  [subscriptionKeys.subscriptionId]: z.string().describe('The ID of the subscription to update.'),
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
  refund_id: z.string().describe('The ID of the refund to get details for.'),
});

export const createRefundParameters = (context: Context) => z.object({
  capture_id: z.string().describe('The ID of the capture to refund.'),
  amount: z.object({
    currency_code: z.string(),
    value: z.string(),
  }).optional().describe('The amount to refund. If not specified, the full captured amount is refunded.'),
  invoice_id: z.string().optional().describe('The invoice ID that is used to track this payment.'),
  note_to_payer: z.string().optional().describe('A note to the payer.'),
});

