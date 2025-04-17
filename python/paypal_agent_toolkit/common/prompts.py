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

CREATE_PRODUCT_PROMPT = """
Create a product in PayPal using product catalog - create products API.
This function creates a new product that will be used in subscription plans, subscriptions.
Required Arguments are: name (product name), type (product type).
Paramters: 
    - id: (auto-generated or specify SKU of the product) The ID of the product
    - name: {product_name} (required) 
    - description: {product_description} (optional)
    - type {DIGITAL | PHYSICAL | SERVICE} (required)
    - category: {product_category} (optional) 
    - image_url: {image_url} (optional)
    - home_url: {home_url} (optional)

"""

LIST_PRODUCTS_PROMPT = """
List products from PayPal.

This function retrieves a list of products with optional pagination parameters.
"""

SHOW_PRODUCT_DETAILS_PROMPT = """
List products from PayPal.

This function retrieves a list of products with optional pagination parameters.
"""

CREATE_SUBSCRIPTION_PLAN_PROMPT = """
Create a subsctiption plan in PayPal using subscription - create plan API.
This function creates a new subscription plan that defines pricing and billing cycle details for subscriptions.
Required parameters are: product_id (the ID of the product for which to create the plan), name (subscription plan name), billing_cycles (billing cycle details).
High level: product_id, name, description, taxes, status: {CREATED|INACTIVE|ACTIVE}, billing_cycles, payment_preferences are required in json object.
While creating billing_cycles object, trial(second) billing cycle should precede regular billing cycle.
"""

LIST_SUBSCRIPTION_PLANS_PROMPT = """
List subscription plans from PayPal.

This function retrieves a list of subscription plans with optional product filtering and pagination parameters.
"""

SHOW_SUBSCRIPTION_PLAN_DETAILS_PROMPT = """
Show subscription plan details from PayPal.
This function retrieves the details of a specific subscription plan using its ID.
Required parameters are: plan_id (the ID of the subscription plan).
"""


CREATE_SUBSCRIPTION_PROMPT = """
Create a subscription in PayPal using the subscription - create subscription API.
This function allows you to create a new subscription for a specific plan, enabling the management of recurring payments.
The only required parameter is plan_id (the ID of the subscription plan). All other fields are optional and can be omitted if not provided.
The subscriber field is optional. If no subscriber information is provided, omit the subscriber field in the request payload.
The shipping address is optional. If no shipping address is provided, set the shipping_preference to GET_FROM_FILE in the application context.
The application context is also optional. If no application context information is provided, omit the application context field in the request payload.
"""

SHOW_SUBSCRIPTION_DETAILS_PROMPT = """
Show subscription details from PayPal.
This function retrieves the details of a specific subscription using its ID.
Required parameters are: subscription_id (the ID of the subscription).
"""


CANCEL_SUBSCRIPTION_PROMPT = """
Cancel a customer subscription in PayPal.

This function cancels an active subscription for a customer. It requires the subscription ID and an optional reason for cancellation.
Required parameters are: subscription_id (the ID of the subscription to be canceled).
Below is the payload request structure:
{
    "reason": "Customer requested cancellation"
}
You MUST ask the user for: 
 - subscription_id
 - reason for cancellation.

Return all of the above as structured JSON in your response.
"""