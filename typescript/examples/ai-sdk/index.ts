import { config } from '@dotenvx/dotenvx'
import { generateText, LanguageModelV1 } from 'ai';
// @ts-ignore
import { PayPalWorkflows, PayPalAgentToolkit } from '@paypal/agent-toolkit/ai-sdk';
import * as readline from "readline";

// Get the env file path from an environment variable, with a default fallback
const envFilePath = process.env.ENV_FILE_PATH;
config({ path: envFilePath });

/*
 * This is the merchant's typical use case. This stays the same for most requests.
 */
const systemPrompt = `I am a plumber running a small business. I charge $120 per hour plus 50% tax. I use standard parts which typically include a new faucet costing between $50-80 and pipes for about $3 per foot. There is 12% tax for parts. My return URL is: http://localhost:3000/thank-you.`

const agentLog = console.log;
let agent_prefix = `Agent: `;
let user_prefix = `You: `;

/*
 * This holds all the configuration required for starting PayPal Agent Toolkit
 */

const ppConfig = {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    environment: process.env.PAYPAL_ENVIRONMENT || 'Sandbox',
    logRequestDetails: process.env.PAYPAL_LOG_REQUESTS || 'false',
    logResponseDetails: process.env.PAYPAL_LOG_RESPONSES || 'false',
    debug: process.env.PAYPAL_DEBUG_FLOWS || 'false',
    logger: console.log
}
/*
 * This holds all the tools that use PayPal functionality
 */
const paypalToolkit = new PayPalAgentToolkit(ppConfig);
/*
 * This holds all the preconfigured common PayPal workflows
 */
const paypalWorkflows = new PayPalWorkflows(ppConfig)

/*
 * Merchant needs to track the orders on their side so that they can retrieve orderID for future processing
 */
let tracker // Add the logic for tracking orders;

let modelInstance// User can bring their own models;
let llm: LanguageModelV1 = modelInstance.getModel();

const main = async () => {
    // Start the Chatbot
    const welcomeMsg = (`\nHow can I help you today? You can enter details to create an order\n[type 'exit' to stop.]\n\n`);
    chat(welcomeMsg);
}

async function getInfo(summary: string, value: string) {
    const { text: result } = await generateText({
        model: llm,
        prompt: `Extract ${value} from the prompt: ${summary}. Return only the extracted value.`,
    });
    return result;
}

const chat = (message: string) => {
    // Simple readline integration
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    rl.question(message, async (userPrompt: string) => {
        if (userPrompt.toLowerCase() === "exit") {
            agentLog(`${agent_prefix}Goodbye!`);
            rl.close();
            return;
        }

        try {
            if (userPrompt.toLowerCase().includes('order')) {
                agentLog(`${agent_prefix}Sure! Let me do that in steps.`)
                const customerName = await getInfo(userPrompt, 'customer name');
                const orderSummary = await paypalWorkflows.generateOrder(llm, userPrompt, systemPrompt);
                const orderId = await getInfo(orderSummary, 'orderId');
                tracker.addOrder(customerName, orderId);
                agentLog(orderSummary);
            } else if (userPrompt.toLowerCase().includes('details') && userPrompt.toLowerCase().includes('orderId')) {
                const {text: orderDetails} = await generateText({
                    model: llm,
                    tools: await paypalToolkit.getTools(),
                    maxSteps: 10,
                    prompt: userPrompt,
                });
                const orderId = await getInfo(userPrompt, 'orderId');
                agentLog(`Response 3: Here is the order details with ID: ${orderId}; ${JSON.stringify(orderDetails, null, 2)}`);
            }
        } catch (error) {
            console.error('Error generating text:', error);
        }

        chat(`\n${user_prefix}`); // Loop again for continuous conversation
    });
};

main();
