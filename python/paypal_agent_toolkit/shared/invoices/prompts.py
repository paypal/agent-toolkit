CREATE_INVOICE_PROMPT = """
Create Invoices on PayPal.

This function is used to create an invoice in the PayPal system. It allows you to generate a new invoice, specifying details such as customer information, items, quantities, pricing, and tax information. Once created, an invoice can be sent to the customer for payment.
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

SETUP_INVOICE_AUTO_REMINDER_PROMPT = """
Initialize the invoice auto reminder configuration for the merchant's PayPal account.

This function sets up automatic reminders for unpaid invoices, for BEFORE_DUE and/or AFTER_DUE reminder types.
"""

UPDATE_INVOICE_AUTO_REMINDER_PROMPT = """
Update an existing invoice auto reminder configuration by its configuration ID.

This function performs a full update of the reminder configuration's timing interval, repetition count and notification preferences.
"""