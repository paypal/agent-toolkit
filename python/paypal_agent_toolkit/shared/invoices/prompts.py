CREATE_INVOICE_PROMPT = """
Create Invoices on PayPal.

This function creates a draft invoice, specifying a currency code, the invoicer's business information, one or more recipients to bill, and line items. Once created, the invoice can be sent to the customer for payment.

primary_recipients and items use PayPal's real nested shape (billing_info/shipping_info for recipients; unit_amount/tax/discount for items); other fields use a simplified flat shape.
"""

CREATE_RECURRING_SERIES_PROMPT = """
Create a recurring invoice series on PayPal.

This function creates a recurring invoice series that automatically generates and sends invoices to a customer on a schedule, specifying a billing frequency, a start date, a currency code, a primary recipient, and line items for the series template.

primary_recipients and items use PayPal's real nested shape (billing_info/shipping_info for recipients; unit_amount/tax/discount for items); other fields use a simplified flat shape.

A newly created series is in DRAFT status and will not generate invoices until activated -- call activate_recurring_series with the returned series ID to activate it.
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

GENERATE_INVOICE_NUMBER_PROMPT = """
Generate the next invoice number available to the merchant.

This function generates the next invoice number by using the prefix and suffix from the merchant's last invoice number and incrementing the numeric portion by one (e.g. INVOICE-1234 -> INVOICE-1235).
"""

SETUP_INVOICE_AUTO_REMINDER_PROMPT = """
Initialize the invoice auto reminder configuration for the merchant's PayPal account.

This function sets up automatic reminders for unpaid invoices, for BEFORE_DUE and/or AFTER_DUE reminder types.
"""

UPDATE_INVOICE_AUTO_REMINDER_PROMPT = """
Update an existing invoice auto reminder configuration by its configuration ID.

This function performs a full update of the reminder configuration's timing interval, repetition count and notification preferences.
"""