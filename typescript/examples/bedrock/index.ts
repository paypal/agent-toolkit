import { config } from '@dotenvx/dotenvx';
import { PayPalAgentToolkit, ALL_TOOLS_ENABLED } from '@paypal/agent-toolkit/bedrock';
import { BedrockRuntimeClient, ConverseCommand, Message } from '@aws-sdk/client-bedrock-runtime';

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
        actions: ALL_TOOLS_ENABLED, 
        context: {
            sandbox: true,
        }
    }
}

const paypalToolkit = new PayPalAgentToolkit(ppConfig);
let tools = paypalToolkit.getTools();

// const userMessage = "Create one PayPal order for $50 for Premium News service with 10% tax.";
// const userMessage = "Retrieve the shipment tracking info for tracking-id 38K406615P866240D-12345 and transaction id 38K406615P866240D";
const userMessage = "update the the shipment tracking info for and transaction-id 38K406615P866240D and make sure the tracking number is now 42000. it has also been shipped and the carrier is fedex";
//{{base_url}}/v1/shipping/trackers/:tracking_id

(async (): Promise<void> => {
    let messages: Message[] = [
        {
            role: "user",
            content: [{ text: userMessage }],
        }
    ]
    while (true) {
        const response = await client.send(
            new ConverseCommand({ 
                modelId: modelId,
                messages: messages,
                toolConfig: {
                    tools: tools
                }
            }),
        );
        
        const reply = response.output?.message;
        if (!reply) {
            console.log("No reply received from the model.");
            break;
        }
        messages.push(reply);

        const toolsCalled = reply.content?.filter(content => content.toolUse);
        if (toolsCalled && toolsCalled.length > 0) {
            const toolResults = await Promise.all(
                toolsCalled.map(async (block) => {
                    if (!block.toolUse?.toolUseId || !block.toolUse?.name || !block.toolUse?.input) {
                        throw new Error("Missing required toolUse properties");
                    }
                    const toolCall = {
                        toolUseId: block.toolUse.toolUseId,
                        name: block.toolUse.name,
                        input: block.toolUse.input
                    };
                    const result = await paypalToolkit.handleToolCall(toolCall);
                    return {
                        toolResult: {
                        toolUseId: result.toolUseId,
                        content: result.content
                        }
                    };
                })
            );
            messages.push({
                role: "user",
                content: toolResults
            });
        } else {
            const textContent = reply.content?.find(content => content.text);
            console.log(textContent?.text || reply);
            break;
        }
    }
})();