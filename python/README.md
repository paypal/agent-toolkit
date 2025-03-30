# PayPal Agent Toolkit

This package provides tools for integrating PayPal API into AI agents and other systems. It supports various frameworks such as OpenAI, LangChain, and CrewAI.

## Installation

```bash
pip install paypal-agent-toolkit
```

Or with optional dependencies for specific frameworks:

```bash
pip install "paypal-agent-toolkit[openai]"  # For OpenAI integration
pip install "paypal-agent-toolkit[langchain]"  # For LangChain integration
pip install "paypal-agent-toolkit[crewai]"  # For CrewAI integration
```

## Features

The toolkit provides the following functions for interacting with PayPal:

- Invoice Management:
  - `create_invoice` - Create an invoice
  - `list_invoices` - List invoices
  - `send_invoice` - Send an invoice to a recipient
  - `send_invoice_reminder` - Send a reminder for an invoice
  - `cancel_sent_invoice` - Cancel a sent invoice

- Product Management:
  - `create_product` - Create a product
  - `list_products` - List products
  - `update_product` - Update a product

- Subscription Management:
  - `create_subscription_plan` - Create a subscription plan
  - `list_subscription_plans` - List subscription plans

## Usage with OpenAI

```python
from paypal_agent_toolkit.openai import PayPalToolkit

# Initialize the toolkit
toolkit = PayPalToolkit(
    client_id="your-paypal-client-id",
    client_secret="your-paypal-client-secret",
)

# Get the tools
tools = toolkit.tools

# Use with OpenAI client
from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4-turbo",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "List my PayPal invoices"},
    ],
    tools=tools,
)

# Handle tool calls
if response.choices[0].message.tool_calls:
    for tool_call in response.choices[0].message.tool_calls:
        result = toolkit.create_tool_handler()(tool_call)
        # Use result in follow-up message
```

## Usage with LangChain

```python
from paypal_agent_toolkit.langchain import PayPalToolkit

# Initialize the toolkit
toolkit = PayPalToolkit(
    client_id="your-paypal-client-id",
    client_secret="your-paypal-client-secret",
)

# Get the tools
tools = toolkit.get_tools()

# Use with LangChain
from langchain.agents import initialize_agent, AgentType
from langchain.chat_models import ChatOpenAI

llm = ChatOpenAI(temperature=0)
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
)

agent.run("Create a new invoice for customer ABC Corp.")
```

## Usage with CrewAI

```python
from paypal_agent_toolkit.crewai import PayPalToolkit

# Initialize the toolkit
toolkit = PayPalToolkit(
    client_id="your-paypal-client-id",
    client_secret="your-paypal-client-secret",
)

# Get the tools
tools = toolkit.get_tools()

# Use with CrewAI
from crewai import Agent, Task, Crew

agent = Agent(
    role="Invoicing Expert",
    goal="Help users manage their PayPal invoices",
    tools=tools,
)

task = Task(
    description="Create a new invoice for customer ABC Corp",
    agent=agent,
)

crew = Crew(agents=[agent], tasks=[task])
result = crew.kickoff()
```

## License

MIT
