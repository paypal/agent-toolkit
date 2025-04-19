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
    