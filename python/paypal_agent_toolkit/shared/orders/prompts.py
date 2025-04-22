CREATE_ORDER_PROMPT = """
Use this tool to create a PayPal order when the user intends to purchase goods or services.

This tool is used to create a new order in PayPal. This is typically the first step in initiating a payment flow. It sets up an order with specified details such as item(s) to be purchased, quantity, amount, currency, and other details.
"""

CAPTURE_ORDER_PROMPT = """
Use this tool after the user has approved the PayPal order.

Paramters:
- order_id (str, required): The PayPal order ID provided after the user has approved the payment. 
  It typically appears in the approval link or as a token after payment approval.
"""

GET_ORDER_PROMPT = """
Use this tool to retrieve the current status of a PayPal order.

Paramters:
- order_id (str, required): The PayPal order ID you want to check.
"""

