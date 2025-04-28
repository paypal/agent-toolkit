import os
import sys
from openai import OpenAI
import asyncio
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))
from agents import Agent, Runner
from paypal_agent_toolkit.openai.toolkit import PayPalToolkit
from paypal_agent_toolkit.openai.tool import PayPalTool
from paypal_agent_toolkit.shared.configuration import Configuration, Context

#uncomment after setting the env file
# load_dotenv()
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")

configuration = Configuration(
    actions={
        "orders": {
            "create": True,
            "capture": True,
            "get": True
        },
        "products": {
            "create": True,
            "list": True,
            "show": True
        },
        "subscriptionPlans": {
            "create": True,
            "list": True,
            "show": True
        },
        "subscriptions": {
            "create": True,
            "show": True,
            "cancel": True
        },
        "invoices": {
            "create": True,
            "get": True,
            "list": True,
            "send": True,
            "sendReminder": True,
            "cancel": True,
            "generateQRC": True,
        },
        "shipment": {
            "create": True,
            "get": True,
            "list": True
        },
        "disputes": {
            "create": True,
            "get": True,
            "list": True
        },
        "transactions": {
            "list": True
        },
    },
    context=Context(
        sandbox=True,
    )
)


# Initialize toolkit
toolkit = PayPalToolkit(PAYPAL_CLIENT_ID, PAYPAL_SECRET, configuration)
tools = toolkit.get_tools()


# OpenAI client with SSL verify off
client = OpenAI()

# Initialize OpenAI Agent
agent = Agent(
    name="PayPal Assistant",
    instructions="""
    You are a helpful assistant that manages PayPal transactions.
    Help users with tasks like creating an order, capturing payment after approval, and checking order status.
    """,
    model="gpt-4o",
    tools=tools
)

runner = Runner()

# Step 1: Create Order
# Step 2: Get Order Details (to show approval link)
# Step 3: Wait for User to Approve
# Step 4: Capture Payment
async def main():
    print("🚀 Starting PayPal Order Workflow...")

    try:
        # Step 1: Create Order
        user_prompt_create = "I want to buy a gaming keyboard for $100. Help me create the order."
        print("\n🛒 Step 1: Creating Order...")
        result_create = await runner.run(agent, user_prompt_create)

        if not hasattr(result_create, "final_output") or not result_create.final_output:
            raise Exception("Failed to create order.")

        order_id = result_create.final_output.strip()
        print(f"✅ Order Created: {order_id}")


        # Step 2: Get Order Details (to show approval link)
        user_prompt_details = f"Can you show me the details for my recent order ID: {order_id}?"
        print("\n🔎 Step 2: Retrieving Order Details...")
        result_details = await runner.run(agent, user_prompt_details)

        if not hasattr(result_details, "final_output") or not result_details.final_output:
            raise Exception("Failed to retrieve order details.")

        order_details = result_details.final_output.strip()
        print(f"\n📄 Order Details:\n{order_details}")

        print("\n🔗 Please approve the order using the approval URL shown above.")


        # Step 3: Wait for User to Approve
        input("\n⏳ Press Enter once buyer has approved the order in PayPal...")


        # Step 4: Capture Payment
        user_prompt_capture = f"I have approved the order. Can you process the payment for order ID: {order_id}?"
        print("\n💳 Step 4: Capturing Payment after approval...")
        result_capture = await runner.run(agent, user_prompt_capture)

        if not hasattr(result_capture, "final_output") or not result_capture.final_output:
            raise Exception("Failed to capture payment.")

        capture_response = result_capture.final_output.strip()
        print(f"✅ Payment Captured: {capture_response}")

        print("\n🏁 PayPal Order Workflow Completed Successfully.")

    except Exception as e:
        print(f"❌ Error during workflow: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except RuntimeError:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(main())