import asyncio
import os 
import boto3
from dotenv import load_dotenv
from botocore.exceptions import ClientError
from paypal_agent_toolkit.bedrock.toolkit import PayPalToolkit, BedrockToolBlock
from paypal_agent_toolkit.shared.configuration import Configuration, Context

#uncomment after setting the env file
# load_dotenv()
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")

client = boto3.client(
    service_name = 'bedrock-runtime',
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

toolkit = PayPalToolkit(client_id=PAYPAL_CLIENT_ID, secret=PAYPAL_CLIENT_SECRET, configuration = configuration)
tools = toolkit.get_tools()

userMessage = "Create one PayPal order for $50 for Premium News service with 10% tax."
messages = [
    {
        "role": "user",
        "content": [{ "text": userMessage }],
    }
]

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

if __name__ == "__main__":
    asyncio.run(main())

