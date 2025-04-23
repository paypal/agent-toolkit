# PayPal Agentic Toolkit

The PayPal Agentic Toolkit integrates PayPal's REST APIs seamlessly with OpenAI Agents, allowing AI-driven management of PayPal transactions.

## Available tools

The PayPal Agent toolkit provides the following tools:

**Payments**

- `create_order`: Create an order in PayPal system based on provided details
- `get_order`: Retrieve the details of an order
- `pay_order`: Process payment for an authorized order

**Catalog Management**

- `create_product`: Create a new product in the PayPal catalog
- `list_products`: List products with optional pagination and filtering
- `show_product_details`: Retrieve details of a specific product
- `update_product`: Update an existing product

**Subscription Management**

- `create_subscription_plan`: Create a new subscription plan
- `list_subscription_plans`: List subscription plans
- `show_subscription_plan_details`: Retrieve details of a specific subscription plan
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
from paypal_agent_toolkit.shared.configuration import Configuration, Context

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

```

## Usage Examples

This toolkit is designed to work with OpenAI's Agent SDK and Assistant API, langchain, crewai. It provides pre-built tools for managing PayPal transactions like creating, capturing, and checking orders details etc.

### OpenAI Agent
```python
from agents import Agent, Runner
from paypal_agent_toolkit.openai.toolkit import PayPalToolkit

# Initialize toolkit
toolkit = PayPalToolkit(PAYPAL_CLIENT_ID, PAYPAL_SECRET, configuration)
tools = toolkit.get_tools()

# Initialize OpenAI Agent
agent = Agent(
    name="PayPal Assistant",
    instructions="""
    You're a helpful assistant specialized in managing PayPal transactions:
    - To create orders, invoke create_order.
    - After approval by user, invoke pay_order.
    - To check an order status, invoke get_order_status.
    """,
    tools=tools
)
# Initialize the runner to execute agent tasks
runner = Runner()

user_input = "Create an PayPal Order for $10 for AdsService"
# Run the agent with user input
result = await runner.run(agent, user_input)
```


### OpenAI Assistants API
```python
from openai import OpenAI
from paypal_agent_toolkit.openai.toolkit import PayPalToolkit

# Initialize toolkit
toolkit = PayPalToolkit(client_id=PAYPAL_CLIENT_ID, secret=PAYPAL_SECRET, configuration = configuration)
tools = toolkit.get_openai_chat_tools()
paypal_api = toolkit.get_paypal_api()

# OpenAI client
client = OpenAI()

# Create assistant
assistant = client.beta.assistants.create(
    name="PayPal Checkout Assistant",
    instructions=f"""
You help users create and process payment for PayPal Orders. When the user wants to make a purchase,
use the create_order tool and share the approval link. After approval, use pay_order.
""",
    model="gpt-4-1106-preview",
    tools=tools
)

# Create a new thread for conversation
thread = client.beta.threads.create()

# Execute the assistant within the thread
run = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
```

### LangChain Agent
```python
from langchain.agents import initialize_agent, AgentType
from langchain_openai import ChatOpenAI 
from paypal_agent_toolkit.langchain.toolkit import PayPalToolkit

# Initialize Langchain Toolkit
toolkit = PayPalToolkit(client_id=PAYPAL_CLIENT_ID, secret=PAYPAL_SECRET, configuration = configuration)
tools = toolkit.get_tools()

# Setup LangChain Agent
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.OPENAI_FUNCTIONS,
    verbose=True
)

prompt = "Create an PayPal order for $50 for Premium News service."
# Run the agent with the defined prompt
result = agent.run(prompt)
```

### CrewAI Agent
```python
from crewai import Agent, Crew, Task
from paypal_agent_toolkit.crewai.toolkit import PayPalToolkit

# Setup PayPal CrewAI Toolkit
toolkit = PayPalToolkit(client_id=PAYPAL_CLIENT_ID, secret=PAYPAL_SECRET, configuration = configuration)
tools = toolkit.get_tools()

# Define an agent specialized in PayPal transactions
agent = Agent(
    role="PayPal Assistant",
    goal="Help users create and manage PayPal transactions",
    backstory="You are a finance assistant skilled in PayPal operations.",
    tools=toolkit.get_tools(),
    allow_delegation=False
)

# Define a CrewAI Task to create a PayPal order
task = Task(
    description="Create an PayPal order for $50 for Premium News service.",
    expected_output="A PayPal order ID",
    agent=agent
)

# Assemble Crew with defined agent and task
crew = Crew(agents=[agent], tasks=[task], verbose=True,
    planning=True,)

```

## Examples
See /examples for ready-to-run samples using:

 - [OpenAI Agent SDK](examples/openai/app_agents.py)
 - [Assistants API](examples/openai/app_assistant.py)
 - [LangChain integration](examples/langchain/app_agent.py)
 - [CrewAI integration](examples/crewai/app_agent.py)


## Disclaimer
AI-generated content may be inaccurate or incomplete. Users are responsible for independently verifying any information before relying on it. PayPal makes no guarantees regarding output accuracy and is not liable for any decisions, actions, or consequences resulting from its use.

[app-keys]: https://developer.paypal.com/dashboard/applications/sandbox
