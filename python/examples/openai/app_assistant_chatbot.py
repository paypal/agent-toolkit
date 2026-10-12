import os
import json
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
MODEL = "gpt-4o"

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
paypal_api = toolkit.get_paypal_api()

# The Responses API expects function tools in a flat format ({"type", "name", "description",
# "parameters"}) instead of the Chat Completions format ({"type", "function": {...}}).
# strict is disabled because the toolkit's schemas contain optional fields.
tools = [
    {
        "type": "function",
        "name": tool["function"]["name"],
        "description": tool["function"]["description"],
        "parameters": tool["function"]["parameters"],
        "strict": False,
    }
    for tool in toolkit.get_openai_chat_tools()
]

INSTRUCTIONS = """
You help users create and process payment for PayPal Orders. When the user wants to make a purchase,
use the create_order tool and share the approval link. After approval, use pay_order.
"""

client = OpenAI()

# The Responses API keeps conversation state server-side: passing the previous response id
# replaces the Assistants API thread.
previous_response_id = None


def run_tool(method: str, args: str) -> dict:
    result = json.loads(paypal_api.run(method, json.loads(args)))
    if method == "create_order":
        for link in result.get("links", []):
            if link["rel"] == "payer-action":
                result["checkout_url"] = link["href"]
                print(f"🟢 Approve URL: {link['href']}")
                webbrowser.open(link['href'])
    return result


def run_agent(prompt: str):
    global previous_response_id

    # Instructions are not carried over by previous_response_id, so they are sent on every request.
    response = client.responses.create(
        model=MODEL,
        instructions=INSTRUCTIONS,
        tools=tools,
        input=prompt,
        previous_response_id=previous_response_id,
    )

    # Keep executing tool calls until the model returns a final answer.
    while True:
        tool_calls = [item for item in response.output if item.type == "function_call"]
        if not tool_calls:
            break

        outputs = []
        for tool_call in tool_calls:
            # print(f"⚙️ Calling tool: {tool_call.name} with args: {tool_call.arguments}")
            result = run_tool(tool_call.name, tool_call.arguments)
            # print(f"🔧 Tool result: {result}")
            outputs.append({
                "type": "function_call_output",
                "call_id": tool_call.call_id,
                "output": json.dumps(result),
            })

        response = client.responses.create(
            model=MODEL,
            instructions=INSTRUCTIONS,
            tools=tools,
            input=outputs,
            previous_response_id=response.id,
        )

    previous_response_id = response.id
    print("🤖 Assistant:", response.output_text)


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
