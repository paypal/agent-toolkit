from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from ..regex import INVOICE_ID_REGEX, HEX_COLOR_REGEX, DATE_NO_TIME_REGEX, RECURRING_SERIES_ID_REGEX

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


class InvoiceTheme(BaseModel):
    primary_color: str = Field(..., pattern=HEX_COLOR_REGEX.pattern, description="The primary color used to render the invoice, as a hex color code (e.g. #000000)")


class InvoiceConfiguration(BaseModel):
    theme: InvoiceTheme = Field(..., description="The invoice theme configuration")


class CreateInvoiceWithThemeParameters(CreateInvoiceParameters):
    configuration: InvoiceConfiguration = Field(..., description="The invoice configuration")


class RecurringFrequency(BaseModel):
    interval_unit: Literal["DAY", "WEEK", "MONTH", "YEAR"] = Field(..., description="The time unit for the recurring invoice cycle interval")
    interval_count: int = Field(..., ge=1, le=52, description="The number of intervals between each recurring invoice cycle. For example, an interval_count of 2 with interval_unit of MONTH means the invoice recurs every 2 months")


class RecurringPlanDetail(BaseModel):
    frequency: RecurringFrequency = Field(..., description="The billing frequency that determines the time interval between successive invoice generations")
    start_series_date: Optional[str] = Field(None, pattern=DATE_NO_TIME_REGEX.pattern, description="The date when the recurring series begins and the first invoice is generated, in yyyy-MM-DD format. Cannot be a past date. If omitted, the current date is used.")


class RecurringSeriesDetail(BaseModel):
    currency_code: str = Field(..., description="Currency code of the recurring invoice series")


class RecurringBillingInfo(BaseModel):
    email_address: str = Field(..., description="Email address of the invoice recipient")


class RecurringPrimaryRecipient(BaseModel):
    billing_info: RecurringBillingInfo = Field(..., description="The billing information of the invoice recipient")


class RecurringInfo(BaseModel):
    detail: RecurringSeriesDetail = Field(..., description="The recurring series configuration details")
    invoicer: Optional[Invoicer] = Field(None, description="The invoicer business information that appears on the invoice.")
    primary_recipients: List[RecurringPrimaryRecipient] = Field(..., min_length=1, max_length=1, description="The primary recipient of the recurring invoices")
    items: List[InvoiceItem] = Field(..., min_length=1, description="The line items that will appear on each invoice in the recurring series")


class CreateRecurringSeriesParameters(BaseModel):
    plan_detail: RecurringPlanDetail = Field(..., description="The scheduling and recurrence configuration for the recurring series")
    recurring_info: RecurringInfo = Field(..., description="The invoice template information used for generating each invoice in the series")


class ActivateRecurringSeriesParameters(BaseModel):
    recurring_series_id: str = Field(..., description="The ID of the recurring invoice series to activate.", pattern=RECURRING_SERIES_ID_REGEX.pattern)


class GetInvoiceParameters(BaseModel):
    invoice_id: str = Field(..., description="The ID of the invoice to retrieve.", pattern=INVOICE_ID_REGEX)


class ListInvoicesParameters(BaseModel):
    page: Optional[int] = Field(1, ge =1, le=1000, description="The page number of the result set to fetch.")
    page_size: Optional[int] = Field(100, ge=1, le=100, description="The number of records to return per page (maximum 100).")
    total_required: Optional[bool] = Field(None, description="Indicates whether the response should include the total count of items.")


class SendInvoiceParameters(BaseModel):
    invoice_id: str = Field(..., description="The ID of the invoice to send.", pattern=INVOICE_ID_REGEX)
    note: Optional[str] = Field(None, description="A note to the recipient.")
    send_to_recipient: Optional[bool] = Field(None, description="Indicates whether to send the invoice to the recipient.")
    additional_recipients: Optional[List[str]] = Field(None, description="Additional email addresses to which to send the invoice.")


class SendInvoiceReminderParameters(BaseModel):
    invoice_id: str = Field(..., description="The ID of the invoice for which to send a reminder.", pattern=INVOICE_ID_REGEX)
    subject: Optional[str] = Field(None, description="The subject of the reminder email.")
    note: Optional[str] = Field(None, description="A note to the recipient.")
    additional_recipients: Optional[List[str]] = Field(None, description="Additional email addresses to which to send the reminder.")


class CancelSentInvoiceParameters(BaseModel):
    invoice_id: str = Field(..., description="The ID of the invoice to cancel.", pattern=INVOICE_ID_REGEX)
    note: Optional[str] = Field(None, description="A cancellation note to the recipient.")
    send_to_recipient: Optional[bool] = Field(None, description="Indicates whether to send the cancellation to the recipient.")
    additional_recipients: Optional[List[str]] = Field(None, description="Additional email addresses to which to send the cancellation.")


class GenerateInvoiceQrCodeParameters(BaseModel):
    invoice_id: str = Field(..., description="The invoice id to generate QR code for", pattern=INVOICE_ID_REGEX)
    width: int = Field(300, description="The QR code width")
    height: int = Field(300, description="The QR code height")
