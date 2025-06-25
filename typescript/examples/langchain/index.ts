import { config } from '@dotenvx/dotenvx';
import { ChatOpenAI } from '@langchain/openai';
import { PayPalLangChainToolkit, ALL_TOOLS_ENABLED} from '@paypal/agent-toolkit/langchain';
import { createReactAgent } from '@langchain/langgraph/prebuilt';

const envFilePath = process.env.ENV_FILE_PATH || '.env';
config({path: envFilePath});

const llm = new ChatOpenAI({
    temperature: 0.3,
    model: 'gpt-4o', 
  });

const ppConfig = {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    configuration: {
        actions: ALL_TOOLS_ENABLED
    }
}

const paypalToolkit = new PayPalLangChainToolkit(ppConfig);
const tools = paypalToolkit.getTools();
  
const agent = createReactAgent({
    llm: llm,
    tools: tools,
});

(async () => {
    const agent = createReactAgent({
        llm: llm,
        tools: tools,
    });
    
    const result = await agent.invoke(
        {
            messages: [{
                role: "user",
                content: "Create an PayPal order for $50 for Premium News service."
            }]
        }
    );
})();