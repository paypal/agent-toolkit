from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class CreateInvoice(BaseModel):
    """Schema for the ``create_invoice`` operation."""

    detail: Dict[str, Any] = Field(
        ...,
        description="The invoice details including information about the merchant, primary recipients, and invoice information.",
    )
    items: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="An array of items that the invoice is for.",
    )


class ListInvoices(BaseModel):
    """Schema for the ``list_invoices`` operation."""

    page: Optional[int] = Field(
        None,
        description="The page number of the result set to fetch.",
    )
    page_size: Optional[int] = Field(
        None,
        description="The number of records to return per page. Maximum page size is 100.",
    )
    total_required: Optional[bool] = Field(
        None,
        description="Indicates whether the response includes the total count of items.",
    )


class SendInvoice(BaseModel):
    """Schema for the ``send_invoice`` operation."""

    invoice_id: str = Field(
        ...,
        description="The ID of the invoice to send.",
    )
    note: Optional[str] = Field(
        None,
        description="A note to the recipient.",
    )
    send_to_recipient: Optional[bool] = Field(
        None,
        description="Indicates whether to send the invoice to the recipient.",
    )
    additional_recipients: Optional[List[str]] = Field(
        None,
        description="Additional email addresses to which to send the invoice.",
    )


class SendInvoiceReminder(BaseModel):
    """Schema for the ``send_invoice_reminder`` operation."""

    invoice_id: str = Field(
        ...,
        description="The ID of the invoice for which to send a reminder.",
    )
    subject: Optional[str] = Field(
        None,
        description="The subject of the reminder email.",
    )
    note: Optional[str] = Field(
        None,
        description="A note to the recipient.",
    )
    additional_recipients: Optional[List[str]] = Field(
        None,
        description="Additional email addresses to which to send the reminder.",
    )


class CancelSentInvoice(BaseModel):
    """Schema for the ``cancel_sent_invoice`` operation."""

    invoice_id: str = Field(
        ...,
        description="The ID of the invoice to cancel.",
    )
    note: Optional[str] = Field(
        None,
        description="A cancellation note to the recipient.",
    )
    send_to_recipient: Optional[bool] = Field(
        None,
        description="Indicates whether to send the cancellation to the recipient.",
    )
    additional_recipients: Optional[List[str]] = Field(
        None,
        description="Additional email addresses to which to send the cancellation.",
    )


class CreateProduct(BaseModel):
    """Schema for the ``create_product`` operation."""

    name: str = Field(
        ...,
        description="The product name.",
    )
    description: Optional[str] = Field(
        None,
        description="The product description.",
    )
    type: str = Field(
        ...,
        description="The product type. Value is PHYSICAL, DIGITAL, or SERVICE.",
    )
    category: Optional[str] = Field(
        None,
        description="The product category.",
    )
    image_url: Optional[str] = Field(
        None,
        description="The image URL for the product.",
    )
    home_url: Optional[str] = Field(
        None,
        description="The home page URL for the product.",
    )


class ListProducts(BaseModel):
    """Schema for the ``list_products`` operation."""

    page: Optional[int] = Field(
        None,
        description="The page number of the result set to fetch.",
    )
    page_size: Optional[int] = Field(
        None,
        description="The number of records to return per page. Maximum page size is 100.",
    )
    total_required: Optional[bool] = Field(
        None,
        description="Indicates whether the response includes the total count of products.",
    )


class UpdateProduct(BaseModel):
    """Schema for the ``update_product`` operation."""

    product_id: str = Field(
        ...,
        description="The ID of the product to update.",
    )
    operations: List[Dict[str, Any]] = Field(
        ...,
        description="The PATCH operations to perform on the product.",
    )


class CreateSubscriptionPlan(BaseModel):
    """Schema for the ``create_subscription_plan`` operation."""

    product_id: str = Field(
        ...,
        description="The ID of the product for which to create the plan.",
    )
    name: str = Field(
        ...,
        description="The subscription plan name.",
    )
    description: Optional[str] = Field(
        None,
        description="The subscription plan description.",
    )
    billing_cycles: List[Dict[str, Any]] = Field(
        ...,
        description="The billing cycles of the plan.",
    )
    payment_preferences: Optional[Dict[str, Any]] = Field(
        None,
        description="The payment preferences for the subscription plan.",
    )
    taxes: Optional[Dict[str, Any]] = Field(
        None,
        description="The tax details.",
    )


class ListSubscriptionPlans(BaseModel):
    """Schema for the ``list_subscription_plans`` operation."""

    product_id: Optional[str] = Field(
        None,
        description="The ID of the product for which to get subscription plans.",
    )
    page: Optional[int] = Field(
        None,
        description="The page number of the result set to fetch.",
    )
    page_size: Optional[int] = Field(
        None,
        description="The number of records to return per page. Maximum page size is 100.",
    )
    total_required: Optional[bool] = Field(
        None,
        description="Indicates whether the response includes the total count of plans.",
    )
