from pydantic import BaseModel, Field, model_validator, field_validator
from typing import List, Optional, Literal
from ..regex import (
    INVOICE_ID_REGEX,
    HEX_COLOR_REGEX,
    DATE_NO_TIME_REGEX,
    DATE_TIME_REGEX,
    RECURRING_SERIES_ID_REGEX,
    COUNTRY_CODE_REGEX,
    LANGUAGE_REGEX,
    DECIMAL_STRING_REGEX,
)

# ---- Shared primitives (reused across create_invoice and create_recurring_series, ----
# ---- and intended for reuse by a future create_template tool) ----

class Money(BaseModel):
    currency_code: str = Field(..., description="The three-character ISO-4217 currency code that identifies the currency.")
    value: str = Field(..., pattern=DECIMAL_STRING_REGEX.pattern, description="The amount, as a signed decimal string with up to 2 decimal places (e.g. '50.00').")


class AmountRange(BaseModel):
    lower_amount: Money = Field(..., description="The lower bound of the amount range.")
    upper_amount: Money = Field(..., description="The upper bound of the amount range.")


class DateRange(BaseModel):
    start: str = Field(..., pattern=DATE_NO_TIME_REGEX.pattern, description="The start date, in yyyy-MM-DD format.")
    end: str = Field(..., pattern=DATE_NO_TIME_REGEX.pattern, description="The end date, in yyyy-MM-DD format.")


class DateTimeRange(BaseModel):
    start: str = Field(..., pattern=DATE_TIME_REGEX.pattern, min_length=20, max_length=64, description="The start date and time, in ISO8601 format (for example, 2018-06-01T00:00:00Z). Seconds are required; fractional seconds are optional. A plain date (yyyy-MM-DD) is also accepted and is expanded to the start of that day (00:00:00Z).")
    end: str = Field(..., pattern=DATE_TIME_REGEX.pattern, min_length=20, max_length=64, description="The end date and time, in ISO8601 format (for example, 2018-06-21T23:59:59Z). Seconds are required; fractional seconds are optional. A plain date (yyyy-MM-DD) is also accepted and is expanded to the end of that day (23:59:59Z).")

    @field_validator("start", "end", mode="before")
    @classmethod
    def _expand_date_only(cls, v, info):
        if isinstance(v, str) and DATE_NO_TIME_REGEX.match(v):
            return f"{v}T00:00:00Z" if info.field_name == "start" else f"{v}T23:59:59Z"
        return v


class PersonName(BaseModel):
    given_name: Optional[str] = Field(None, description="The first name of the person.")
    surname: Optional[str] = Field(None, description="The last name of the person.")


class Address(BaseModel):
    address_line_1: Optional[str] = Field(None, description="The first line of the address, for example, number and street.")
    address_line_2: Optional[str] = Field(None, description="The second line of the address, for example, suite or apartment number.")
    admin_area_2: Optional[str] = Field(None, description="A city, town, or village.")
    admin_area_1: Optional[str] = Field(None, description="The highest-level sub-division in a country, such as a state or province.")
    postal_code: Optional[str] = Field(None, description="The postal code, which is the zip code or equivalent.")
    country_code: Optional[str] = Field(None, pattern=COUNTRY_CODE_REGEX.pattern, description="The two-character ISO 3166-1 country code (for example, US or GB).")

    @field_validator("country_code", mode="before")
    @classmethod
    def _empty_string_to_none(cls, v):
        return None if v == "" else v


class Phone(BaseModel):
    country_code: str = Field(..., description="The country calling code, in E.164 format (for example, '1' for the United States).")
    national_number: str = Field(..., description="The national number, in E.164 format.")
    phone_type: Literal["FAX", "HOME", "MOBILE", "OTHER", "PAGER"] = Field(..., description="The type of phone number.")


class Tax(BaseModel):
    name: str = Field(..., description="The name of the tax applied on the item, for example 'Sales Tax'.")
    percent: str = Field(..., pattern=DECIMAL_STRING_REGEX.pattern, description="The tax rate, as a percent value from 0 to 100. Supports up to five decimal places.")
    tax_note: Optional[str] = Field(None, description="A note about the tax, used to track tax-related data.")


class Discount(BaseModel):
    percent: Optional[str] = Field(None, pattern=DECIMAL_STRING_REGEX.pattern, description="The discount as a percent value, from 0 to 100. Supports up to five decimal places. Mutually exclusive with amount -- set only one.")
    amount: Optional[Money] = Field(None, description="The discount as a fixed amount. Mutually exclusive with percent -- set only one.")

    @model_validator(mode="after")
    def _check_mutually_exclusive(self):
        if self.percent is not None and self.amount is not None:
            raise ValueError("percent and amount cannot both be set on the same discount -- use only one.")
        return self


class InvoiceItem(BaseModel):
    name: str = Field(..., description="The name of the item")
    description: Optional[str] = Field(None, description="The description of the item.")
    quantity: str = Field(..., description="The quantity of the item that the invoicer provides to the payer. Value is from -1000000 to 1000000. Supports up to five decimal places. Cast to string")
    unit_amount: Money = Field(..., description="The unit price of the item. Does not include tax or discount.")
    tax: Optional[Tax] = Field(None, description="tax object")
    discount: Optional[Discount] = Field(None, description="The discount for this line item, subtracted from the item total.")
    item_date: Optional[str] = Field(None, pattern=DATE_NO_TIME_REGEX.pattern, description="The date, in yyyy-MM-DD format, when the item or service was provided.")
    unit_of_measure: Optional[Literal["QUANTITY", "HOURS", "AMOUNT"]] = Field(None, description="The unit of measure for the invoiced item")


class BillingInfo(BaseModel):
    business_name: Optional[str] = Field(None, description="The business name of the invoice recipient.")
    name: Optional[PersonName] = Field(None, description="name of the recipient")
    address: Optional[Address] = Field(None, description="The address of the invoice recipient.")
    email_address: Optional[str] = Field(None, description="email address of the recipient")
    phones: Optional[List[Phone]] = Field(None, description="The invoice recipient's phone numbers.")
    additional_info: Optional[str] = Field(None, max_length=40, description="Any additional information about the recipient.")
    language: Optional[str] = Field(None, pattern=LANGUAGE_REGEX.pattern, description="The BCP-47 language tag used for the recipient's email notification (for example, 'en-US'). Only used when the recipient has no PayPal account.")


class ShippingInfo(BaseModel):
    business_name: Optional[str] = Field(None, description="The business name for the shipping destination.")
    name: Optional[PersonName] = Field(None, description="The name for the shipping destination.")
    address: Optional[Address] = Field(None, description="The shipping address.")


class PrimaryRecipient(BaseModel):
    billing_info: Optional[BillingInfo] = Field(None, description="The billing information of the invoice recipient")
    shipping_info: Optional[ShippingInfo] = Field(None, description="The shipping information of the invoice recipient.")


# create_invoice and create_recurring_series both reuse the nested PrimaryRecipient/InvoiceItem
# classes above directly for recipients and items (passed straight through to PayPal); all other
# top-level fields keep their own flat shape for a simpler LLM-facing top level. See
# build_create_invoice_payload/build_create_recurring_series_payload in payload_util.py.


class CreateInvoiceParameters(BaseModel):
    currency_code: str = Field(..., description="The three-character ISO-4217 currency code for the invoice (for example, USD). Applies to every monetary amount on the invoice.")
    invoice_number: Optional[str] = Field(None, description="The invoice number. If omitted, PayPal auto-increments from the last invoice number used.")
    invoice_date: Optional[str] = Field(None, pattern=DATE_NO_TIME_REGEX.pattern, description="The invoice date in yyyy-MM-DD format.")
    reference: Optional[str] = Field(None, description="A reference value, such as a purchase order number.")
    note: Optional[str] = Field(None, description="A note to the invoice recipient. Also appears on the invoice notification email.")

    invoicer_business_name: Optional[str] = Field(None, max_length=300, description="The business name of the invoicer.")
    invoicer_given_name: Optional[str] = Field(None, description="The first name of the invoicer.")
    invoicer_surname: Optional[str] = Field(None, description="The last name of the invoicer.")
    invoicer_email_address: Optional[str] = Field(None, description="The email address of the invoicer.")
    invoicer_tax_id: Optional[str] = Field(None, description="The invoicer's tax ID.")
    invoicer_address_line_1: Optional[str] = Field(None, description="The first line of the invoicer's address, for example, number and street.")
    invoicer_address_line_2: Optional[str] = Field(None, description="The second line of the invoicer's address, for example, suite or apartment number.")
    invoicer_city: Optional[str] = Field(None, description="The city, town, or village of the invoicer's address.")
    invoicer_state: Optional[str] = Field(None, description="The state or province of the invoicer's address.")
    invoicer_postal_code: Optional[str] = Field(None, description="The postal code of the invoicer's address.")
    invoicer_country_code: Optional[str] = Field(None, pattern=COUNTRY_CODE_REGEX.pattern, description="The two-character ISO 3166-1 country code of the invoicer's address (for example, US or GB).")

    primary_recipients: List[PrimaryRecipient] = Field(..., description="The recipients who will be billed for this invoice.")
    items: List[InvoiceItem] = Field(..., description="The line items on the invoice.")

    allow_tip: Optional[bool] = Field(None, description="Whether the payer can add a tip when paying. Not available in Hong Kong, Taiwan, India, or Japan.")
    theme_color: Optional[str] = Field(None, pattern=HEX_COLOR_REGEX.pattern, description="The primary color used to render the invoice, as a hex color code (e.g. #000000). If omitted, the default theme is used.")
    shipping_cost: Optional[str] = Field(None, pattern=DECIMAL_STRING_REGEX.pattern, description="The shipping cost for the invoice, in the invoice's currency_code.")

    enable_pay_by_bank: Optional[bool] = Field(None, description="Whether to enable PAY_BY_BANK as a payment method for this invoice, letting the payer pay directly from their bank account. Available only for US-based merchants and invoices with USD currency.")
    pay_by_bank_exclusive_above_threshold: Optional[bool] = Field(None, description="When true, PAY_BY_BANK becomes the only available payment method once the invoice total exceeds PayPal's system-defined threshold ($1000), disabling all other payment methods above that threshold.")

    allow_partial_payment: Optional[bool] = Field(None, description="Whether the invoice allows a partial payment. If false, the invoice must be paid in full. If true, the invoice allows partial payments. Not available for users in India, Brazil, or Israel.")
    minimum_partial_payment_amount: Optional[str] = Field(None, pattern=DECIMAL_STRING_REGEX.pattern, description="The minimum amount allowed for a partial payment, in the invoice's currency_code. Valid only when allow_partial_payment is true.")


class CreateRecurringSeriesParameters(BaseModel):
    interval_unit: Literal["DAY", "WEEK", "MONTH", "YEAR"] = Field(..., description="The time unit for the recurring invoice cycle interval")
    interval_count: int = Field(..., ge=1, le=52, description="The number of intervals between each recurring invoice cycle. For example, an interval_count of 2 with interval_unit of MONTH means the invoice recurs every 2 months")
    start_series_date: str = Field(..., pattern=DATE_NO_TIME_REGEX.pattern, description="The date when the recurring series begins and the first invoice is generated, in yyyy-MM-DD format. Cannot be a past date.")
    total_cycles: Optional[int] = Field(None, ge=0, le=99, description="The total number of invoices to generate in the series. If omitted, the series runs indefinitely until cancelled.")

    reference: Optional[str] = Field(None, description="A reference value, such as a purchase order number.")
    currency_code: str = Field(..., description="Currency code of the recurring invoice series")
    note: Optional[str] = Field(None, description="A note to the invoice recipient. Also appears on the invoice notification email.")

    invoicer_business_name: Optional[str] = Field(None, max_length=300, description="The business name of the invoicer.")
    invoicer_given_name: Optional[str] = Field(None, description="The first name of the invoicer.")
    invoicer_surname: Optional[str] = Field(None, description="The last name of the invoicer.")
    invoicer_email_address: Optional[str] = Field(None, description="The email address of the invoicer.")
    invoicer_tax_id: Optional[str] = Field(None, description="The invoicer's tax ID.")
    invoicer_address_line_1: Optional[str] = Field(None, description="The first line of the invoicer's address, for example, number and street.")
    invoicer_address_line_2: Optional[str] = Field(None, description="The second line of the invoicer's address, for example, suite or apartment number.")
    invoicer_city: Optional[str] = Field(None, description="The city, town, or village of the invoicer's address.")
    invoicer_state: Optional[str] = Field(None, description="The state or province of the invoicer's address.")
    invoicer_postal_code: Optional[str] = Field(None, description="The postal code of the invoicer's address.")
    invoicer_country_code: Optional[str] = Field(None, pattern=COUNTRY_CODE_REGEX.pattern, description="The two-character ISO 3166-1 country code of the invoicer's address (for example, US or GB).")

    primary_recipients: List[PrimaryRecipient] = Field(..., min_length=1, max_length=1, description="The primary recipient of the recurring invoices")
    items: Optional[List[InvoiceItem]] = Field(None, min_length=1, description="The line items that will appear on each invoice in the recurring series")

    allow_tip: Optional[bool] = Field(None, description="Whether the payer can add a tip when paying. Not available in Hong Kong, Taiwan, India, or Japan.")
    shipping_cost: Optional[str] = Field(None, pattern=DECIMAL_STRING_REGEX.pattern, description="The shipping cost for each generated invoice, in the series' currency_code.")

    allow_partial_payment: Optional[bool] = Field(None, description="Whether each generated invoice allows a partial payment. If false, each invoice must be paid in full. If true, each invoice allows partial payments. Not available for users in India, Brazil, or Israel.")
    minimum_partial_payment_amount: Optional[str] = Field(None, pattern=DECIMAL_STRING_REGEX.pattern, description="The minimum amount allowed for a partial payment on each generated invoice, in the series' currency_code. Valid only when allow_partial_payment is true.")


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


class DeleteInvoiceParameters(BaseModel):
    invoice_id: str = Field(..., description="The ID of the draft or scheduled invoice to delete.", pattern=INVOICE_ID_REGEX.pattern)


class GenerateInvoiceQrCodeParameters(BaseModel):
    invoice_id: str = Field(..., description="The invoice id to generate QR code for", pattern=INVOICE_ID_REGEX)
    width: int = Field(300, description="The QR code width")
    height: int = Field(300, description="The QR code height")


class GenerateInvoiceNumberParameters(BaseModel):
    pass


class ReminderInterval(BaseModel):
    unit: Literal["DAY"] = Field("DAY", description="The unit of time for the reminder interval. The interval unit is always DAY.")
    value: int = Field(..., description="The number of interval units before/after the due date at which to send the reminder.")


class ReminderNotification(BaseModel):
    send_to_invoicer: Optional[bool] = Field(None, description="Indicates whether to also notify the invoicer when the reminder is sent.")


class UpdateReminderInterval(BaseModel):
    value: int = Field(..., description="The number of interval units before/after the due date at which to send the reminder.")


class ReminderConfiguration(BaseModel):
    type: Literal["BEFORE_DUE", "AFTER_DUE"] = Field(..., description="The type of reminder. BEFORE_DUE sends a reminder before the invoice due date; AFTER_DUE sends a reminder after the invoice due date.")
    interval: ReminderInterval = Field(..., description="The interval at which to send the reminder.")
    repetition: int = Field(..., description="The number of times to send the reminder. Must be 1 for BEFORE_DUE reminders.")
    notification: Optional[ReminderNotification] = Field(None, description="Notification settings for the reminder.")


class SetupInvoiceAutoReminderParameters(BaseModel):
    configurations: Optional[List[ReminderConfiguration]] = Field(
        None,
        description="An array of up to two invoice auto reminder configurations, one for BEFORE_DUE and one for AFTER_DUE. If omitted, both reminder types are created with the default configuration in INACTIVE state. If only one type is provided, the other is created with the default configuration in INACTIVE state."
    )


class CancelInvoiceAutoReminderParameters(BaseModel):
    invoice_id: str = Field(..., description="The ID of the invoice for which to cancel all scheduled automatic reminders.", pattern=INVOICE_ID_REGEX)


class UpdateInvoiceAutoReminderParameters(BaseModel):
    reminder_configuration_id: str = Field(..., description="The ID of the auto reminder configuration to update.")
    type: Literal["BEFORE_DUE", "AFTER_DUE"]
    status: Optional[Literal["NONE", "ACTIVE", "INACTIVE"]] = Field(None, description="Select an option.")
    interval: UpdateReminderInterval = Field(..., description="The interval at which to send the reminder. The interval unit is always DAY.")
    repetition: int = Field(..., description="The number of times to send the reminder. Must be 1 for BEFORE_DUE reminders.")
    notification: Optional[ReminderNotification] = Field(None, description="Notification settings for the reminder.")


# ---- search_invoicing: one external tool that internally branches to invoice search or ----
# ---- recurring-series search based on resource_type. invoice_filters/recurring_series_filters ----
# ---- map 1:1 onto PayPal's real request bodies for /v2/invoicing/search-invoices and ----
# ---- /v2/invoicing/search-recurring-invoices respectively -- no payload reshaping needed. ----

# Some MCP clients "clear" a filter by blanking its leaf values (e.g. a range's start/end,
# or an array/string field) instead of omitting the field entirely -- these helpers treat
# such blanked-out values as not provided, used from field_validator(mode="before") below.

def _blank_range_to_none(v):
    if isinstance(v, dict):
        if not v.get("start") or not v.get("end"):
            return None
    return v


def _blank_list_to_none(v):
    if isinstance(v, list) and len(v) == 0:
        return None
    return v


def _blank_str_to_none(v):
    if isinstance(v, str) and not v.strip():
        return None
    return v


def _is_empty_filters(value):
    if value is None:
        return True
    if isinstance(value, BaseModel):
        return _is_empty_filters(value.model_dump())
    if isinstance(value, str):
        return not value.strip()
    if isinstance(value, dict):
        return all(_is_empty_filters(v) for v in value.values())
    if isinstance(value, list):
        return len(value) == 0
    return False


class SearchInvoicesFilters(BaseModel):
    recipient_email: Optional[str] = Field(None, max_length=254, description="Filters the search by the recipient's email address.")
    recipient_first_name: Optional[str] = Field(None, max_length=140, description="Filters the search by the recipient's first name.")
    recipient_last_name: Optional[str] = Field(None, max_length=140, description="Filters the search by the recipient's last name.")
    recipient_business_name: Optional[str] = Field(None, max_length=300, description="Filters the search by the recipient's business name.")
    invoice_number: Optional[str] = Field(None, max_length=25, description="Filters the search by the invoice number.")
    status: Optional[List[Literal[
        "DRAFT", "SENT", "SCHEDULED", "PAID", "MARKED_AS_PAID", "CANCELLED", "REFUNDED",
        "PARTIALLY_PAID", "PARTIALLY_REFUNDED", "MARKED_AS_REFUNDED", "UNPAID", "PAYMENT_PENDING",
        "AUTO_CANCELLED", "PAID_EXTERNAL", "REFUNDED_EXTERNAL", "SHARED",
    ]]] = Field(None, max_length=5, description="Filters the search by up to 5 invoice status values.")
    reference: Optional[str] = Field(None, max_length=120, description="Filters the search by reference data, such as a purchase order (PO) number.")
    currency_code: Optional[str] = Field(None, description="The three-character ISO-4217 currency code that identifies the currency.")
    total_amount_range: Optional[AmountRange] = Field(None, description="Filters the search by a range of invoice total amounts.")
    invoice_date_range: Optional[DateRange] = Field(None, description="Filters the search by the invoice's own date (the date shown on the invoice itself, also called the billing date). Use this for most 'invoices dated/created/issued between X and Y' requests -- creation_date_range is for PayPal's internal record-creation timestamp, not the invoice's date.")
    due_date_range: Optional[DateRange] = Field(None, description="Filters the search by the invoice's due date.")
    payment_date_range: Optional[DateTimeRange] = Field(None, description="Filters the search by the date and time PayPal recorded the invoice as paid (a system timestamp).")
    creation_date_range: Optional[DateTimeRange] = Field(None, description="Filters the search by the date and time PayPal's system recorded the invoice record as created (an internal system timestamp, NOT the invoice's own date). For 'invoices dated/created between X and Y' requests, prefer invoice_date_range unless the user specifically means when the record was created in PayPal.")

    @field_validator("total_amount_range", mode="before")
    @classmethod
    def _drop_blank_amount_range(cls, v):
        if isinstance(v, dict):
            lower_value = (v.get("lower_amount") or {}).get("value")
            upper_value = (v.get("upper_amount") or {}).get("value")
            if not lower_value or not upper_value:
                return None
        return v

    @field_validator("invoice_date_range", "due_date_range", "payment_date_range", "creation_date_range", mode="before")
    @classmethod
    def _drop_blank_date_ranges(cls, v):
        return _blank_range_to_none(v)

    @field_validator(
        "recipient_email", "recipient_first_name", "recipient_last_name",
        "recipient_business_name", "invoice_number", "reference", "currency_code",
        mode="before",
    )
    @classmethod
    def _drop_blank_strings(cls, v):
        return _blank_str_to_none(v)

    @field_validator("status", mode="before")
    @classmethod
    def _drop_blank_status(cls, v):
        return _blank_list_to_none(v)


class RecurringSeriesSearchFilters(BaseModel):
    currency_code: Optional[str] = Field(None, description="The three-character ISO-4217 currency code that identifies the currency.")
    status: Optional[List[Literal["DRAFT", "ACTIVE", "CANCELLED", "EXPIRED"]]] = Field(None, min_length=1, max_length=5, description="An array of up to 5 unique recurring invoice series status values.")
    creation_date_range: Optional[DateTimeRange] = Field(None, description="Filters the search by the date and time PayPal recorded the recurring series as created (a system timestamp). This endpoint has no separate 'series date' field -- for 'series created/started between X and Y' requests, this is the field to use. Mutually exclusive with next_occurrence_date_range -- PayPal supports only one range criterion per search.")
    next_occurrence_date_range: Optional[DateRange] = Field(None, description="Filters the search by the date range of the series' next occurrence. Mutually exclusive with creation_date_range -- PayPal supports only one range criterion per search.")
    total_amount_range: Optional[AmountRange] = Field(None, description="Filters the search by a range of total amounts.")

    @field_validator("status", mode="before")
    @classmethod
    def _drop_blank_status(cls, v):
        return _blank_list_to_none(v)

    @field_validator("currency_code", mode="before")
    @classmethod
    def _drop_blank_currency_code(cls, v):
        return _blank_str_to_none(v)

    @field_validator("status")
    @classmethod
    def _check_status_unique(cls, v):
        if v is not None and len(set(v)) != len(v):
            raise ValueError("status values must be unique.")
        return v

    @field_validator("creation_date_range", "next_occurrence_date_range", mode="before")
    @classmethod
    def _drop_blank_date_ranges(cls, v):
        return _blank_range_to_none(v)

    @field_validator("total_amount_range", mode="before")
    @classmethod
    def _drop_blank_amount_range(cls, v):
        if isinstance(v, dict):
            lower_value = (v.get("lower_amount") or {}).get("value")
            upper_value = (v.get("upper_amount") or {}).get("value")
            if not lower_value or not upper_value:
                return None
        return v

    @model_validator(mode="after")
    def _check_date_range_mutually_exclusive(self):
        if self.creation_date_range is not None and self.next_occurrence_date_range is not None:
            raise ValueError("creation_date_range and next_occurrence_date_range cannot both be set -- PayPal supports only one range criterion per search.")
        return self


class SearchRecurringSeriesFilters(BaseModel):
    search_text: Optional[str] = Field(None, min_length=3, max_length=800, description="Free-text search, checked against the fields listed in search_fields.")
    search_fields: Optional[List[Literal[
        "PAYER_REFERENCE_INFO", "BILLING_EMAIL", "BILLING_NAME", "BILLING_BUSINESS_NAME",
        "BILLING_PHONE_NUMBER", "SHIPPING_NAME", "SHIPPING_BUSINESS_NAME", "SHIPPING_PHONE_NUMBER",
        "ITEM_NAME", "ITEM_TAX_NAME", "ITEM_DISCOUNT_NAME", "INVOICE_DISCOUNT_NAME", "ALL",
    ]]] = Field(None, min_length=1, max_length=5, description="The fields search_text is checked against. Use ['ALL'] to search every available field.")
    search_filters: Optional[RecurringSeriesSearchFilters] = Field(None, description="Structured filters for the recurring series search.")

    @field_validator("search_text", mode="before")
    @classmethod
    def _drop_blank_search_text(cls, v):
        return _blank_str_to_none(v)

    @field_validator("search_fields", mode="before")
    @classmethod
    def _drop_blank_search_fields(cls, v):
        return _blank_list_to_none(v)

    @field_validator("search_fields")
    @classmethod
    def _check_search_fields_unique(cls, v):
        if v is not None and len(set(v)) != len(v):
            raise ValueError("search_fields values must be unique.")
        return v


class SearchInvoicingParameters(BaseModel):
    resource_type: Literal["invoice", "recurring_series"] = Field(..., description="Which kind of resource to search. 'invoice' searches individual invoices; 'recurring_series' searches recurring invoice series.")
    page: Optional[int] = Field(1, ge=1, le=1000, description="The page number of the result set to fetch.")
    page_size: Optional[int] = Field(20, ge=1, le=100, description="The number of records to return per page (maximum 100).")
    total_required: Optional[bool] = Field(False, description="Indicates whether the response should include total_pages and total_items. Only applies when resource_type is 'invoice'.")
    invoice_filters: Optional[SearchInvoicesFilters] = Field(None, description="Search filters for invoices. Set only when resource_type is 'invoice'.")
    recurring_series_filters: Optional[SearchRecurringSeriesFilters] = Field(None, description="Search filters for recurring invoice series. Set only when resource_type is 'recurring_series'.")

    @model_validator(mode="after")
    def _check_filters_match_resource_type(self):
        if self.resource_type == "invoice" and not _is_empty_filters(self.recurring_series_filters):
            raise ValueError("recurring_series_filters cannot be set when resource_type is 'invoice' -- use invoice_filters instead.")
        if self.resource_type == "recurring_series" and not _is_empty_filters(self.invoice_filters):
            raise ValueError("invoice_filters cannot be set when resource_type is 'recurring_series' -- use recurring_series_filters instead.")
        return self


# ---- update_invoicing: one external tool that internally branches to an invoice-update flow ----
# ---- or a recurring-series-update flow based on resource_type. invoice_update/recurring_series_update ----
# ---- are full-replacement bodies -- the create models extended with the resource's ID (and, for ----
# ---- invoices, the two query-param booleans) -- since PayPal's update endpoints are full-body PUTs. ----

def _is_empty_update(value):
    if value is None:
        return True
    if isinstance(value, BaseModel):
        return _is_empty_update(value.model_dump())
    if isinstance(value, str):
        return not value.strip()
    if isinstance(value, dict):
        return all(_is_empty_update(v) for v in value.values())
    if isinstance(value, list):
        return len(value) == 0
    return False


class UpdateInvoiceBody(CreateInvoiceParameters):
    # Optional at the field level (even though required whenever this flow actually runs) so that a
    # client blanking out the unused side of update_invoicing instead of omitting it can still pass
    # validation -- the pattern would otherwise reject an empty placeholder before the dispatcher's
    # own "is this side really being used" check ever runs. Presence is enforced in the validator below.
    invoice_id: Optional[str] = Field(None, pattern=INVOICE_ID_REGEX.pattern, description="The ID of the invoice to update. Required when resource_type is 'invoice'.")
    send_to_recipient: Optional[bool] = Field(None, description="Whether to send the invoice update notification to the recipient. PayPal defaults to true if omitted.")
    send_to_invoicer: Optional[bool] = Field(None, description="Whether to send the invoice update notification to the merchant (invoicer). PayPal defaults to true if omitted.")


class UpdateRecurringSeriesBody(CreateRecurringSeriesParameters):
    # Optional for the same reason as invoice_id above; enforced in the validator below.
    recurring_series_id: Optional[str] = Field(None, pattern=RECURRING_SERIES_ID_REGEX.pattern, description="The ID of the recurring invoice series to update. Required when resource_type is 'recurring_series'.")


class UpdateInvoicingParameters(BaseModel):
    resource_type: Literal["invoice", "recurring_series"] = Field(..., description="Which kind of resource to update. 'invoice' updates an individual invoice; 'recurring_series' updates a recurring invoice series.")
    invoice_update: Optional[UpdateInvoiceBody] = Field(None, description="Full replacement content for the invoice. Set only when resource_type is 'invoice'.")
    recurring_series_update: Optional[UpdateRecurringSeriesBody] = Field(None, description="Full replacement content for the recurring series. Set only when resource_type is 'recurring_series'.")

    @model_validator(mode="after")
    def _check_update_matches_resource_type(self):
        if self.resource_type == "invoice":
            if self.invoice_update is None:
                raise ValueError("invoice_update is required when resource_type is 'invoice'.")
            if not self.invoice_update.invoice_id:
                raise ValueError("invoice_update.invoice_id is required when resource_type is 'invoice'.")
            if not _is_empty_update(self.recurring_series_update):
                raise ValueError("recurring_series_update cannot be set when resource_type is 'invoice' -- use invoice_update instead.")
        else:
            if self.recurring_series_update is None:
                raise ValueError("recurring_series_update is required when resource_type is 'recurring_series'.")
            if not self.recurring_series_update.recurring_series_id:
                raise ValueError("recurring_series_update.recurring_series_id is required when resource_type is 'recurring_series'.")
            if not _is_empty_update(self.invoice_update):
                raise ValueError("invoice_update cannot be set when resource_type is 'recurring_series' -- use recurring_series_update instead.")
        return self


class RecordPaymentForInvoiceParameters(BaseModel):
    invoice_id: str = Field(..., pattern=INVOICE_ID_REGEX.pattern, description="The ID of the invoice to record the payment against.")
    payment_id: Optional[str] = Field(None, max_length=22, description="The ID for a PayPal payment transaction. Required for the PAYPAL payment type.")
    payment_date: Optional[str] = Field(None, pattern=DATE_NO_TIME_REGEX.pattern, description="The date when the invoicer recorded the payment, in yyyy-MM-dd format.")
    payment_date_time: Optional[str] = Field(None, min_length=20, max_length=64, description="The date and time when the invoicer recorded the payment, in Internet date and time format (ISO 8601), for example 2018-05-13T21:20:00Z or 2018-05-13T21:20:00.000-08:00. Seconds are required.")
    method: Literal["BANK_TRANSFER", "CASH", "CHECK", "CREDIT_CARD", "DEBIT_CARD", "PAYPAL", "WIRE_TRANSFER", "OTHER"] = Field(..., description="The payment mode or method through which the invoicer can accept the payments.")
    note: Optional[str] = Field(None, max_length=2000, description="A note associated with an external cash or check payment.")
    amount: Optional[Money] = Field(None, description="The currency and amount for a financial transaction.")
    shipping_info: Optional[ShippingInfo] = Field(None, description="The shipping information associated with this payment.")

    @field_validator("payment_id", "payment_date", "payment_date_time", mode="before")
    @classmethod
    def _empty_string_to_none(cls, v):
        return None if v == "" else v


class RecordRefundForInvoiceParameters(BaseModel):
    invoice_id: str = Field(..., pattern=INVOICE_ID_REGEX.pattern, description="The ID of the invoice to mark as refunded.")
    refund_date: Optional[str] = Field(None, pattern=DATE_NO_TIME_REGEX.pattern, description="The date when the invoicer recorded the refund, in yyyy-MM-dd format.")
    amount: Optional[Money] = Field(None, description="The currency and amount for a financial transaction.")
    method: Literal["BANK_TRANSFER", "CASH", "CHECK", "CREDIT_CARD", "DEBIT_CARD", "PAYPAL", "WIRE_TRANSFER", "OTHER"] = Field(..., description="The payment mode or method through which the invoicer can accept the payments.")

    @field_validator("refund_date", mode="before")
    @classmethod
    def _empty_string_to_none(cls, v):
        return None if v == "" else v


class InvoiceConditionalRuleExpiryTerms(BaseModel):
    rule_expiry_condition: Literal[
        "SPECIFIC_DATE",
        "THREE_DAYS_AFTER_ISSUE_DATE",
        "SEVEN_DAYS_AFTER_ISSUE_DATE",
        "FIFTEEN_DAYS_AFTER_ISSUE_DATE",
        "THIRTY_DAYS_AFTER_ISSUE_DATE",
    ] = Field(..., description="When the conditional rule expires: a specific date, or a period relative to the invoice issue date.")
    condition_rule_end_date: str = Field(..., pattern=DATE_NO_TIME_REGEX.pattern, description="The date the conditional rule expires, in yyyy-MM-dd format.")


class InvoiceConditionalRule(BaseModel):
    conditional_rule_type: Literal["EARLY_PAYMENT_DISCOUNT", "AUTO_CANCEL"] = Field(..., description="The type of conditional rule to apply to the invoice.")
    conditional_rule_value_type: Optional[Literal["PERCENT", "AMOUNT"]] = Field(None, description="The type of the conditional rule value. Required, and only applicable, when conditional_rule_type is EARLY_PAYMENT_DISCOUNT.")
    conditional_rule_value: Optional[str] = Field(None, description="The value of the conditional rule. Required, and only applicable, when conditional_rule_type is EARLY_PAYMENT_DISCOUNT. When conditional_rule_value_type is PERCENT, must be between 1 and 100.")
    rule_expiry_terms: InvoiceConditionalRuleExpiryTerms = Field(..., description="The expiry terms for the conditional rule.")

    @model_validator(mode="after")
    def _validate_early_payment_discount_fields(self):
        if self.conditional_rule_type == "EARLY_PAYMENT_DISCOUNT":
            if self.conditional_rule_value_type is None or self.conditional_rule_value is None:
                raise ValueError("conditional_rule_value_type and conditional_rule_value are required when conditional_rule_type is EARLY_PAYMENT_DISCOUNT.")
            if self.conditional_rule_value_type == "PERCENT" and not (1 <= float(self.conditional_rule_value) <= 100):
                raise ValueError("conditional_rule_value must be between 1 and 100 when conditional_rule_value_type is PERCENT.")
        return self


class CreateConditionalRulesForInvoiceParameters(BaseModel):
    invoice_id: str = Field(..., pattern=INVOICE_ID_REGEX.pattern, description="The ID of the invoice for which the conditional rules are to be created.")
    rules: List[InvoiceConditionalRule] = Field(..., min_length=1, description="The list of conditional rules to create for the invoice.")


