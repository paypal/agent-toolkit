# PayPal Agent Toolkit

The PayPal Agent Toolkit enables popular agent frameworks including OpenAI's Agent SDK, LangChain, Vercel's AI SDK, and Model Context Protocol (MCP) to integrate with PayPal APIs through function calling. It includes support for TypeScript and is built on top of PayPal APIs and the PayPal [Node][node-sdk] SDKs.

## TypeScript

### Installation

You don't need this source code unless you want to modify the package. If you just
want to use the package run:

```
npm install @paypal/agent-toolkit
```

#### Requirements

- Node 18+

### Usage

The library needs to be configured with your account's client id and secret which is available in your [PayPal Developer Dashboard][api-keys]. 

```typescript
import {PayPalAgentToolkit} from '@paypal/agent-toolkit/ai-sdk';
const paypalToolkit = new PayPalAgentToolkit({
     clientId: process.env.PAYPAL_CLIENT_ID,
     clientSecret: process.env.PAYPAL_CLIENT_SECRET
});

const llm: LanguageModelV1 = getModel(); // The model to be used with ai-sdk
const {text: response}= await generateText({
    model: llm,
    tools: await paypalToolkit.getTools(),
    prompt: `Create an invoice for 3 hours of labor at $120/hr and text a link to John Doe.`,
});

```

#### Tools

The toolkit works with LangChain and Vercel's AI SDK and can be passed as a list of tools. For example:

```typescript
import { AgentExecutor, createStructuredChatAgent } from "langchain/agents";

const tools = payPalAgentToolkit.getTools();

const agent = await createStructuredChatAgent({
  llm,
  tools,
  prompt,
});

const agentExecutor = new AgentExecutor({
  agent,
  tools,
});
```

## Model Context Protocol

The PayPal Agent Toolkit also supports the [Model Context Protocol (MCP)](https://modelcontextprotocol.com/).

To run the PayPal MCP server using npx, use the following command:

```bash
# Start MCP Inspector and server with all tools
npx @modelcontextprotocol/inspector node dist/index.js --tools=all --client-id=YOUR_CLIENT_ID --client-secret=YOUR_CLIENT_SECRET --sandbox=true
```

Replace `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET` with your PayPal client credentials available in your [PayPal Developer Dashboard][api-keys]. Alternatively, you could set the PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your environment variables.

Alternatively, you can set up your own MCP server. For example:

```typescript
import { PayPalAgentToolkit } from “@paypal/agent-toolkit/modelcontextprotocol";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const tools = payPalAgentToolkit.getTools();

const server = new PayPalAgentToolkit({
	clientId: process.env.PAYPAL_CLIENT_ID,
	clientSecret: process.env.PAYPAL_CLIENT_SECRET
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("PayPal MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
```

## Supported API methods

TBD

[node-sdk]: https://github.com/paypal/paypal-typescript-server-sdk
[api-keys]: https://developer.paypal.com/dashboard/applications/sandbox
