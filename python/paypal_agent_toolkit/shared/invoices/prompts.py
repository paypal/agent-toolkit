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

DELETE_INVOICE_PROMPT = """
Delete a draft or scheduled invoice on PayPal.

This function permanently deletes an invoice that is in the draft or scheduled state, by ID. It does not work on invoices that have already been sent -- use cancel_sent_invoice for those instead. After deletion, the invoice's details can no longer be retrieved, but its invoice number can be reused.
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

CANCEL_INVOICE_AUTO_REMINDER_PROMPT = """
Cancel all scheduled automatic reminders for an invoice.

This function permanently cancels every automatic reminder scheduled for a specific invoice, by invoice ID. This action is irreversible -- once cancelled, automatic reminders cannot be re-enabled for that invoice.
"""

UPDATE_INVOICING_PROMPT = """
Update an existing invoice or recurring invoice series on PayPal.

Use resource_type "invoice" with invoice_update, or "recurring_series" with recurring_series_update -- only set the matching object. This is a full-replacement update: resend the complete invoice/series content, not just the changed fields.

For invoices, the recipient (primary_recipients) can only be changed 2 times within any 72-hour window -- avoid unnecessary recipient edits.
"""