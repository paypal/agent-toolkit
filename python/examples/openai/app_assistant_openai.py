
import os
import json
import time
import httpx
import webbrowser
import sys
from openai import OpenAI
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))
from paypal_agent_toolkit.openai.toolkit import PayPalToolkit
from paypal_agent_toolkit.shared.configuration import Configuration, Context

#uncomment after setting the env file
# load_dotenv()
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")
OPENAI_API_VERSION = "2024-02-15-preview"

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
tools = toolkit.get_openai_chat_tools()
paypal_api = toolkit.get_paypal_api()


# OpenAI client with SSL verify off
client = OpenAI()

# Create assistant
assistant = client.beta.assistants.create(
    name="PayPal Checkout Assistant",
    instructions=f"""
You help users create and process payment for PayPal Orders. When the user wants to make a purchase,
use the create_order tool and share the approval link. After approval, use capture_order.
""",
    model="gpt-4-1106-preview",
    tools=tools
)

# Create thread
thread = client.beta.threads.create()

def run_agent(prompt: str):
    client.beta.threads.messages.create(thread_id=thread.id, role="user", content=prompt)
    run = client.beta.threads.runs.create(thread_id=thread.id, assistant_id=assistant.id)

    while True:
        run = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
        if run.status == "completed":
            break
        elif run.status == "requires_action":
            outputs = []
            for tool_call in run.required_action.submit_tool_outputs.tool_calls:
                method = tool_call.function.name
                args = tool_call.function.arguments
                # print(f"⚙️ Calling tool: {method} with args: {args}")
                result = json.loads(paypal_api.run( method, json.loads(args)))
                # print(f"🔧 Tool result: {result}")
                if method == "create_order":
                    for link in result.get("links", []):
                        if link["rel"] == "payer-action":
                            result["checkout_url"] = link["href"]
                            print(f"🟢 Approve URL: {link['href']}")
                            webbrowser.open(link['href'])

                outputs.append({"tool_call_id": tool_call.id, "output": json.dumps(result)})
            client.beta.threads.runs.submit_tool_outputs(thread_id=thread.id, run_id=run.id, tool_outputs=outputs)
        else:
            time.sleep(1)

    steps = client.beta.threads.runs.steps.list(thread_id=thread.id, run_id=run.id)
    for step in reversed(steps.data):
        if step.type == "message_creation":
            msg_id = step.step_details.message_creation.message_id
            msg = client.beta.threads.messages.retrieve(thread_id=thread.id, message_id=msg_id)
            print("🤖 Assistant:", msg.content[0].text.value)
            break


def main():
    print("💬 PayPal Assistant with Explicit Prompts (type 'exit' to quit)")

    while True:
        user_input = input("\nYou: ").strip()
        if user_input.lower() in {"exit", "quit"}:
            print("👋 Goodbye!")
            break
        run_agent(user_input)

if __name__ == "__main__":
    main()
