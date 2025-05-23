

import { Configuration, isToolAllowed } from '../shared/configuration';
import PayPalAPI from '../shared/api';
import tools,  {Tool} from '../shared/tools';

const SOURCE = 'Remote MCP';

class PayPalMCPToolkit {
  private _paypal: PayPalAPI;
  private readonly filteredTools: Tool[] = [];

  constructor({
    accessToken,
    configuration,
  }: {
    accessToken: string;
    configuration: Configuration;
  }) {
 
    this._paypal = new PayPalAPI(accessToken, { ...configuration.context, source: SOURCE });
    const context = configuration.context || {};
    this.filteredTools = tools(context).filter((tool) =>
      isToolAllowed(tool, configuration)
    );
  }

  public getTools(): Tool[] {
    return this.filteredTools;
  }

  public getPaypalAPIService(): PayPalAPI {
    return this._paypal;
  }
}

export default PayPalMCPToolkit;

