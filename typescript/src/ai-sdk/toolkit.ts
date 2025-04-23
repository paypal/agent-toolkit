import { Tool } from "ai";
import PayPalAPI from "../shared/api";
import PayPalClient from "../shared/client";
import { Configuration, isToolAllowed } from "../shared/configuration";
import tools from '../shared/tools';
import PayPalTool from './tools';


const SOURCE = 'AI-SDK';

class PayPalAgentToolkit {
    readonly client: PayPalClient;
    private _paypal: PayPalAPI;
    private _tools: { [key: string]: Tool };

    constructor({ clientId, clientSecret, configuration }: {
        clientId: string,
        clientSecret: string,
        configuration: Configuration,
    }) {
        const context = configuration.context || {};
        this.client = new PayPalClient({ clientId: clientId, clientSecret: clientSecret, context: { ...context, source: SOURCE } });
        const filteredTools = tools(context).filter((tool) =>
            isToolAllowed(tool, configuration)
        );
        this._paypal = new PayPalAPI(this.client, configuration.context);
        this._tools = filteredTools.reduce((acc, item) => {
            acc[item.method] = PayPalTool(this._paypal, item.method, item.description, item.parameters);
            return acc;
        }, {} as { [key: string]: Tool });
    }

    getTools(): { [key: string]: Tool } {
        return this._tools;
    }

}

export default PayPalAgentToolkit;
