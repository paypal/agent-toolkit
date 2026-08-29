# PayPal MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with secure access to PayPal's payment processing, transaction management, and compliance services.

## Features

- **Secure Authentication**: OAuth Bearer token authentication
- **SSE Transport**: Server-Sent Events for real-time communication
- **Enterprise Ready**: Built for PayPal's internal development environment
- **Payment Processing**: Tools for payment transactions and management
- **Transaction Queries**: Access to transaction history and status
- **Compliance Services**: PayPal compliance and regulatory tools

## Connection Details

- **Server URL**: `https://mcp.paypal.com/mcp`
- **SSE Endpoint**: `https://mcp.paypal.com/sse`
- **Transport**: Server-Sent Events (SSE)
- **Authentication**: Bearer token in Authorization header

## Setup

1. Obtain PayPal OAuth credentials from your PayPal developer account
2. Configure Bearer token authentication
3. Connect to the SSE endpoint using your MCP client
4. Ensure SSL certificate validation for PayPal's internal PKI

## Usage with MCP Clients

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "paypal": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-everything"],
      "env": {
        "MCP_SERVER_URL": "https://mcp.paypal.com/sse",
        "MCP_AUTH_TOKEN": "your-paypal-oauth-token"
      }
    }
  }
}
```

### FastAgent Configuration

```yaml
mcp:
  servers:
    paypal_mcp:
      transport: sse
      url: https://mcp.paypal.com/sse
      headers:
        Authorization: Bearer YOUR_PAYPAL_TOKEN
```

## Security

- All connections require valid PayPal OAuth tokens
- SSL/TLS encryption for all communications
- Certificate validation against PayPal's PKI
- Enterprise-grade security standards

## Publishing to MCP Registry

This server configuration is ready for publishing to the Model Context Protocol registry. The automated workflow will handle:

1. JSON schema validation
2. GitHub OIDC authentication
3. Registry publication
4. Verification

## Support

For support and documentation:
- PayPal Developer Portal: https://developer.paypal.com/
- MCP Documentation: https://modelcontextprotocol.io/

## License

MIT License - see LICENSE file for details.