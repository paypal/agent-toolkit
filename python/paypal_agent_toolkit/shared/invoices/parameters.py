from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class UnitAmount(BaseModel):
    currency_code: str = Field(..., description="Currency code of the unit amount")
    value: str = Field(..., description="The unit price. Up to 2 decimal points")


class Tax(BaseModel):
    name: Optional[str] = Field(None, description="Tax name")
    percent: Optional[str] = Field(None, description="Tax Percent")


class InvoiceItem(BaseModel):
    name: str = Field(..., description="The name of the item")
    quantity: str = Field(..., description="The quantity of the item that the invoicer provides to the payer. Value is from -1000000 to 1000000. Supports up to five decimal places. Cast to string")
    unit_amount: UnitAmount = Field(..., description="unit amount object")
    tax: Optional[Tax] = Field(None, description="tax object")
    unit_of_measure: Optional[Literal["QUANTITY", "HOURS", "AMOUNT"]] = Field(None, description="The unit of measure for the invoiced item")


class InvoicerName(BaseModel):
    given_name: Optional[str] = Field(None, description="given name of the invoicer")
    surname: Optional[str] = Field(None, description="surname of the invoicer")


class Invoicer(BaseModel):
    business_name: str = Field(..., max_length=300, description="business name of the invoicer")
    name: Optional[InvoicerName] = Field(None, description="name of the invoicer")
    email_address: Optional[str] = Field(None, description="email address of the invoicer")


class RecipientName(BaseModel):
    given_name: Optional[str] = Field(None, description="given name of the recipient")
    surname: Optional[str] = Field(None, description="surname of the recipient")


class BillingInfo(BaseModel):
    name: Optional[RecipientName] = Field(None, description="name of the recipient")
    email_address: Optional[str] = Field(None, description="email address of the recipient")


class PrimaryRecipient(BaseModel):
    billing_info: Optional[BillingInfo] = Field(None, description="The billing information of the invoice recipient")


class InvoiceDetail(BaseModel):
    invoice_date: Optional[str] = Field(None, description="The invoice date in YYYY-MM-DD format")
    currency_code: str = Field(..., description="currency code of the invoice")


class CreateInvoiceParameters(BaseModel):
    detail: InvoiceDetail = Field(..., description="The invoice detail")
    invoicer: Optional[Invoicer] = Field(None, description="The invoicer business information that appears on the invoice.")
    primary_recipients: Optional[List[PrimaryRecipient]] = Field(None, description="array of recipients")
    items: Optional[List[InvoiceItem]] = Field(None, description="Array of invoice line items")

class GetInvoiceParameters(BaseModel):
    invoice_id: str = Field(..., description="The ID of the invoice to retrieve.")


class ListInvoicesParameters(BaseModel):
    page: Optional[int] = Field(1, description="The page number of the result set to fetch.")
    page_size: Optional[int] = Field(100, ge=1, le=100, description="The number of records to return per page (maximum 100).")
    total_required: Optional[bool] = Field(None, description="Indicates whether the response should include the total count of items.")


class SendInvoiceParameters(BaseModel):
    invoice_id: str = Field(..., description="The ID of the invoice to send.")
    note: Optional[str] = Field(None, description="A note to the recipient.")
    send_to_recipient: Optional[bool] = Field(None, description="Indicates whether to send the invoice to the recipient.")
    additional_recipients: Optional[List[str]] = Field(None, description="Additional email addresses to which to send the invoice.")


class SendInvoiceReminderParameters(BaseModel):
    invoice_id: str = Field(..., description="The ID of the invoice for which to send a reminder.")
    subject: Optional[str] = Field(None, description="The subject of the reminder email.")
    note: Optional[str] = Field(None, description="A note to the recipient.")
    additional_recipients: Optional[List[str]] = Field(None, description="Additional email addresses to which to send the reminder.")


class CancelSentInvoiceParameters(BaseModel):
    invoice_id: str = Field(..., description="The ID of the invoice to cancel.")
    note: Optional[str] = Field(None, description="A cancellation note to the recipient.")
    send_to_recipient: Optional[bool] = Field(None, description="Indicates whether to send the cancellation to the recipient.")
    additional_recipients: Optional[List[str]] = Field(None, description="Additional email addresses to which to send the cancellation.")


class GenerateInvoiceQrCodeParameters(BaseModel):
    invoice_id: str = Field(..., description="The invoice id to generate QR code for")
    width: int = Field(300, description="The QR code width")
    height: int = Field(300, description="The QR code height")
