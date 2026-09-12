# PayPal Agent Toolkit

[![npm version](https://img.shields.io/npm/v/@paypal/agent-toolkit.svg?label=npm%20(TypeScript))](https://www.npmjs.com/package/@paypal/agent-toolkit)
[![PyPI version](https://img.shields.io/pypi/v/paypal-agent-toolkit.svg?label=PyPI%20(Python))](https://pypi.org/project/paypal-agent-toolkit/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

The PayPal Agent Toolkit enables popular AI agent frameworks including **OpenAI's Agent SDK**, **LangChain**, **CrewAI**, **Vercel's AI SDK**, **Amazon Bedrock**, and **Model Context Protocol (MCP)** to integrate with PayPal APIs through function calling.

Built on top of PayPal APIs and SDKs, the toolkit is available for both **[TypeScript](./typescript)** and **[Python](./python)**.

## Repository Structure

- 📦 **[`/typescript`](./typescript)** — TypeScript package (`@paypal/agent-toolkit`) supporting Vercel AI SDK, LangChain.js, OpenAI, Amazon Bedrock, and MCP.
- 🐍 **[`/python`](./python)** — Python package (`paypal-agent-toolkit`) supporting LangChain, CrewAI, OpenAI, and Amazon Bedrock.
- 💡 **[`PROMPTS.md`](./PROMPTS.md)** — Ready-to-use prompt templates and parameter documentation for all available tools.

## Supported Frameworks

| Framework | TypeScript (`@paypal/agent-toolkit`) | Python (`paypal-agent-toolkit`) | Examples |
| :--- | :---: | :---: | :--- |
| **Vercel AI SDK** | ✅ (`@paypal/agent-toolkit/ai-sdk`) | — | [TypeScript Example](./typescript/examples/ai-sdk) |
| **LangChain** | ✅ (`@paypal/agent-toolkit/langchain`) | ✅ (`paypal_agent_toolkit.langchain`) | [TypeScript](./typescript/examples/langchain) / [Python](./python/examples/langchain) |
| **OpenAI Agents** | ✅ (`@paypal/agent-toolkit/openai`) | ✅ (`paypal_agent_toolkit.openai`) | [TypeScript](./typescript/examples/openai) / [Python](./python/examples/openai) |
| **CrewAI** | — | ✅ (`paypal_agent_toolkit.crewai`) | [Python Example](./python/examples/crewai) |
| **Amazon Bedrock** | ✅ (`@paypal/agent-toolkit/bedrock`) | ✅ (`paypal_agent_toolkit.bedrock`) | [TypeScript](./typescript/examples/bedrock) / [Python](./python/examples/bedrock) |
| **Model Context Protocol (MCP)** | ✅ (via [`@paypal/mcp`](https://www.npmjs.com/package/@paypal/mcp)) | — | Claude Desktop, Cursor, Cline |

## Available tools

The PayPal Agent toolkit provides the following tools:

**Invoices**

- `create_invoice`: Create a new invoice in the PayPal system, including recipient billing details, line items, an invoice note, a custom color theme, an optional shipping cost, and an option to enable PAY_BY_BANK as a payment method
- `list_invoices`: List invoices with optional pagination and filtering
- `get_invoice`: Retrieve details of a specific invoice
- `send_invoice`: Send an invoice to recipients
- `send_invoice_reminder`: Send a reminder for an existing invoice
- `cancel_sent_invoice`: Cancel a sent invoice
- `generate_invoice_qr_code`: Generate a QR code for an invoice
- `delete_invoice`: Permanently delete a draft or scheduled invoice
- `generate_invoice_number`: Generate the next invoice number available to the merchant
- `search_invoicing`: Search for invoices or recurring invoice series
- `update_invoicing`: Update an existing invoice or recurring invoice series (full-replacement)
- `cancel_invoice_auto_reminder`: Cancel all scheduled automatic reminders for an invoice
- `record_payment_for_invoice`: Record an external or manual payment against an invoice
- `record_refund_for_invoice`: Record a refund against an invoice
- `create_conditional_rules_for_invoice`: Create conditional rules for an invoice, such as an early payment discount or automatic cancellation date

- `create_recurring_series`: Create a recurring invoice series that automatically generates and sends invoices on a schedule
- `activate_recurring_series`: Activate a draft recurring invoice series
- `get_recurring_series`: Retrieve details of a specific recurring invoice series
- `cancel_recurring_series`: Cancel an active recurring invoice series
- `delete_recurring_series`: Delete a draft recurring invoice series

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
- `update_shipment_tracking`: Update shipment tracking information

**Catalog Management**

- `create_product`: Create a new product in the PayPal catalog
- `list_products`: List products with optional pagination and filtering
- `show_product_details`: Retrieve details of a specific product

**Subscription Management**

- `create_subscription_plan`: Create a new subscription plan
- `update_plan`: Update an existing subscription plan
- `list_subscription_plans`: List subscription plans
- `show_subscription_plan_details`: Retrieve details of a specific subscription plan
- `create_subscription`: Create a new subscription
- `show_subscription_details`: Retrieve details of a specific subscription
- `update_subscription`: update an existing subscription
- `cancel_subscription`: Cancel an active subscription


**Reporting and Insights**

- `list_transactions`: List transactions with optional pagination and filtering
- `get_merchant_insights`: Retrieve business intelligence metrics and analytics for a merchant

## Installation

### TypeScript (Node.js 18+)

```bash
npm install @paypal/agent-toolkit
```

For full TypeScript documentation, configuration options, and framework guides, see **[`typescript/README.md`](./typescript/README.md)**.

### Python (Python 3.11+)

```bash
pip install paypal-agent-toolkit
```

For full Python documentation, configuration options, and framework guides, see **[`python/README.md`](./python/README.md)**.

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
        createRecurringSeries: true,
        list: true,
        send: true,
        sendReminder: true,
        cancel: true,
        delete: true,
        generateQRC: true,
        generateInvoiceNumber: true,
        search: true,
        update: true,
        cancelReminders: true,
        recordPayment: true,
        recordRefund: true,
        createConditionalRules: true,
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

To use sandbox mode, add context within your configuration.

```typescript
configuration: {
  context: {
    sandbox: true,
  }
}
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

### Using with Python (LangChain)

```python
import os
from paypal_agent_toolkit.langchain.toolkit import PayPalToolkit
from paypal_agent_toolkit.shared.configuration import Configuration

toolkit = PayPalToolkit(
    client_id=os.environ["PAYPAL_CLIENT_ID"],
    client_secret=os.environ["PAYPAL_CLIENT_SECRET"],
    configuration=Configuration(
        context={"sandbox": True}
    )
)

# Pass tools to your LangChain agent
tools = toolkit.get_tools()
```

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

Copy the `access_token` value for use in your API or MCP integration.

## Token Details

- **Sandbox Tokens**: Valid for 3-8 hours
- **Production Tokens**: Valid for 8 hours
- It's recommended to implement token refresh logic before expiration

## Using with Model Context Protocol (MCP) & Claude Desktop

The PayPal Agent Toolkit powers the official PayPal MCP server ([`@paypal/mcp`](https://www.npmjs.com/package/@paypal/mcp)), enabling assistants like Claude Desktop, Cursor, and Cline to interact with PayPal via natural language.

To connect with Claude Desktop, add the server to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "paypal": {
      "command": "npx",
      "args": ["-y", "@paypal/mcp@latest"],
      "env": {
        "PAYPAL_CLIENT_ID": "YOUR_CLIENT_ID",
        "PAYPAL_CLIENT_SECRET": "YOUR_CLIENT_SECRET",
        "PAYPAL_ENVIRONMENT": "SANDBOX"
      }
    }
  }
}
```

Alternatively, if using an access token:

```json
{
  "mcpServers": {
    "paypal": {
      "command": "npx",
      "args": ["-y", "@paypal/mcp@latest"],
      "env": {
        "PAYPAL_ACCESS_TOKEN": "YOUR_ACCESS_TOKEN",
        "PAYPAL_ENVIRONMENT": "SANDBOX"
      }
    }
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
