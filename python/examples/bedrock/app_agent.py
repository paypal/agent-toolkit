import os 
import boto3
import asyncio
from dotenv import load_dotenv
from paypal_agent_toolkit.bedrock.toolkit import PayPalToolkit
from paypal_agent_toolkit.shared.configuration import Configuration, Context

#uncomment after setting the env file
# load_dotenv()
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")

toolkit = boto3.client(
    servive_name = 'bedrock-runtime',
    region_name = 'us-west-2',
    aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
)

model_id = "anthropic.claude-3-5-haiku-20241022-v1:0"

configuration = Configuration(
    actions = {
        "orders": {
            "create": True,
            "get": True,
            "capture": True,
        }
    },
    context = Context(
        sandbox = True
    )
)

toolkit = PayPalToolkit(client_id=PAYPAL_CLIENT_ID, secret=PAYPAL_SECRET, configuration = configuration)
tools = toolkit.get_tools()

userMessage = "Create one PayPal order for $50 for Premium News service with 10% tax."

async def main():
    messages: List[Dict[str, Any]] = [
        {
            "role": "user",
            "content": [{ "text": userMessage }],
        }
    ]
    while True: 
        response = bedrock_client.converse(
            modelId=model_id,
            messages=messages,
            toolConfig=tool_config
        )
        reply = response['output']['message']
        print(reply)
        messages.append(reply)
        

if __name__ == "__main__":
    try:
        aysncio.run(main())
    except RuntimeError:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(main())