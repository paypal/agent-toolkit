from pydantic import BaseModel, Field, HttpUrl, validator, field_validator, ConfigDict, constr
from typing import List, Literal, Optional



class ItemDetails(BaseModel):
    item_cost: float = Field(..., description="The cost of each item – up to 2 decimal points.")
    tax_percent: float = Field(0, description="The tax percent for the specific item.")
    item_total: float = Field(..., description="The total cost of this line item.")


class LineItem(ItemDetails):
    name: str = Field(..., description="The name of the item.")
    quantity: int = Field(
        1,
        description="The item quantity. Must be a whole number.",
        ge=1
    )
    description: Optional[str] = Field(
        None,
        description="The detailed item description."
    )


class ShippingAddress(BaseModel):
    address_line_1: Optional[str] = Field(
        None,
        description=(
            "The first line of the address, such as number and street, "
            "for example, `173 Drury Lane`. This field needs to pass the full address."
        )
    )
    address_line_2: Optional[str] = Field(
        None,
        description="The second line of the address, for example, a suite or apartment number."
    )
    admin_area_2: Optional[str] = Field(
        None,
        description="A city, town, or village. Smaller than `admin_area_level_1`."
    )
    admin_area_1: Optional[str] = Field(
        None,
        description=(
            "The highest-level sub-division in a country, which is usually a province, "
            "state, or ISO-3166-2 subdivision."
        )
    )
    postal_code: Optional[str] = Field(
        None,
        description=(
            "The postal code, which is the ZIP code or equivalent. Typically required "
            "for countries with a postal code or an equivalent."
        )
    )
    country_code: Optional[constr(min_length=2, max_length=2)] = Field(
        None,
        description=(
            "The 2-character ISO 3166-1 code that identifies the country or region. "
            "Note: The country code for Great Britain is `GB`."
        )
    )


class CreateOrderParameters(BaseModel):
    model_config = ConfigDict(validate_default=True)
    currency_code: Literal["USD"] = Field(
        ...,
        description="Currency code of the amount."
    )
    items: List[LineItem] = Field(
        ...,
        description="List of individual items in the order (max 50)."
    )
    discount: float = Field(
        0,
        description="The discount amount for the order."
    )
    shipping_cost: float = Field(
        0,
        description="The cost of shipping for the order."
    )
    shipping_address: Optional[ShippingAddress] = Field(
        None,
        description="The shipping address for the order."
    )
    notes: Optional[str] = Field(
        None,
        description="Optional customer notes or instructions."
    )
    return_url: Optional[HttpUrl] = Field(
        "https://example.com/returnUrl",
        description="URL to redirect the buyer after approval."
    )
    cancel_url: Optional[HttpUrl] = Field(
        "https://example.com/cancelUrl",
        description="URL to redirect the buyer if they cancel."
    )


class OrderIdParameters(BaseModel):
    order_id: str

class CaptureOrderParameters(BaseModel):
    order_id: str
    

class CreateProductParameters(BaseModel):
    name: str
    type: Literal['PHYSICAL', 'DIGITAL', 'SERVICE']  # Enum-like behavior for product type
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[HttpUrl] = None  # Ensures valid URL
    home_url: Optional[HttpUrl] = None  # Ensures valid URL

class ListProductsParameters(BaseModel):
    page: Optional[int] = None
    page_size: Optional[int] = None
    total_required: Optional[bool] = None

class ShowProductDetailsParameters(BaseModel):
    product_id: str

# Frequency Schema
class FrequencySchema(BaseModel):
    interval_unit: Literal['DAY', 'WEEK', 'MONTH', 'YEAR'] = Field(..., description="The unit of time for the billing cycle.")
    interval_count: int = Field(..., description="The number of units for the billing cycle.")

# Pricing Scheme Schema
class FixedPriceSchema(BaseModel):
    currency_code: Literal['USD'] = Field(..., description="The currency code for the fixed price.")
    value: str = Field(..., description="The value of the fixed price.")

class PricingSchemeSchema(BaseModel):
    fixed_price: Optional[FixedPriceSchema] = Field(None, description="The fixed price for the subscription plan.")
    version: Optional[str] = Field(None, description="The version of the pricing scheme.")

# Billing Cycle Schema
class BillingCycleSchema(BaseModel):
    frequency: FrequencySchema = Field(..., description="The frequency of the billing cycle.")
    tenure_type: Literal['REGULAR', 'TRIAL'] = Field(..., description="The type of billing cycle tenure.")
    sequence: int = Field(..., description="The sequence of the billing cycle.")
    total_cycles: Optional[int] = Field(None, description="The total number of cycles in the billing plan.")
    pricing_scheme: PricingSchemeSchema = Field(..., description="The pricing scheme for the billing cycle.")

# Setup Fee Schema
class SetupFeeSchema(BaseModel):
    currency_code: Optional[Literal['USD']] = Field(None, description="The currency code for the setup fee.")
    value: Optional[str] = Field(None, description="The value of the setup fee.")

# Payment Preferences Schema
class PaymentPreferencesSchema(BaseModel):
    auto_bill_outstanding: Optional[bool] = Field(None, description="Indicates whether to automatically bill outstanding amounts.")
    setup_fee: Optional[SetupFeeSchema] = Field(None, description="The setup fee for the subscription plan.")
    setup_fee_failure_action: Optional[Literal['CONTINUE', 'CANCEL']] = Field(None, description="The action to take if the setup fee payment fails.")
    payment_failure_threshold: Optional[int] = Field(None, description="The number of failed payments before the subscription is canceled.")

# Taxes Schema
class TaxesSchema(BaseModel):
    percentage: Optional[str] = Field(None, description="The tax percentage.")
    inclusive: Optional[bool] = Field(None, description="Indicates whether the tax is inclusive.")

# Create Subscription Plan Parameters
class CreateSubscriptionPlanParameters(BaseModel):
    product_id: str = Field(..., description="The ID of the product for which to create the plan.")
    name: str = Field(..., description="The subscription plan name.")
    description: Optional[str] = Field(None, description="The subscription plan description.")
    billing_cycles: List[BillingCycleSchema] = Field(..., description="The billing cycles of the plan.")
    payment_preferences: PaymentPreferencesSchema = Field(..., description="The payment preferences for the subscription plan.")
    taxes: Optional[TaxesSchema] = Field(None, description="The tax details.")

# List Subscription Plans Parameters
class ListSubscriptionPlansParameters(BaseModel):
    product_id: Optional[str] = Field(None, description="The ID of the product for which to get subscription plans.")
    page: Optional[int] = Field(None, description="The page number of the result set to fetch.")
    page_size: Optional[int] = Field(None, description="The number of records to return per page (maximum 100).")
    total_required: Optional[bool] = Field(None, description="Indicates whether the response should include the total count of plans.")

# Show Subscription Plan Details Parameters
class ShowSubscriptionPlanDetailsParameters(BaseModel):
    plan_id: str = Field(..., description="The ID of the subscription plan to show.")

# Name Schema
class NameSchema(BaseModel):
    given_name: Optional[str] = Field(None, description="The subscriber given name.")
    surname: Optional[str] = Field(None, description="The subscriber last name.")

# Address Schema
class AddressSchema(BaseModel):
    address_line_1: str = Field(..., description="The first line of the address.")
    address_line_2: Optional[str] = Field(None, description="The second line of the address.")
    admin_area_1: str = Field(..., description="The city or locality.")
    admin_area_2: str = Field(..., description="The state or province.")
    postal_code: str = Field(..., description="The postal code.")
    country_code: Literal['US'] = Field(..., description="The country code.")

# Shipping Address Schema
class ShippingAddressSchema(BaseModel):
    name: Optional[NameSchema] = Field(None, description="The subscriber shipping address name.")
    address: Optional[AddressSchema] = Field(None, description="The subscriber shipping address.")

# Payment Method Schema
class PaymentMethodSchema(BaseModel):
    payer_selected: Literal['PAYPAL', 'CREDIT_CARD'] = Field(..., description="The payment method selected by the payer.")
    payee_preferred: Optional[Literal['IMMEDIATE_PAYMENT_REQUIRED', 'INSTANT_FUNDING_SOURCE']] = Field(None, description="The preferred payment method for the payee.")

# Shipping Amount Schema
class ShippingAmountSchema(BaseModel):
    currency_code: Literal['USD'] = Field(..., description="The currency code for the shipping amount.")
    value: str = Field(..., description="The value of the shipping amount.")

# Subscriber Schema
class SubscriberSchema(BaseModel):
    name: Optional[NameSchema] = Field(None, description="The subscriber name.")
    email_address: Optional[str] = Field(None, description="The subscriber email address.")
    shipping_address: Optional[ShippingAddressSchema] = Field(None, description="The subscriber shipping address.")

# Application Context Schema
class ApplicationContextSchema(BaseModel):
    brand_name: str = Field(..., description="The brand name.")
    locale: Optional[str] = Field(None, description="The locale for the subscription.")
    shipping_preference: Optional[Literal['SET_PROVIDED_ADDRESS', 'GET_FROM_FILE']] = Field(None, description="The shipping preference.")
    user_action: Optional[Literal['SUBSCRIBE_NOW', 'CONTINUE']] = Field(None, description="The user action.")
    return_url: str = Field(..., description="The return URL after the subscription is created.")
    cancel_url: str = Field(..., description="The cancel URL if the user cancels the subscription.")
    payment_method: Optional[PaymentMethodSchema] = Field(None, description="The payment method details.")

# Create Subscription Parameters
class CreateSubscriptionParameters(BaseModel):
    plan_id: str = Field(..., description="The ID of the subscription plan to create.")
    quantity: Optional[int] = Field(None, description="The quantity of the product in the subscription.")
    shipping_amount: Optional[ShippingAmountSchema] = Field(None, description="The shipping amount for the subscription.")
    subscriber: Optional[SubscriberSchema] = Field(None, description="The subscriber details.")
    application_context: Optional[ApplicationContextSchema] = Field(None, description="The application context for the subscription.")

# Show Subscription Details Parameters
class ShowSubscriptionDetailsParameters(BaseModel):
    subscription_id: str = Field(..., description="The ID of the subscription to show details.")

class Reason(BaseModel):
    reason: str = Field(..., description="Reason for Cancellation.")

# Cancel Subscription Parameters
class CancelSubscriptionParameters(BaseModel):
    subscription_id: str = Field(..., description="The ID of the subscription to cancel.")
    payload: Reason = Field(..., description="Reason for cancellation.")

