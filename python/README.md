# PayPal Agentic Toolkit

The PayPal Agentic Toolkit integrates PayPal's REST APIs seamlessly with OpenAI, LangChain, CrewAI Agents, allowing AI-driven management of PayPal transactions.

## Available tools

The PayPal Agent toolkit provides the following tools:

**Invoices**

- `create_invoice`: Create a new invoice in the PayPal system
- `list_invoices`: List invoices with optional pagination and filtering
- `get_invoice`: Retrieve details of a specific invoice
- `send_invoice`: Send an invoice to recipients
- `send_invoice_reminder`: Send a reminder for an existing invoice
- `cancel_sent_invoice`: Cancel a sent invoice
- `generate_invoice_qr_code`: Generate a QR code for an invoice

**Payments**

- `create_order`: Create an order in PayPal system based on provided details
- `get_order`: Retrieve the details of an order
- `pay_order`: Process payment for an authorized order

**Dispute Management**

- `list_disputes`: Retrieve a summary of all open disputes
- `get_dispute`: Retrieve detailed information of a specific dispute
- `accept_dispute_claim`: Accept a dispute claim

**Shipment Tracking**

- `create_shipment_tracking`: Create a shipment tracking record
- `get_shipment_tracking`: Retrieve shipment tracking information
- `update_shipment_tracking`: Update shipment tracking information

**Catalog Management**

- `create_product`: Create a new product in the PayPal catalog
- `list_products`: List products with optional pagination and filtering
- `show_product_details`: Retrieve details of a specific product

**Subscription Management**

- `create_subscription_plan`: Create a new subscription plan
- `list_subscription_plans`: List subscription plans
- `show_subscription_plan_details`: Retrieve details of a specific subscription plan
- `create_subscription`: Create a new subscription
- `show_subscription_details`: Retrieve details of a specific subscription
- `cancel_subscription`: Cancel an active subscription

**Reporting and Insights**

- `list_transactions`: List transactions with optional pagination and filtering
- `get_merchant_insights`: Retrieve business intelligence metrics and analytics for a merchant

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

### Logging Information
The toolkit uses Python’s standard logging module to output logs. By default, logs are sent to the console. It is recommended to configure logging to a file to capture any errors or debugging information for easier troubleshooting.

Recommendations:
- Error Logging: Set the logging output to a file to ensure all errors are recorded.
- Debugging Payloads/Headers: To see detailed request payloads and headers, set the logging level to DEBUG.

```python
import logging

# Basic configuration: logs to a file with INFO level
logging.basicConfig(
    filename='paypal_agent_toolkit.log', 
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s'
)

# To enable debug-level logs (for seeing payloads and headers)
# logging.getLogger().setLevel(logging.DEBUG)

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

### Amazon Bedrock
```python
import boto3
from botocore.exceptions import ClientError
from paypal_agent_toolkit.bedrock.toolkit import PayPalToolkit, BedrockToolBlock
from paypal_agent_toolkit.shared.configuration import Configuration, Context

# Setup PayPal Amazon Bedrock toolkit
toolkit = PayPalToolkit(client_id=PAYPAL_CLIENT_ID, secret=PAYPAL_CLIENT_SECRET, configuration = configuration)
tools = toolkit.get_tools()

# Create a user message
userMessage = "Create one PayPal order for $50 for Premium News service with 10% tax."
messages = [
    {
        "role": "user",
        "content": [{ "text": userMessage }],
    }
]

# Handles the appropriate tool calls
async def main():
    try: 
        while True: 
            response = client.converse(
                modelId=model_id,
                messages=messages,
                toolConfig={
                    "tools": tools
                }
            )

            response_message = response["output"]["message"]
            if not response_message:
                print("No response message received.")
                break

            response_content = response["output"]["message"]["content"]
            tool_call = [content for content in response_content if content.get("toolUse")]
            if not tool_call:
                print(response_content[0]["text"])
                break

            messages.append(response_message)
            for tool in tool_call:
                try: 
                    tool_call = BedrockToolBlock(
                       toolUseId=tool["toolUse"]["toolUseId"],
                       name=tool["toolUse"]["name"],
                       input=tool["toolUse"]["input"]
                    )
                    result = await toolkit.handle_tool_call(tool_call)
                    print(result.content)
                    messages.append({
                        "role": "user",
                        "content": [{
                            "toolResult": {
                                "toolUseId": result.toolUseId,
                                "content": result.content,
                            }
                        }]
                    })
                except:
                    print(f"ERROR: Can't invoke tool '{tool['toolUse']['name']}'.")
                    break

    except (ClientError, Exception) as e:
        print(f"ERROR: Can't invoke '{model_id}'. Reason: {e}")
        exit(1)
```


## Examples
See /examples for ready-to-run samples using:

 - [OpenAI Agent SDK](https://github.com/paypal/agent-toolkit/tree/main/python/examples/openai/app_agent.py)
 - [Assistants API](https://github.com/paypal/agent-toolkit/tree/main/python/examples/openai/app_assistant_chatbot.py)
 - [LangChain integration](https://github.com/paypal/agent-toolkit/tree/main/python/examples/langchain/app_agent.py)
 - [CrewAI integration](https://github.com/paypal/agent-toolkit/tree/main/python/examples/crewai/app_agent.py)


## Disclaimer
AI-generated content may be inaccurate or incomplete. Users are responsible for independently verifying any information before relying on it. PayPal makes no guarantees regarding output accuracy and is not liable for any decisions, actions, or consequences resulting from its use.

[app-keys]: https://developer.paypal.com/dashboard/applications/sandbox
