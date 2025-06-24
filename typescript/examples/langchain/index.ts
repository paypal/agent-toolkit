import { config } from '@dotenvx/dotenvx';
// import { ChatOpenAI } from '@langchain/openai';
// import {AgentExecutor, createStructuredChatAgent} from 'langchain/agents';
// import type {ChatPromptTemplate} from '@langchain/core/prompts';
//import {pull} from 'langchain/hub';
import {PayPalWorkflows, PayPalAgentToolkit, ALL_TOOLS_ENABLED} from '@paypal/agent-toolkit/langchain';
// import { PayPalLangChainToolkit} from '@paypal/agent-toolkit/langchain';
// import { Configuration, Context } from '@paypal/agent-toolkit/shared/configuration';

// Load environment variables from .env file
config();

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const OPENAI_API_VERSION = '2024-02-15-preview';

// const llm = new ChatOpenAI({
//   temperature: 0.3,
//   model: 'gpt-4', 
// });

// const configuration = new Configuration({
//   actions: {
//     orders: {
//       create: true,
//       get: true,
//       capture: true,
//     },
//   },
//   context: new Context({
//     sandbox: true,
//   }),
// });


// const toolkit = new PayPalLangChainToolkit({
//   clientId: PAYPAL_CLIENT_ID,
//   secret: PAYPAL_SECRET,
//   configuration: configuration,
// });
// const tools = toolkit.getTools();


// (async (): Promise<void> => {
//   //const prompt = await pull<ChatPromptTemplate>(
//   //  'hwchase17/structured-chat-agent'
//   const prompt = 'hello';


//   const agent = await createStructuredChatAgent({
//     llm,
//     tools,
//     prompt,
//   });

//   const agentExecutor = new AgentExecutor({
//     agent,
//     tools,
//   });

// const response = await agentExecutor.invoke({
//   input: `
//     Create a payment link for a new product called 'test' with a price
//     of $100. Come up with a funny description about buy bots,
//     maybe a haiku.
//   `,
// });

// console.log(response);
// })();