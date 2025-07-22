import os 
import boto3
from dotenv import load_dotenv
from botocore.exceptions import ClientError
from paypal_agent_toolkit.bedrock.toolkit import PayPalToolkit
from paypal_agent_toolkit.shared.configuration import Configuration, Context

#uncomment after setting the env file
load_dotenv()
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
#tools = toolkit.get_tools()
raw_tools = toolkit.get_tools()

tools = []
for tool in raw_tools:
    if hasattr(tool, 'toolSpec'):
        # If toolSpec already exists, use it
        tools.append({"toolSpec": tool.toolSpec})
    else:
        # If tool is a dict, wrap it in toolSpec
        tool_dict = tool.to_dict() if hasattr(tool, 'to_dict') else tool
        tools.append({"toolSpec": tool_dict})


userMessage = "Create one PayPal order for $50 for Premium News service with 10% tax."
messages = [
    {
        "role": "user",
        "content": [{ "text": userMessage }],
    }
]

try: 
    response = client.converse(
        modelId=model_id,
        messages=messages,
        toolConfig={
            "tools": tools
        }
    )

    response_text = response["output"]["message"]["content"][0]["text"]
    print(response_text)
    response_tool = response["output"]["message"]["content"][1]
    print(response_tool)

except (ClientError, Exception) as e:
    print(f"ERROR: Can't invoke '{model_id}'. Reason: {e}")
    exit(1)