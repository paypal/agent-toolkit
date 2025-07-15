import { config } from '@dotenvx/dotenvx';
import { PayPalAgentToolkit, ALL_TOOLS_ENABLED } from '@paypal/agent-toolkit/bedrock';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const envFilePath = process.env.ENV_FILE_PATH || '.env';
config({path: envFilePath});

const client = new BedrockRuntimeClient({ 
    region: "us-west-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    }
});

const modelId = "anthropic.claude-3-5-haiku-20241022-v1:0";

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

(async () => {
    const response = await client.send(
        new ConverseCommand({ 
            modelId: modelId,
            messages: [
                {
                    role: "user",
                    content: [{ text: userMessage }],
                },
            ],
            toolConfig: {
                tools: tools
            }
        }),
    );

    const responseText = response.output?.message?.content?.[0]?.text;
    console.log(responseText);
})();