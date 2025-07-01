# PayPal Agent Toolkit

The PayPal Agent Toolkit enables popular agent frameworks including OpenAI's Agent SDK, LangChain, Vercel's AI SDK, and Model Context Protocol (MCP) to integrate with PayPal APIs through function calling. It includes support for TypeScript and is built on top of PayPal APIs and the PayPal SDKs.

This toolkit also features an industry-leading, risk-based Zero-Trust security model for sensitive operations. For a detailed explanation of this enhancement, please see the **Addendum** at the end of this document.

## Available tools

Each tool is assigned a data sensitivity classification which determines the required security flow. This risk-based approach ensures that sensitive operations are protected with a Zero-Trust handshake, while less sensitive operations remain efficient. For a detailed overview of the data classification methodology, please see this [**explanation of data classification**](https://github.com/rabbidave/LatentSpace.Tools/blob/main/classify.md).

**Invoices**
*   `[Class 3]` **create_invoice**: Create a new invoice in the PayPal system
*   `[Class 4]` **list_invoices**: List invoices with optional pagination and filtering
*   `[Class 4]` **get_invoice**: Retrieve details of a specific invoice
*   `[Class 3]` **send_invoice**: Send an invoice to recipients
*   `[Class 3]` **send_invoice_reminder**: Send a reminder for an existing invoice
*   `[Class 3]` **cancel_sent_invoice**: Cancel a sent invoice
*   `[Class 3]` **generate_invoice_qr_code**: Generate a QR code for an invoice

**Payments**
*   `[Class 3]` **create_order**: Create an order in PayPal system based on provided details
*   `[Class 4]` **get_order**: Retrieve the details of an order
*   `[Class 2]` **pay_order**: Process payment for an authorized order
*   `[Class 2]` **create_refund**: Process a refund for a captured payment
*   `[Class 4]` **get_refund**: Get the details for a specific refund

**Dispute Management**
*   `[Class 4]` **list_disputes**: Retrieve a summary of all open disputes
*   `[Class 4]` **get_dispute**: Retrieve detailed information of a specific dispute
*   `[Class 2]` **accept_dispute_claim**: Accept a dispute claim, which has direct financial consequences

**Shipment Tracking**
*   `[Class 3]` **create_shipment_tracking**: Create a shipment tracking record containing customer PII
*   `[Class 4]` **get_shipment_tracking**: Retrieve shipment tracking information

**Catalog Management**
*   `[Class 4]` **create_product**: Create a new product in the PayPal catalog
*   `[Class 4]` **list_products**: List products with optional pagination and filtering
*   `[Class 4]` **show_product_details**: Retrieve details of a specific product

**Subscription Management**
*   `[Class 4]` **create_subscription_plan**: Create a new subscription plan template
*   `[Class 4]` **list_subscription_plans**: List subscription plans
*   `[Class 4]` **show_subscription_plan_details**: Retrieve details of a specific subscription plan
*   `[Class 1]` **create_subscription**: Create a new subscription, linking a customer to a recurring payment
*   `[Class 3]` **show_subscription_details**: Retrieve details of a specific customer's subscription
*   `[Class 3]` **update_subscription**: Update an existing subscription
*   `[Class 3]` **cancel_subscription**: Cancel an active subscription

**Reporting and Insights**
*   `[Class 4]` **list_transactions**: List transactions with optional pagination and filtering

## TypeScript

### Installation
You don't need this source code unless you want to modify the package. If you just want to use the package run:
```bash
npm install @paypal/agent-toolkit
```

### Requirements
Node 18+

### Usage
The library needs to be configured with your account's client id and secret which is available in your [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/). **For operations involving sensitive data, see the Security Addendum below.**

The toolkit works with Vercel's AI SDK and can be passed as a list of tools. For more details, refer our [examples](./typescript/examples).
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
Replace `YOUR_ACCESS_TOKEN` with an active access token generated using these steps: [Generating an Access Token](#generating-an-access-token). Alternatively, you could set the PAYPAL_ACCESS_TOKEN in your environment variables.

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

**Prerequisites**
*   Claude Desktop application installed
*   installing Node.js locally

**Installation Steps**
1.  **Install Node.js**
    Node.js is required for the PayPal connector to function:
    *   Visit the [Node.js official website](https://nodejs.org/), download and install it.
    *   Requirements: Node 18+
2.  **Configure PayPal Connector with MCP host (Claude desktop / Cursor / Cline)**
    We will show the integration with Claude desktop. You can use your favorite MCP host.
    *   Open Claude Desktop
    *   Navigate to Settings
    *   Find the Developer or Advanced settings section
    *   Locate the external tools or connectors configuration area
    *   Add the following PayPal connector configuration to `~/Claude/claude_desktop_config.json`:
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
    Make sure to replace `YOUR_PAYPAL_ACCESS_TOKEN` with your actual PayPal Access Token. Alternatively, you could set the `PAYPAL_ACCESS_TOKEN` as an environment variable. You can also pass it as an argument using `--access-token` in `"args"`. Set `PAYPAL_ENVIRONMENT` value as either `SANDBOX` for stage testing and `PRODUCTION` for production environment.
    *   Save your configuration changes
3.  **Test the Integration**
    *   Quit and restart Claude Desktop to apply changes
    *   Test the connection by asking Claude to perform a PayPal-related task
    *   Example: "List my PayPal invoices"

### Environment Variables

The following environment variables can be used:
*   **PAYPAL_ACCESS_TOKEN**: Your PayPal Access Token
*   **PAYPAL_ENVIRONMENT**: Set to `SANDBOX` for sandbox mode, `PRODUCTION` for production (defaults to `SANDBOX` mode)

### Finding Your Client ID and Client Secret
This guide explains how to generate an access token for PayPal API integration, including how to find your client ID and client secret.

**Prerequisites**
*   PayPal Developer account (for Sandbox)
*   PayPal Business account (for production)

**Finding Your Client ID and Client Secret**
1.  **Create a PayPal Developer Account**:
    *   Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
    *   Sign up or log in with your PayPal credentials
2.  **Access Your Credentials**:
    *   In the Developer Dashboard, click on **Apps & Credentials** in the menu
    *   Switch between **Sandbox** and **Live** modes depending on your needs
3.  **Create or View an App**:
    *   To create a new app, click **Create App**
    *   Give your app a name and select a Business account to associate with it
    *   For existing apps, click on the app name to view details
4.  **Retrieve Credentials**:
    *   Once your app is created or selected, you'll see a screen with your:
        *   **Client ID**: A public identifier for your app
        *   **Client Secret**: A private key (shown after clicking "Show")
    *   Save these credentials securely as they are required for generating access tokens

### Generating an Access Token
*Using cURL*
```bash
curl -v https://api-m.sandbox.paypal.com/v1/oauth2/token \
  -H "Accept: application/json" \
  -H "Accept-Language: en_US" \
  -u "CLIENT_ID:CLIENT_SECRET" \
  -d "grant_type=client_credentials"
```
Replace `CLIENT_ID` and `CLIENT_SECRET` with your actual credentials. For production, use `https://api-m.paypal.com` instead of the sandbox URL.

*Using Postman*
1.  Create a new request to `https://api-m.sandbox.paypal.com/v1/oauth2/token`
2.  Set method to `POST`
3.  Under **Authorization**, select **Basic Auth** and enter your **Client ID** and **Client Secret**
4.  Under **Body**, select `x-www-form-urlencoded` and add a key `grant_type` with value `client_credentials`
5.  Send the request

**Response**
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

**Token Details**
*   Sandbox Tokens: Valid for 3-8 hours
*   Production Tokens: Valid for 8 hours
*   It's recommended to implement token refresh logic before expiration

**Using the Token with Claude Desktop**
Once you have your access token, update the `PAYPAL_ACCESS_TOKEN` value in your Claude Desktop connector configuration:
```json
{
  "env": {
    "PAYPAL_ACCESS_TOKEN": "YOUR_NEW_ACCESS_TOKEN",
    "PAYPAL_ENVIRONMENT": "SANDBOX"
  }
}
```
**Best Practices**
*   Store client ID and client secret securely
*   Implement token refresh logic to handle token expiration
*   Use environment-specific tokens (sandbox for testing, production for real transactions)
*   Avoid hardcoding tokens in application code

## Disclaimer
AI-generated content may be inaccurate or incomplete. Users are responsible for independently verifying any information before relying on it. PayPal makes no guarantees regarding output accuracy and is not liable for any decisions, actions, or consequences resulting from its use.

---
---

## Addendum: Zero-Trust Architecture

To provide industry-leading security for financial operations, this toolkit implements a **risk-based, dual-flow security model**. Instead of treating all operations equally, we classify them by data sensitivity and route them through the appropriate security flow. This ensures that high-risk actions are protected by a state-of-the-art handshake protocol, while low-risk actions remain simple and efficient.

### The Core Abstraction: `executeSecureTool`

As a developer, you don't need to manually manage which security flow to use. The complexity is handled by a single orchestrator function: `executeSecureTool`. This function acts as a smart router, inspecting the tool's classification and directing the request to the correct backend.

The high-level design of this dual-flow architecture is as follows:
```ascii
┌─────────────────┐                        ┌──────────────────┐
│   AI Assistant  │                        │ Standard MCP 2.1 │
│ (Orchestrator)  │◄─── Session Token ─────┤   Authorization  │
└─────────┬───────┘                        └──────────────────┘
          │
          ├─ Class 4-5 (e.g., list_invoices)
          │                      │
          └──────────────────────► (Standard, Low-Friction Flow)
          │
          ├─ Class 1-3 (e.g., create_refund, create_order)
          │                      │
          └──────────────────────► (Zero-Trust, High-Security Flow)
                                 │
                         ┌──────────────────┐
                         │ Zero-Trust MCP   │
                         │ Extension Service│
                         └──────────────────┘
```
<br>
<details>
<summary><strong>📋 TypeScript: `executeSecureTool` Implementation</strong></summary>

```typescript
import { TOOL_CLASSIFICATIONS } from './tool-classifications';
// Assume standardMCPClient and zeroTrustClient are already initialized

export async function executeSecureTool(
    toolName: string,
    parameters: any,
    standardMCPClient: any,
    zeroTrustClient: PayPalZeroTrustClient
): Promise<any> {
  // 1. Look up the tool's data sensitivity class.
  const dataClass = TOOL_CLASSIFICATIONS[toolName];

  if (!dataClass) {
    throw new Error(`Unknown tool or classification for: ${toolName}`);
  }

  // 2. Route to the appropriate flow.
  if (dataClass <= 3) { // Use the enhanced, two-phase Zero-Trust handshake
    console.log(`[Orchestrator] Using Zero-Trust flow for ${toolName} (Class ${dataClass})`);
    const authDetails = await zeroTrustClient.requestAuth(toolName, parameters);
    return await zeroTrustClient.executeWithAuth(authDetails, toolName, parameters);
  } else { // Use the standard, single-phase MCP 2.1 client
    console.log(`[Orchestrator] Using Standard MCP 2.1 flow for ${toolName} (Class ${dataClass})`);
    return await standardMCPClient.executeTool(toolName, parameters);
  }
}
```
</details>

<details>
<summary><strong>🐍 Python: `execute_secure_tool` Implementation</strong></summary>

```python
from tool_classifications import TOOL_CLASSIFICATIONS
# Assume standard_mcp_client and zero_trust_client are already initialized

async def execute_secure_tool(
    tool_name: str,
    parameters: dict,
    standard_mcp_client,
    zero_trust_client
) -> dict:
    # 1. Look up the tool's data sensitivity class.
    data_class = TOOL_CLASSIFICATIONS.get(tool_name)

    if not data_class:
        raise ValueError(f"Unknown tool or classification for: {tool_name}")

    # 2. Route to the appropriate flow.
    if data_class <= 3:  # Use the enhanced, two-phase Zero-Trust handshake
        print(f"[Orchestrator] Using Zero-Trust flow for {tool_name} (Class {data_class})")
        auth_details = await zero_trust_client.request_auth(tool_name, parameters)
        return await zero_trust_client.execute_with_auth(auth_details, tool_name, parameters)
    else:  # Use the standard, single-phase MCP 2.1 client
        print(f"[Orchestrator] Using Standard MCP 2.1 flow for {tool_name} (Class {data_class})")
        return await standard_mcp_client.execute_tool(tool_name, parameters)
```
</details>

### Tool Classifications

The routing logic is driven by a simple, explicit mapping of tools to their data sensitivity classes. This design choice makes the system's security posture transparent and easily extensible.

<details>
<summary><strong>Classifications File: `tool-classifications.ts`</strong></summary>

```typescript
/**
 * Defines the data classification for each financial API tool.
 * This mapping is the single source of truth for security routing.
 */
export const TOOL_CLASSIFICATIONS: Record<string, number> = {
  // Class 1: PII Operations (Highest Sensitivity)
  "create_subscription": 1,

  // Class 2: Sensitive Financial Transactions
  "pay_order": 2,
  "create_refund": 2,
  "accept_dispute_claim": 2,

  // Class 3: Confidential Business Operations
  "create_invoice": 3,
  "send_invoice": 3,
  "send_invoice_reminder": 3,
  "cancel_sent_invoice": 3,
  "generate_invoice_qr_code": 3,
  "create_order": 3,
  "create_shipment_tracking": 3,
  "show_subscription_details": 3,
  "update_subscription": 3,
  "cancel_subscription": 3,

  // Class 4: Internal Operations (Standard Security)
  "list_invoices": 4,
  "get_invoice": 4,
  "get_order": 4,
  "get_refund": 4,
  "list_disputes": 4,
  "get_dispute": 4,
  "get_shipment_tracking": 4,
  "create_product": 4,
  "list_products": 4,
  "show_product_details": 4,
  "create_subscription_plan": 4,
  "list_subscription_plans": 4,
  "show_subscription_plan_details": 4,
  "list_transactions": 4
};
```
</details>

### The Zero-Trust Handshake (Class 1-3 Operations)

For all sensitive operations, the toolkit enforces a **two-phase handshake protocol** that ensures zero standing privileges. A standard access token is not enough to execute a sensitive transaction.

```ascii
[AI Assistant Client]                           [Zero-Trust MCP Extension Service]
         |                                                        |
         |  1. requestAuth(tool, params) ------------------------>| (A) Validates user session
         |                                                        | (B) Hashes params
         |                                                        | (C) Creates ephemeral token
         |                                                        |
         |  2. ephemeralToken <-----------------------------------|
         |                                                        |
         |  3. execute(tool, params, ephemeralToken) ------------>| (A) Atomically consumes token (Redis)
         |                                                        | (B) Verifies param hash & identity
         |                                                        | (C) Calls Confirmation Agent (if Class 1-2)
         |                                                        | (D) Executes secure PayPal API call
         |                                                        |
         |  4. result <-------------------------------------------|
```
<br>
<details>
<summary><strong>Why This Handshake is Safer</strong></summary>

*   **Zero Standing Privileges:** The `ephemeralToken` is not a general-purpose key. It is a single-use authorization, cryptographically bound to one specific user, for one specific tool, with one specific set of parameters. It is useless for anything else.
*   **Replay Protection:** The token is consumed atomically from a state store (like Redis) on its first use. Any attempt to replay the request with the same token will fail, as the token will no longer exist. It also expires after a very short time (e.g., 30 seconds).
*   **Parameter Integrity:** By hashing the parameters and binding the hash to the token, we guarantee that a man-in-the-middle attacker cannot alter the transaction details (like the amount or recipient) between the authorization and execution phases.
*   **Defense in Depth:** This multi-step verification process ensures that even if one layer were compromised (e.g., a session token was stolen), the attacker still could not execute a sensitive transaction without passing the subsequent, transaction-specific checks.
</details>

<details>
<summary><strong>How it Works: Implementation & Schema Details</strong></summary>

The core of this architecture is the introduction of the `executeSecureTool` function, which acts as a smart router, and the `tool-classifications.ts` file, which provides the routing logic. This is complemented by the new server-side **Zero-Trust MCP Extension Service** that `executeSecureTool` calls for sensitive operations. The OpenAPI schema below defines the control plane for managing these integrations.

**MCP Handshake (`v1`)**
```json
{
  "schema": "MCP.Handshake.v1",
  "transaction": {
    "id": "uuid-for-this-specific-request",
    "timestamp": "ISO-8601-timestamp",
    "user": { "id": "authenticated-user-id", "roles": ["role1", "role2"] }
  },
  "tool": {
    "name": "target-operation-name", "version": "1.0.0",
    "sensitivity": "CONFIDENTIAL", "parameters_hash": "sha256-of-parameters-object",
    "target_api": { "name": "enterprise-api-identifier", "operation": "specific-api-operation" }
  },
  "authentication": {
    "session_token": "jwt-or-other-identity-token", "ephemeral_token": "single-use-transaction-bound-token",
    "expiry": "ISO-8601-timestamp-short-lifespan",
    "token_state": { "consumed": false, "consumption_timestamp": null }
  },
  "validation": {
    "status": "APPROVED", "timestamp": "ISO-8601-timestamp",
    "checks_performed": ["parameter_validation", "pattern_validation", "code_analysis"],
    "tier_level": "CONFIDENTIAL", "reason": "Optional explanation if DENIED"
  },
  "audit": {
    "request_ip": "client-ip-address", "client_id": "application-identifier",
    "integration_id": "specific-integration-identifier",
    "receipt": { "transaction_proof": "cryptographic-signature-of-transaction-details", "timestamp": "ISO-8601-timestamp" }
  },
  "error_handling": {
    "status_code": null, "error_type": null, "message": null, "retry_allowed": true
  }
}
```
</details>
