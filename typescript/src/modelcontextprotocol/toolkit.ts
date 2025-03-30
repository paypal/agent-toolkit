import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import { Configuration, isToolAllowed } from '../shared/configuration';
import PayPalAPI from '../shared/api';
import tools from '../shared/tools';

class PayPalAgentToolkit extends McpServer {
  private _paypal: PayPalAPI;

  constructor({
    accessToken,
    configuration,
  }: {
    accessToken: string;
    configuration: Configuration;
  }) {
    super({
      name: 'PayPal',
      version: '0.4.0',
    });

    this._paypal = new PayPalAPI(accessToken, configuration.context);

    const context = configuration.context || {};
    const filteredTools = tools(context).filter((tool) =>
      isToolAllowed(tool, configuration)
    );

    filteredTools.forEach((tool) => {
      this.tool(
        tool.method,
        tool.description,
        tool.parameters.shape,
        async (arg: any, _extra: RequestHandlerExtra) => {
          const result = await this._paypal.run(tool.method, arg);
          return {
            content: [
              {
                type: 'text' as const,
                text: String(result),
              },
            ],
          };
        }
      );
    });
  }
}

export default PayPalAgentToolkit;
