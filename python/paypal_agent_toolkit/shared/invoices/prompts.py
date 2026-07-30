CREATE_INVOICE_PROMPT = """
Create an invoice on PayPal.

This function creates a draft invoice, specifying a currency code, the invoicer's business information, one or more recipients to bill, line items with quantities, pricing, tax, and discounts, an invoice-level note, a custom color theme, a tip option, an optional shipping cost, and whether to enable `PAY_BY_BANK` as a payment method (with an optional rule making it the exclusive payment method above a system-defined amount threshold). `currency_code`, `primary_recipients`, and `items` are required; everything else is optional. Most top-level fields (invoicer details, tip, theme, shipping cost, PAY_BY_BANK) use a simplified flat shape built automatically into PayPal's actual nested invoicing request, but `primary_recipients` and `items` are passed through in PayPal's real nested shape directly (`billing_info`/`shipping_info` for recipients; `unit_amount`/`tax`/`discount` for items). Once created, call send_invoice to send the invoice to the customer for payment.
"""

CREATE_RECURRING_SERIES_PROMPT = """
Create a recurring invoice series on PayPal.

This function creates a recurring invoice series that automatically generates and sends invoices to a customer on a scheduled basis, specifying a billing frequency, a start date, a currency code, one primary recipient, optional line items for the series template, an invoicer's business information, a note, a tip option, and an optional shipping cost. `interval_unit`, `interval_count`, `start_series_date`, `currency_code`, and `primary_recipients` are required; everything else is optional. Most fields (billing frequency, invoicer details, tip, shipping cost) use a simplified flat shape built automatically into PayPal's actual nested recurring-invoicing request, but `primary_recipients` and `items` are passed through in PayPal's real nested shape directly (`billing_info`/`shipping_info` for recipients; `unit_amount`/`tax`/`discount` for items). `start_series_date` must be in yyyy-MM-DD format and cannot be a past date. `total_cycles` defaults to running indefinitely if omitted.

A newly created recurring series is in DRAFT status and will not generate invoices until activated. Call activate_recurring_series with the returned recurring series ID to activate it.
"""

ACTIVATE_RECURRING_SERIES_PROMPT = """
Activate a recurring invoice series on PayPal.

This function activates a recurring invoice series by its ID, moving it out of DRAFT status. Once activated, PayPal automatically generates and sends invoices to the customer based on the series' configured schedule. Call this after create_recurring_series to make the series active.
"""

LIST_INVOICE_PROMPT = """
List invoices from PayPal.

This function retrieves a list of invoices with optional pagination parameters.
"""

GET_INVOICE_PROMPT = """
Get an invoice from PayPal.

This function retrieves details of a specific invoice using its ID.
"""

SEND_INVOICE_PROMPT = """
Send an invoice to the recipient(s).

This function sends a previously created invoice to its intended recipients.
"""

SEND_INVOICE_REMINDER_PROMPT = """
Send a reminder for an invoice.

This function sends a reminder for an invoice that has already been sent but hasn't been paid yet.
"""

CANCEL_SENT_INVOICE_PROMPT = """
Cancel a sent invoice.

This function cancels an invoice that has already been sent to the recipient(s).
"""

GENERATE_INVOICE_QRCODE_PROMPT = """
Generate a QR code for an invoice.

This function generates a QR code for an invoice, which can be used to pay the invoice using a mobile device or scanning app.
"""