/**
 * Validation helper functions for PayPal Payment Links
 *
 * These functions help identify API limitations before making requests,
 * providing clear error messages that align with PayPal API behavior.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  field?: string;
}

export interface Tax {
  name?: string;
  type: 'PERCENTAGE' | 'PREFERENCE';
  value: string;
}

export interface Shipping {
  type: 'FLAT' | 'PREFERENCE';
  value: string;
}

export interface Dimension {
  name: string;
  primary: boolean;
  options: Array<{
    label: string;
    unit_amount?: {
      currency_code: string;
      value: string;
    };
    [key: string]: any;
  }>;
}

export interface Variants {
  dimensions: Dimension[];
}

export interface LineItem {
  name: string;
  unit_amount?: {
    currency_code: string;
    value: string;
  };
  taxes?: Tax[];
  shipping?: Shipping[];
  variants?: Variants;
  [key: string]: any;
}

/**
 * Validate tax configuration
 *
 * Validates tax values are correct for their type.
 * Note: Type enum is now restricted at schema level to PERCENTAGE and PREFERENCE only.
 */
export function validateTaxConfig(taxes?: Tax[]): ValidationResult {
  if (!taxes || taxes.length === 0) {
    return { valid: true };
  }

  // Validate PERCENTAGE values are numeric
  const percentageTaxes = taxes.filter(t => t.type === 'PERCENTAGE');
  for (const tax of percentageTaxes) {
    const value = parseFloat(tax.value);
    if (isNaN(value) || value < 0 || value > 100) {
      return {
        valid: false,
        error: `Tax percentage value must be a number between 0 and 100. Got: "${tax.value}"`,
        field: 'taxes[].value'
      };
    }
  }

  // Validate PREFERENCE values
  const preferenceTaxes = taxes.filter(t => t.type === 'PREFERENCE');
  for (const tax of preferenceTaxes) {
    if (tax.value !== 'PROFILE') {
      return {
        valid: false,
        error: `Tax PREFERENCE type requires value "PROFILE". Got: "${tax.value}"`,
        field: 'taxes[].value'
      };
    }
  }

  return { valid: true };
}

/**
 * Validate shipping configuration
 *
 * Validates shipping values are correct for their type.
 * Note: Type enum is now restricted at schema level to FLAT and PREFERENCE only.
 */
export function validateShippingConfig(shipping?: Shipping[]): ValidationResult {
  if (!shipping || shipping.length === 0) {
    return { valid: true };
  }

  // Validate FLAT values are numeric
  const flatShipping = shipping.filter(s => s.type === 'FLAT');
  for (const ship of flatShipping) {
    const value = parseFloat(ship.value);
    if (isNaN(value) || value < 0) {
      return {
        valid: false,
        error: `Shipping FLAT value must be a non-negative number. Got: "${ship.value}"`,
        field: 'shipping[].value'
      };
    }
  }

  // Validate PREFERENCE values
  const preferenceShipping = shipping.filter(s => s.type === 'PREFERENCE');
  for (const ship of preferenceShipping) {
    if (ship.value !== 'PROFILE') {
      return {
        valid: false,
        error: `Shipping PREFERENCE type requires value "PROFILE". Got: "${ship.value}"`,
        field: 'shipping[].value'
      };
    }
  }

  return { valid: true };
}

/**
 * Validate variant configuration
 *
 * Requirements:
 * - Must have exactly 1 primary dimension
 * - Cannot have unit_amount at both product level and variant option level
 */
export function validateVariants(lineItem: LineItem): ValidationResult {
  if (!lineItem.variants) {
    return { valid: true };
  }

  const { dimensions } = lineItem.variants;

  // Check primary dimension count
  const primaryDimensions = dimensions.filter(d => d.primary);

  if (primaryDimensions.length === 0) {
    return {
      valid: false,
      error: 'Expected exactly 1 primary dimension, found 0. Set one dimension to primary: true',
      field: 'variants.dimensions[].primary'
    };
  }

  if (primaryDimensions.length > 1) {
    return {
      valid: false,
      error: `Expected exactly 1 primary dimension, found ${primaryDimensions.length}. Only one dimension can have primary: true, others must be primary: false`,
      field: 'variants.dimensions[].primary'
    };
  }

  // Check for pricing conflicts
  const hasVariantPricing = dimensions.some(d =>
    d.options.some(o => o.unit_amount !== undefined)
  );

  if (hasVariantPricing && lineItem.unit_amount) {
    return {
      valid: false,
      error: 'Cannot specify unit_amount at both product level and variant option level. Remove unit_amount from the product level OR from all variant options.',
      field: 'unit_amount / variants.dimensions[].options[].unit_amount'
    };
  }

  // Validate dimension count
  if (dimensions.length < 1 || dimensions.length > 5) {
    return {
      valid: false,
      error: `Variants must have 1-5 dimensions. Found ${dimensions.length}`,
      field: 'variants.dimensions'
    };
  }

  // Validate options count per dimension
  for (let i = 0; i < dimensions.length; i++) {
    const dim = dimensions[i];
    if (dim.options.length < 1 || dim.options.length > 10) {
      return {
        valid: false,
        error: `Dimension "${dim.name}" must have 1-10 options. Found ${dim.options.length}`,
        field: `variants.dimensions[${i}].options`
      };
    }
  }

  return { valid: true };
}

/**
 * Validate currency code and amount
 */
export function validateCurrency(currencyCode: string, value: string): ValidationResult {
  // Check currency code length
  if (currencyCode.length !== 3) {
    return {
      valid: false,
      error: `Currency code must be 3 characters (ISO-4217). Got: "${currencyCode}"`,
      field: 'unit_amount.currency_code'
    };
  }

  // Check if value is numeric
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return {
      valid: false,
      error: `Currency value must be a valid number. Got: "${value}"`,
      field: 'unit_amount.value'
    };
  }

  // Special validation for zero-decimal currencies (JPY, KRW, etc.)
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'TWD', 'PYG'];

  if (zeroDecimalCurrencies.includes(currencyCode.toUpperCase())) {
    if (value.includes('.')) {
      return {
        valid: false,
        error: `${currencyCode} is a zero-decimal currency and should not have decimal places. Use whole numbers (e.g., "15000" not "15000.00")`,
        field: 'unit_amount.value'
      };
    }
  }

  // Check decimal places (max 3)
  const decimalPart = value.split('.')[1];
  if (decimalPart && decimalPart.length > 3) {
    return {
      valid: false,
      error: `Currency value supports up to 3 decimal places. Got ${decimalPart.length} decimal places in "${value}"`,
      field: 'unit_amount.value'
    };
  }

  return { valid: true };
}

/**
 * Validate reusable mode
 *
 * Note: Reusable is now restricted at schema level to "MULTIPLE" only.
 * This validation is kept for consistency but should not trigger with proper typing.
 */
export function validateReusableMode(reusable: string, type: string): ValidationResult {
  if (reusable !== 'MULTIPLE') {
    return {
      valid: false,
      error: `Reusable must be "MULTIPLE". Got: "${reusable}"`,
      field: 'reusable'
    };
  }

  return { valid: true };
}

/**
 * Validate payment link type
 */
export function validatePaymentLinkType(type: string): ValidationResult {
  const supportedTypes = ['BUY_NOW'];

  if (!supportedTypes.includes(type)) {
    return {
      valid: false,
      error: `Payment link type must be one of: ${supportedTypes.join(', ')}. Got: "${type}"`,
      field: 'type'
    };
  }

  return { valid: true };
}

/**
 * Validate complete line item
 *
 * Runs all validations on a line item.
 */
export function validateLineItem(lineItem: LineItem): ValidationResult {
  // Validate taxes
  const taxResult = validateTaxConfig(lineItem.taxes);
  if (!taxResult.valid) {
    return taxResult;
  }

  // Validate shipping
  const shippingResult = validateShippingConfig(lineItem.shipping);
  if (!shippingResult.valid) {
    return shippingResult;
  }

  // Validate variants
  const variantsResult = validateVariants(lineItem);
  if (!variantsResult.valid) {
    return variantsResult;
  }

  // Validate currency if unit_amount exists
  if (lineItem.unit_amount) {
    const currencyResult = validateCurrency(
      lineItem.unit_amount.currency_code,
      lineItem.unit_amount.value
    );
    if (!currencyResult.valid) {
      return currencyResult;
    }
  } else if (!lineItem.variants) {
    // If no unit_amount and no variants, that's an error
    return {
      valid: false,
      error: 'Line item must have either unit_amount (product-level pricing) or variants with pricing in options',
      field: 'unit_amount'
    };
  }

  return { valid: true };
}

/**
 * Validate complete payment link creation request
 */
export function validateCreatePaymentLink(params: {
  type: string;
  reusable?: string;
  line_items: LineItem[];
  [key: string]: any;
}): ValidationResult {
  // Validate type
  const typeResult = validatePaymentLinkType(params.type);
  if (!typeResult.valid) {
    return typeResult;
  }

  // Validate reusable
  const reusableValue = params.reusable || 'MULTIPLE';
  const reusableResult = validateReusableMode(reusableValue, params.type);
  if (!reusableResult.valid) {
    return reusableResult;
  }

  // Validate line items exist
  if (!params.line_items || params.line_items.length === 0) {
    return {
      valid: false,
      error: 'At least one line item is required',
      field: 'line_items'
    };
  }

  // Validate each line item
  for (let i = 0; i < params.line_items.length; i++) {
    const itemResult = validateLineItem(params.line_items[i]);
    if (!itemResult.valid) {
      return {
        ...itemResult,
        field: `line_items[${i}].${itemResult.field}`
      };
    }
  }

  return { valid: true };
}
