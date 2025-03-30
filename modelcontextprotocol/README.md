# PayPal Model Context Protocol

The PayPal [Model Context Protocol](https://modelcontextprotocol.com/) server allows you to integrate with PayPal APIs through function calling. This protocol supports various tools to interact with different PayPal services.

## Setup

To run the PayPal MCP server using npx, use the following command:

```bash
# To set up all available tools
cd /to/path/paypal-agent-toolkit/typescript && npm run build
cd /to/path/PycharmProjects/paypal-agent-toolkit/modelcontextprotocol && npm run build

# To configure with access token
cd /to/path/PycharmProjects/paypal-agent-toolkit && PAYPAL_ACCESS_TOKEN=your-access-token PAYPAL_SANDBOX=true node --trace-warnings modelcontextprotocol/dist/index.js --tools=all
 
```

Make sure to replace `YOUR_PAYPAL_ACCESS_TOKEN` with your actual PayPal Access Token. Alternatively, you could set the PAYPAL_ACCESS_TOKEN as an environment variable. You can also pass it as an argument using --access-token

### Usage with Claude Desktop

Add the following to your `/to/path/Library/Application Support/Claude/claude_desktop_config.json`. See [here](https://modelcontextprotocol.io/quickstart/user) for more details.

```
{
  "mcpServers": {
    "paypal": {
      "command": "node",
      "args": [
          "/to/path/modelcontextprotocol/dist/index.js",
          "--tools=all"
      ],
      "env": {
        "PAYPAL_ACCESS_TOKEN": "YOUR_PAYPAL_ACCESS_TOKEN",
        "PAYPAL_SANDBOX": "true"
      }
    }
  }
}
```

## Available tools

| Tool                       | Description                       |
| -------------------------- | --------------------------------- |
| `invoices.create`          | Create a new invoice              |
| `invoices.list`            | List invoices                     |
| `invoices.send`            | Send an invoice to recipients     |
| `invoices.sendReminder`    | Send a reminder for an invoice    |
| `invoices.cancel`          | Cancel a sent invoice             |

## Debugging the Server

To debug your server, you can use the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector).

First, build the server:

```
npm run build
```

Run the following command in your terminal:

```bash
# Start MCP Inspector and server with all tools
npx @modelcontextprotocol/inspector node dist/index.js --tools=all --client-id=YOUR_CLIENT_ID --client-secret=YOUR_CLIENT_SECRET --sandbox=true
```

### Instructions

1. Replace `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET` with your actual PayPal API credentials.
2. Run the command to start the MCP Inspector.
3. Open the MCP Inspector UI in your browser and click Connect to start the MCP server.
4. You can see the list of tools you selected and test each tool individually.

## Building from Source

To build the PayPal MCP server from source:

1. Build the TypeScript implementation:

```bash
cd /to/path/PycharmProjects/paypal-agent-toolkit/typescript
npm install
npm run build
```

2. Build the MCP server:

```bash
cd /to/path/PycharmProjects/paypal-agent-toolkit/modelcontextprotocol
npm install
npm run build
```

## Environment Variables

The following environment variables can be used:

- `PAYPAL_CLIENT_ID`: Your PayPal Client ID
- `PAYPAL_CLIENT_SECRET`: Your PayPal Client Secret
- `PAYPAL_SANDBOX`: Set to "true" for sandbox mode, "false" for production (defaults to "true")
