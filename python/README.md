# PayPal Agentic Toolkit

The PayPal Agentic Toolkit integrates PayPal's REST APIs seamlessly with OpenAI Agents, allowing AI-driven management of PayPal transactions.

## Available tools

The PayPal Agent toolkit provides the following tools:

**Orders**

- `create_order`: Create an order in PayPal system based on provided details
- `get_order`: Retrieve the details of an order
- `capture_order`: Capture payment for an authorized order

**Products**

- `create_product`: Create a new product in the PayPal catalog
- `list_products`: List products with optional pagination and filtering
- `show_product_details`: Retrieve details of a specific product
- `update_product`: Update an existing product

**Subscription Plans**

- `create_subscription_plan`: Create a new subscription plan
- `list_subscription_plans`: List subscription plans
- `show_subscription_plan_details`: Retrieve details of a specific subscription plan

**Subscriptions**

- `create_subscription`: Create a new subscription
- `show_subscription_details`: Retrieve details of a specific subscription
- `cancel_subscription`: Cancel an active subscription

**Invoices**

- `create_invoice`: Create a new invoice in the PayPal system
- `list_invoices`: List invoices with optional pagination and filtering
- `get_invoice`: Retrieve details of a specific invoice
- `send_invoice`: Send an invoice to recipients
- `send_invoice_reminder`: Send a reminder for an existing invoice
- `cancel_sent_invoice`: Cancel a sent invoice
- `generate_invoice_qr_code`: Generate a QR code for an invoice


## Prerequisites

Before setting up the workspace, ensure you have the following installed:
- Python 3.11 or higher
- `pip` (Python package manager)
- A PayPal developer account for API credentials

## Installation

You don't need this source code unless you want to modify the package. If you just
want to use the package, just run:

```sh
pip install paypal-agent-toolkit
```

## Configuration

To get started, configure the toolkit with your PayPal API credentials from the [PayPal Developer Dashboard][app-keys].

```python
configuration = Configuration(
    actions={
        "orders": {
            "create": True,
            "get": True,
            "capture": True,
        }
    },
    context=Context(
        sandbox=True
    )
)

# Initialize toolkit
toolkit = PayPalToolkit(client_id=PAYPAL_CLIENT_ID, secret=PAYPAL_SECRET, configuration = configuration)

```

## Usage Examples

This toolkit is designed to work with OpenAI's Agent SDK and Assistant API, langchain. It provides pre-built tools for managing PayPal transactions like creating, capturing, and checking orders details etc.

### OpenAI Agent SDK
```python
from agents import Agent

tools = toolkit.get_tools()

agent = Agent(
    name="PayPal Assistant",
    instructions="""
    You're a helpful assistant specialized in managing PayPal transactions:
    - To create orders, invoke create_order.
    - After approval by user, invoke capture_order.
    - To check an order status, invoke get_order_status.
    """,
    tools=tools
)
```


### OpenAI Assistants API
```python

tools = toolkit.get_openai_chat_tools()
paypal_api = toolkit.get_paypal_api()

# Create assistant
assistant = client.beta.assistants.create(
    name="PayPal Checkout Assistant",
    instructions=f"""
You help users create and capture PayPal orders. When the user wants to make a purchase,
use the create_order tool and share the approval link. After approval, use capture_order.
""",
    model="gpt-4-1106-preview",
    tools=tools
)

# Create thread
thread = client.beta.threads.create()

# Start or retrieve a run
run = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
```

### LangChain Agent
```python
# Setup PayPal Langchain Toolkit
toolkit = PayPalToolkit(client_id=PAYPAL_CLIENT_ID, secret=PAYPAL_SECRET, configuration = configuration)
tools = toolkit.get_tools()



# Initialize LangChain Agent ---
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.OPENAI_FUNCTIONS,
    verbose=True
)
```
## Examples
See /examples for ready-to-run samples using:

 - [OpenAI Agent SDK](examples/openai/app_agents_openai.py)
 - [Assistants API](examples/openai/app_assistant_openai.py)
 - [LangChain integration](examples/langchain/app_agent_openai.py)


## Disclaimer
AI-generated content may be inaccurate or incomplete. Users are responsible for independently verifying any information before relying on it. PayPal makes no guarantees regarding output accuracy and is not liable for any decisions, actions, or consequences resulting from its use.

[app-keys]: https://developer.paypal.com/dashboard/applications/sandbox