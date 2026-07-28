CREATE_INVOICE_PROMPT = """
Create Invoices on PayPal.

This function is used to create an invoice in the PayPal system. It allows you to generate a new invoice, specifying details such as customer information, items, quantities, pricing, and tax information. Once created, an invoice can be sent to the customer for payment.
"""

CREATE_INVOICE_WITH_THEME_PROMPT = """
Create an invoice on PayPal with a custom color theme.

This function creates an invoice the same way as create_invoice, but additionally lets you set the primary color used to render the invoice, via configuration.theme.primary_color (a hex color code, e.g. #000000).
"""

CREATE_RECURRING_SERIES_PROMPT = """
Create a recurring invoice series on PayPal.

This function creates a recurring invoice series that automatically generates and sends invoices to a customer on a scheduled basis. It requires the billing frequency, the currency code, the primary recipient's email address, and the line items to include on each generated invoice. Optionally, an invoicer (merchant business name and email address) can be provided to appear on each generated invoice, and a start_series_date (yyyy-MM-DD, cannot be in the past) can be provided to control when the first invoice is generated; if omitted, the series starts on the current date.

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