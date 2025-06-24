/**
 * PayPal Agent LangChain Toolkit in TypeScript
 */

import {BaseToolkit} from "@langchain/core/tools";
import PayPalAPI from "../shared/api";
import PayPalClient from "../shared/client";
import { Configuration, isToolAllowed } from "../shared/configuration";
import tools from "../shared/tools";
import PayPalTool from "./tool";

const SOURCE = "LANGCHAIN";

class PayPalLangChainToolkit implements BaseToolkit {
    readonly client: PayPalClient;
    private _paypal: PayPalAPI;
    tools: PayPalTool[];

    constructor({ clientId, clientSecret, configuration, }: {
        clientId: string,
        clientSecret: string,
        configuration: Configuration;
    }) {
        const context = configuration.context || {};
        this.client = new PayPalClient({ clientId: clientId, clientSecret: clientSecret, context: { ...context, source: SOURCE }});
        const filteredTools = tools(context).filter((tool) =>
            isToolAllowed(tool, configuration)
        ); 
        this._paypal = new PayPalAPI(this.client, configuration.context);
        this.tools = filteredTools.map(
            (tool) =>
                new PayPalTool(
                    this._paypal, 
                    tool.method,
                    tool.name,
                    tool.description,
                    tool.parameters,
                )
        );
    }

    getTools(): PayPalTool[] {
        return this.tools;
    }
}

export default PayPalLangChainToolkit;