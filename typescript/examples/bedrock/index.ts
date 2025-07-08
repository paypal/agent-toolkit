import { config } from '@dotenvx/dotenvx';
import { PayPalAgentToolkit, ALL_TOOLS_ENABLED } from '@paypal/agent-toolkit/langchain';
import { BedrcokRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const envFilePath = process.env.ENV_FILE_PATH || '.env';
config({path: envFilePath});

const client = new BedrcokRuntimeClient({ region: "us-east-1"})
const modelID = "anthropic.claude-3-haiku-20240307-v1:0";

const ppConfig = {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    configuration: {
        actions: ALL_TOOLS_ENABLED
    }
}

const paypalToolkit = new PayPalAgentToolkit(ppConfig);
let tools = paypalToolkit.getTools();

const userMessage = "Create an PayPal order for $50 for Premium News service.";
const conversation = [
    {
        role: "user",
        content: [{ text: userMessage}],
    },
];

(async () => {
    const response = await client.send(
        new ConverseCommand({ 
            modelID, 
            messages: conversation,
            toolConfig: {
                tools: tools
            }
        }),
    );

    const responseText = response.output.message.content[0].text;
    console.log(responseText);
})();