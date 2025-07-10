# PayPal Agent Toolkit

The PayPal Agent Toolkit enables popular agent frameworks including OpenAI's Agent SDK, LangChain, Vercel's AI SDK, and Model Context Protocol (MCP) to integrate with PayPal APIs through function calling. It includes support for TypeScript and is built on top of PayPal APIs and the PayPal SDKs.


## Available tools

The PayPal Agent toolkit provides the following tools:

**Invoices**

- `create_invoice`: Create a new invoice in the PayPal system
- `list_invoices`: List invoices with optional pagination and filtering
- `get_invoice`: Retrieve details of a specific invoice
- `send_invoice`: Send an invoice to recipients
- `send_invoice_reminder`: Send a reminder for an existing invoice
- `cancel_sent_invoice`: Cancel a sent invoice
- `generate_invoice_qr_code`: Generate a QR code for an invoice

**Payments**

- `create_order`: Create an order in PayPal system based on provided details
- `get_order`: Retrieve the details of an order
- `pay_order`: Process payment for an authorized order
- `create_refund`: Process a refund for a captured payment.
- `get_refund`: Get the details for a specific refund.

**Dispute Management**

- `list_disputes`: Retrieve a summary of all open disputes
- `get_dispute`: Retrieve detailed information of a specific dispute
- `accept_dispute_claim`: Accept a dispute claim

**Shipment Tracking**

- `create_shipment_tracking`: Create a shipment tracking record
- `get_shipment_tracking`: Retrieve shipment tracking information

**Catalog Management**

- `create_product`: Create a new product in the PayPal catalog
- `list_products`: List products with optional pagination and filtering
- `show_product_details`: Retrieve details of a specific product

**Subscription Management**

- `create_subscription_plan`: Create a new subscription plan
- `list_subscription_plans`: List subscription plans
- `show_subscription_plan_details`: Retrieve details of a specific subscription plan
- `create_subscription`: Create a new subscription
- `show_subscription_details`: Retrieve details of a specific subscription
- `update_subscription`: update an existing subscription
- `cancel_subscription`: Cancel an active subscription

**Reporting and Insights**

- `list_transactions`: List transactions with optional pagination and filtering

## TypeScript

### Installation

You don't need this source code unless you want to modify the package. If you just
want to use the package run:

```sh
npm install @paypal/agent-toolkit
```

#### Requirements

- Node 18+

### Usage

The library needs to be configured with your account's client id and secret which is available in your [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/). 


The toolkit works with Vercel's AI SDK and can be passed as a list of tools. For more details, refer our [examples](./typescript/examples)

```typescript
import { PayPalAgentToolkit } from '@paypal/agent-toolkit/ai-sdk';
const paypalToolkit = new PayPalAgentToolkit({
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  configuration: {
    actions: {
      invoices: {
        create: true,
        list: true,
        send: true,
        sendReminder: true,
        cancel: true,
        generateQRC: true,
      },
      products: { create: true, list: true, update: true },
      subscriptionPlans: { create: true, list: true, show: true },
      shipment: { create: true, show: true, cancel: true },
      orders: { create: true, get: true },
      disputes: { list: true, get: true },
    },
  },
});
```

### Initializing the Workflows

```typescript
import { PayPalWorkflows, ALL_TOOLS_ENABLED } from '@paypal/agent-toolkit/ai-sdk';
const paypalWorkflows = new PayPalWorkflows({
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  configuration: {
    actions: ALL_TOOLS_ENABLED,
  },
});
```

## Usage

### Using the toolkit

```typescript
const llm: LanguageModelV1 = getModel(); // The model to be used with ai-sdk
const { text: response } = await generateText({
  model: llm,
  tools: paypalToolkit.getTools(),
  maxSteps: 10,
  prompt: `Create an order for $50 for custom handcrafted item and get the payment link.`,
});

```

## PayPal Model Context Protocol

The PayPal [Model Context Protocol](https://modelcontextprotocol.com/) server allows you to integrate with PayPal APIs through function calling. This protocol supports various tools to interact with different PayPal services.

### Running MCP Inspector

To run the PayPal MCP server using npx, use the following command:

```bash
npx -y @paypal/mcp --tools=all PAYPAL_ACCESS_TOKEN="YOUR_ACCESS_TOKEN" PAYPAL_ENVIRONMENT="SANDBOX"
```

Replace `YOUR_ACCESS_TOKEN` with active access token generated using these steps: [PayPal access token](#generating-an-access-token). Alternatively, you could set the PAYPAL_ACCESS_TOKEN in your environment variables.

### Custom MCP Server
You can set up your own MCP server. For example:

```typescript
import { PayPalAgentToolkit } from “@paypal/agent-toolkit/modelcontextprotocol";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const orderSummary = await paypalWorkflows.generateOrder(
  llm,
  transactionInfo,
  merchantInfo,
);

const server = new PayPalAgentToolkit({
	accessToken: process.env.PAYPAL_ACCESS_TOKEN
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

### Usage with MCP host (Claude Desktop/Cline/Cursor/Github Co-Pilot)

This guide explains how to integrate the PayPal connector with Claude Desktop.

## Prerequisites
- Claude Desktop application installed
- installing Node.js locally

## Installation Steps

### 1. Install Node.js

Node.js is required for the PayPal connector to function:

1. Visit the [Node.js official website](https://nodejs.org/), download and install it.
2. Requirements: Node 18+

### 2. Configure PayPal Connector with MCP host (Claude desktop / Cursor / Cline)
We will show the integration with Claude desktop. You can use your favorite MCP host.
1. Open Claude Desktop
2. Navigate to Settings
3. Find the Developer or Advanced settings section
4. Locate the external tools or connectors configuration area
5. Add the following PayPal connector configuration to this ~/Claude/claude_desktop_config.json:

```json
{
   "mcpServers": {
     "paypal": {
       "command": "npx",
       "args": [
         "-y",
         "@paypal/mcp",
         "--tools=all"
       ],
       "env": {
         "PAYPAL_ACCESS_TOKEN": "YOUR_PAYPAL_ACCESS_TOKEN",
         "PAYPAL_ENVIRONMENT": "SANDBOX"
       }
     }
   }
}
```
Make sure to replace `YOUR_PAYPAL_ACCESS_TOKEN` with your actual PayPal Access Token. Alternatively, you could set the PAYPAL_ACCESS_TOKEN as an environment variable. You can also pass it as an argument using --access-token in "args"
Set `PAYPAL_ENVIRONMENT` value as either `SANDBOX` for stage testing and `PRODUCTION` for production environment.

6. Save your configuration changes

### 3. Test the Integration

1. Quit and restart Claude Desktop to apply changes
2. Test the connection by asking Claude to perform a PayPal-related task
   - Example: \"List my PayPal invoices\"

## Environment Variables

The following environment variables can be used:

- `PAYPAL_ACCESS_TOKEN`: Your PayPal Access Token
- `PAYPAL_ENVIRONMENT`: Set to `SANDBOX` for sandbox mode, `PRODUCTION` for production (defaults to `SANDBOX` mode)


This guide explains how to generate an access token for PayPal API integration, including how to find your client ID and client secret.



## Prerequisites

- PayPal Developer account (for Sandbox)
- PayPal Business account (for production)

## Finding Your Client ID and Client Secret

1. **Create a PayPal Developer Account**:
   - Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
   - Sign up or log in with your PayPal credentials

2. **Access Your Credentials**:
   - In the Developer Dashboard, click on **Apps & Credentials** in the menu
   - Switch between **Sandbox** and **Live** modes depending on your needs
   
3. **Create or View an App**:
   - To create a new app, click **Create App**
   - Give your app a name and select a Business account to associate with it
   - For existing apps, click on the app name to view details

4. **Retrieve Credentials**:
   - Once your app is created or selected, you'll see a screen with your:
     - **Client ID**: A public identifier for your app
     - **Client Secret**: A private key (shown after clicking \"Show\")
   - Save these credentials securely as they are required for generating access tokens

## Generating an Access Token
### Using cURL

```bash
curl -v https://api-m.sandbox.paypal.com/v1/oauth2/token \\
  -H \"Accept: application/json\" \\
  -H \"Accept-Language: en_US\" \\
  -u \"CLIENT_ID:CLIENT_SECRET\" \\
  -d \"grant_type=client_credentials\"
```

Replace `CLIENT_ID` and `CLIENT_SECRET` with your actual credentials. For production, use `https://api-m.paypal.com` instead of the sandbox URL.


### Using Postman

1. Create a new request to `https://api-m.sandbox.paypal.com/v1/oauth2/token`
2. Set method to **POST**
3. Under **Authorization**, select **Basic Auth** and enter your Client ID and Client Secret
4. Under **Body**, select **x-www-form-urlencoded** and add a key `grant_type` with value `client_credentials`
5. Send the request

### Response

A successful response will look like:

```json
{
  "scope": "...",
  "access_token": "Your Access Token",
  "token_type": "Bearer",
  "app_id": "APP-80W284485P519543T",
  "expires_in": 32400,
  "nonce": "..."
}
```

Copy the `access_token` value for use in your Claude Desktop integration.

## Token Details

- **Sandbox Tokens**: Valid for 3-8 hours
- **Production Tokens**: Valid for 8 hours
- It's recommended to implement token refresh logic before expiration

## Using the Token with Claude Desktop

Once you have your access token, update the `PAYPAL_ACCESS_TOKEN` value in your Claude Desktop connector configuration:

```json
{
  "env": {
    "PAYPAL_ACCESS_TOKEN": "YOUR_NEW_ACCESS_TOKEN",
    "PAYPAL_ENVIRONMENT": "SANDBOX"
  }
}
```

## Best Practices

1. Store client ID and client secret securely
2. Implement token refresh logic to handle token expiration
3. Use environment-specific tokens (sandbox for testing, production for real transactions)
4. Avoid hardcoding tokens in application code

## Disclaimer
*AI-generated content may be inaccurate or incomplete. Users are responsible for independently verifying any information before relying on it. PayPal makes no guarantees regarding output accuracy and is not liable for any decisions, actions, or consequences resulting from its use.*
