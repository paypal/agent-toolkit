CREATE_ORDER_PROMPT = """
Use this tool to create a PayPal order when the user intends to purchase goods or services.

This tool is used to create a new order in PayPal. This is typically the first step in initiating a payment flow. It sets up an order with specified details such as item(s) to be purchased, quantity, amount, currency, and other details.

To make retries safe, pass request_id: the same value every time you retry this purchase, and a new value for each different purchase.
"""

CAPTURE_ORDER_PROMPT = """
Use this tool after the user has approved the PayPal order.

Paramters:
- order_id (str, required): The PayPal order ID provided after the user has approved the payment.
  It typically appears in the approval link or as a token after payment approval.
- request_id (str, optional): Idempotency key. Retrying a capture of the same order is safe: unless
  you pass a request_id, the order id is used as the key, so PayPal returns the original result.
"""

GET_ORDER_PROMPT = """
Use this tool to retrieve the current status of a PayPal order.

Paramters:
- order_id (str, required): The PayPal order ID you want to check.
"""

