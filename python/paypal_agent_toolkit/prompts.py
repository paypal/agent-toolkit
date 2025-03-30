CREATE_INVOICE_PROMPT = """
This tool will create an invoice in PayPal.

It takes two arguments:
- detail (dict): The details dictionary containing information about the merchant, primary recipients, and invoice information.
- items (list, optional): An array of items that the invoice is for.
"""

LIST_INVOICES_PROMPT = """
This tool will fetch a list of invoices from PayPal.

It takes three optional arguments:
- page (int, optional): The page number of the result set to fetch.
- page_size (int, optional): The number of records to return per page (maximum 100).
- total_required (bool, optional): Indicates whether the response should include the total count of items.
"""

SEND_INVOICE_PROMPT = """
This tool will send an invoice to the recipient(s) in PayPal.

It takes four arguments:
- invoice_id (str): The ID of the invoice to send.
- note (str, optional): A note to the recipient.
- send_to_recipient (bool, optional): Indicates whether to send the invoice to the recipient.
- additional_recipients (list, optional): Additional email addresses to which to send the invoice.
"""

SEND_INVOICE_REMINDER_PROMPT = """
This tool will send a reminder for an invoice in PayPal.

It takes four arguments:
- invoice_id (str): The ID of the invoice for which to send a reminder.
- subject (str, optional): The subject of the reminder email.
- note (str, optional): A note to the recipient.
- additional_recipients (list, optional): Additional email addresses to which to send the reminder.
"""

CANCEL_SENT_INVOICE_PROMPT = """
This tool will cancel a sent invoice in PayPal.

It takes four arguments:
- invoice_id (str): The ID of the invoice to cancel.
- note (str, optional): A cancellation note to the recipient.
- send_to_recipient (bool, optional): Indicates whether to send the cancellation to the recipient.
- additional_recipients (list, optional): Additional email addresses to which to send the cancellation.
"""

CREATE_PRODUCT_PROMPT = """
This tool will create a product in PayPal.

It takes six arguments:
- name (str): The product name.
- description (str, optional): The product description.
- type (str): The product type. Value is PHYSICAL, DIGITAL, or SERVICE.
- category (str, optional): The product category.
- image_url (str, optional): The image URL for the product.
- home_url (str, optional): The home page URL for the product.
"""

LIST_PRODUCTS_PROMPT = """
This tool will fetch a list of products from PayPal.

It takes three optional arguments:
- page (int, optional): The page number of the result set to fetch.
- page_size (int, optional): The number of records to return per page (maximum 100).
- total_required (bool, optional): Indicates whether the response should include the total count of products.
"""

UPDATE_PRODUCT_PROMPT = """
This tool will update a product in PayPal.

It takes two arguments:
- product_id (str): The ID of the product to update.
- operations (list): The PATCH operations to perform on the product.
"""

CREATE_SUBSCRIPTION_PLAN_PROMPT = """
This tool will create a subscription plan in PayPal.

It takes six arguments:
- product_id (str): The ID of the product for which to create the plan.
- name (str): The subscription plan name.
- description (str, optional): The subscription plan description.
- billing_cycles (list): The billing cycles of the plan.
- payment_preferences (dict, optional): The payment preferences for the subscription plan.
- taxes (dict, optional): The tax details.
"""

LIST_SUBSCRIPTION_PLANS_PROMPT = """
This tool will fetch a list of subscription plans from PayPal.

It takes four optional arguments:
- product_id (str, optional): The ID of the product for which to get subscription plans.
- page (int, optional): The page number of the result set to fetch.
- page_size (int, optional): The number of records to return per page (maximum 100).
- total_required (bool, optional): Indicates whether the response should include the total count of plans.
"""
