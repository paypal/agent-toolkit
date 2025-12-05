from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Any, Dict, Literal


class UnitAmount(BaseModel):
    currency_code: str = Field(..., min_length=3, max_length=3, description="The three-character ISO-4217 currency code (e.g., USD, EUR, GBP, JPY, CAD, AUD). Note: JPY is a zero-decimal currency - use whole numbers without decimal points.")
    value: str = Field(..., max_length=32, pattern=r"^((-?[0-9]+)|(-?([0-9]+)?[.][0-9]+))$", description="The monetary value. Supports up to 3 decimal places for most currencies. For JPY, use whole numbers (e.g., '15000' not '15000.00'). Examples: '29.99', '15000', '9.995'")


class Tax(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=127, description="Internal label for this tax (e.g., 'Sales Tax', 'VAT', 'GST'). Not visible to customer during checkout.")
    type: Literal['PERCENTAGE', 'PREFERENCE'] = Field(..., description="Tax calculation method. PERCENTAGE: percentage of price (e.g., 8.5% tax). PREFERENCE: uses account default tax settings.")
    value: str = Field(..., min_length=1, max_length=20, description="Tax value. For PERCENTAGE: enter numeric percentage (e.g., '8.5' for 8.5% tax rate). For PREFERENCE: must be 'PROFILE' to use account defaults. Maximum 20 characters.")


class Shipping(BaseModel):
    type: Literal['FLAT', 'PREFERENCE'] = Field(..., description="Shipping calculation method. FLAT: fixed amount (e.g., $9.99 flat rate). PREFERENCE: uses account default shipping settings.")
    value: str = Field(..., min_length=1, max_length=20, description="Shipping value. For FLAT: enter fixed cost (e.g., '9.99' for $9.99 shipping). For PREFERENCE: must be 'PROFILE' to use account defaults. Maximum 20 characters.")


class CustomerNote(BaseModel):
    required: Optional[bool] = Field(None, description="When true, customer must provide input before checkout. When false, input is optional. Use for collecting gift messages, custom instructions, engraving text, etc.")
    label: Optional[str] = Field(None, min_length=1, max_length=127, description="The label displayed to customers for this custom input field. Examples: 'Gift message', 'Special instructions', 'Engraving text', 'Delivery notes'")


class VariantOption(BaseModel):
    """Variant option structure - using passthrough to allow flexible fields"""
    class Config:
        extra = "allow"


class Dimension(BaseModel):
    name: str = Field(..., min_length=1, max_length=64, description="The name of this variant dimension. Examples: 'Size', 'Color', 'Material', 'Style'. Maximum 64 characters.")
    primary: bool = Field(..., description="IMPORTANT: Exactly ONE dimension must have primary: true, all others must be primary: false. The primary dimension typically contains the main product variation and can include pricing in options. Common pattern: Size=primary, Color=non-primary.")
    options: List[Dict[str, Any]] = Field(..., min_items=1, max_items=10, description="Array of variant options (1-10 options). Each option can have: label (required), unit_amount (optional - only if no product-level unit_amount). Example: [{'label': 'Small'}, {'label': 'Medium'}, {'label': 'Large'}]")


class Variants(BaseModel):
    dimensions: List[Dimension] = Field(..., min_items=1, max_items=5, description="List of variant dimensions (1-5 dimensions). Must have exactly 1 primary dimension. Additional dimensions must be non-primary. Example: Size (primary) + Color (non-primary) for t-shirts.")


class AdjustableQuantity(BaseModel):
    maximum: int = Field(..., ge=1, le=100, description="Maximum quantity customers can select (1-100). Use 1 for limited edition items, higher values for bulk products. Examples: 1 for unique items, 10 for regular products, 100 for wholesale.")


class LineItem(BaseModel):
    name: str = Field(..., min_length=1, max_length=127, description="The product or service name displayed to customers during checkout")
    product_id: Optional[str] = Field(None, min_length=1, max_length=50, description="Your internal identifier for this product or SKU")
    description: Optional[str] = Field(None, min_length=1, max_length=2048, description="Detailed information about the product or service shown to customers during checkout")
    unit_amount: UnitAmount = Field(..., description="The currency and amount for this line item. IMPORTANT: If using variants with pricing in options, this field should be omitted OR set to the base price. Cannot have unit_amount at both product level and variant option level.")
    taxes: Optional[List[Tax]] = Field(None, max_items=1, description="Tax configuration for this item (maximum 1). Tax is displayed separately during checkout.")
    shipping: Optional[List[Shipping]] = Field(None, max_items=1, description="Shipping configuration for this item (maximum 1). Shipping fee is displayed separately during checkout.")
    collect_shipping_address: Optional[bool] = Field(None, description="Set to true to prompt customers for a shipping address during checkout. Required for physical goods that need to be shipped. Default: false")
    customer_notes: Optional[List[CustomerNote]] = Field(None, max_items=1, description="Custom field to collect additional information from customers about this item (maximum 1 field per item). Useful for personalization, special requests, or delivery instructions.")
    variants: Optional[Variants] = Field(None, description="Product variants configuration for size, color, material, etc. IMPORTANT: If variants have unit_amount in options, do NOT include product-level unit_amount (causes validation error). If variants have NO pricing, product-level unit_amount is REQUIRED.")
    adjustable_quantity: Optional[AdjustableQuantity] = Field(None, description="Enables quantity selection during checkout. Customers can choose from 1 up to the maximum. Useful for allowing bulk purchases or limiting quantities for special items.")


# Payment Link ID validation pattern
PAYMENT_LINK_ID_REGEX = r"^PLB-[A-Z0-9]{12,16}$"


class CreatePaymentLinkParameters(BaseModel):
    integration_mode: str = Field(default="LINK", description="The integration mode for the payment link. Default and recommended: 'LINK'. This determines how the payment link is presented.")
    type: str = Field(..., description="The type of payment link. Use 'BUY_NOW' for standard e-commerce purchases (fully supported).")
    reusable: Literal['MULTIPLE'] = Field(default="MULTIPLE", description="Determines link reusability. For BUY_NOW type, must be set to 'MULTIPLE' to enable sharing and multiple uses across different customers.")
    return_url: Optional[str] = Field(None, description="Optional URL to redirect customers after successful payment. Example: 'https://yoursite.com/thank-you'. If omitted, customers will stay in PayPal default success page")
    line_items: List[LineItem] = Field(..., min_items=1, description="AArray of products/services in this payment link. Currently supports exactly 1 item. Each item represents a product with pricing, taxes, shipping, and optional variants.")


class ListPaymentLinksParameters(BaseModel):
    """Parameters for listing payment links"""
    page: Optional[int] = Field(1, ge=1, le=1000, description="Page number to retrieve (1-1000). Default: 1. Use for pagination when you have many payment links.")
    page_size: Optional[int] = Field(10, ge=1, le=100, description="Number of payment links per page (1-100). Default: 10. Increase for bulk operations, decrease for faster responses.")
    total_required: Optional[bool] = Field(None, description="Set to true to include total count of all payment links in response. Useful for pagination UI. Default: false (faster response).")


class GetPaymentLinkParameters(BaseModel):
    """Parameters for retrieving a specific payment link"""
    payment_link_id: str = Field(..., pattern=PAYMENT_LINK_ID_REGEX, description="The PayPal Payment Link ID to retrieve. Format: PLB-XXXXXXXXXXXX (PLB- prefix followed by 12-16 alphanumeric characters). Example: 'PLB-1A2B3C4D5E6F'")


class UpdatePaymentLinkParameters(BaseModel):
    """Parameters for updating a payment link (full replacement)"""
    payment_link_id: str = Field(..., pattern=PAYMENT_LINK_ID_REGEX, description="The PayPal Payment Link ID to update. Format: PLB-XXXXXXXXXXXX (PLB- prefix followed by 12-16 alphanumeric characters). Example: 'PLB-1A2B3C4D5E6F'")
    integration_mode: str = Field(default="LINK", description="The integration mode for the payment link. Default and recommended: 'LINK'.")
    type: str = Field(..., description="The type of payment link. Use 'BUY_NOW' for standard e-commerce purchases (fully supported). Note: 'DONATION' type has limited support and may cause validation errors.")
    reusable: Literal['MULTIPLE'] = Field(default="MULTIPLE", description="Determines link reusability. For BUY_NOW type, must be set to 'MULTIPLE' to enable sharing and multiple uses across different customers.")
    return_url: Optional[str] = Field(None, description="Optional URL to redirect customers after successful payment. Updates the return URL for this payment link.")
    line_items: List[LineItem] = Field(..., min_items=1, description="Complete array of line items for the payment link. This is a full replacement - all items must be provided, not just changes.")


class DeletePaymentLinkParameters(BaseModel):
    """Parameters for deleting a payment link"""
    payment_link_id: str = Field(..., pattern=PAYMENT_LINK_ID_REGEX, description="The PayPal Payment Link ID to delete permanently. Format: PLB-XXXXXXXXXXXX (PLB- prefix followed by 12-16 alphanumeric characters). ⚠️ WARNING: Deletion is permanent and cannot be undone.")
