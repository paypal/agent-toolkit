from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Literal
from ..regex import (
    INVOICE_ID_REGEX,
    HEX_COLOR_REGEX,
    DATE_NO_TIME_REGEX,
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


