import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import { Configuration, isToolAllowed } from '../shared/configuration';
import PayPalAPI from '../shared/api';
import tools from '../shared/tools';
import { version } from '../../package.json';


const SOURCE = 'MCP';

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
      version: version,
    });

    this._paypal = new PayPalAPI(accessToken, { ...configuration.context, source: SOURCE });

    const context = configuration.context || {};
    const filteredTools = tools(context).filter((tool) =>
      isToolAllowed(tool, configuration)
    );

    filteredTools.forEach((tool) => {
      const regTool = this.tool(
        tool.method,
        tool.description,
        tool.parameters.shape,
        async (arg: any, _extra: RequestHandlerExtra<any, any>) => {
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
