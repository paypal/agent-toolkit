

export enum subscriptionKeys {
  outstandingBalance = 'outstanding_balance',
  customId = 'custom_id',
  fixedPrice = 'fixed_price',
  paymentFailureThreshold = 'payment_failure_threshold',
  autoBillOutstanding = 'auto_bill_outstanding',
  taxesInclusive = 'taxes_inclusive',
  taxesPercentage = 'taxes_percentage',
  shippingAmount = 'shipping_amount',
  shippingAddress = 'shipping_address',
  subscriptionId = 'subscription_id',
  currencyCode = 'currency_code',
}


export const updateSubscriptionPathMapping: Record<string, string> = {
  [subscriptionKeys.outstandingBalance]: "/billing_info/outstanding_balance",
  [subscriptionKeys.customId]: "/custom_id",
  [subscriptionKeys.fixedPrice]: "/plan/billing_cycles/@sequence=={0}/pricing_scheme/fixed_price",
  [subscriptionKeys.paymentFailureThreshold]: "/plan/payment_preferences/payment_failure_threshold",
  [subscriptionKeys.autoBillOutstanding]: "/plan/payment_preferences/auto_bill_outstanding",
  [subscriptionKeys.taxesInclusive]: "/plan/taxes/inclusive",
  [subscriptionKeys.taxesPercentage]: "/plan/taxes/percentage",
  [subscriptionKeys.shippingAmount]: "/shipping_amount",
  [subscriptionKeys.shippingAddress]: "/subscriber/shipping_address"
}