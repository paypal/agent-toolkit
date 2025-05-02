import { generateObject, generateText, LanguageModelV1 } from 'ai';

import { z } from "zod";
import { PayPalAgentToolkit } from "./";
import { createOrderParameters } from '../shared/parameters';
import { Configuration } from '../shared/configuration';

class PayPalWorkflows {
    readonly toolkit: PayPalAgentToolkit;
    log?: (message: any) => void;

    constructor({ clientId, clientSecret, configuration, log }: {
        clientId: string,
        clientSecret: string,
        configuration: Configuration,
        log?: (message: any) => void
    }) {
        this.log = log || console.log
        this.toolkit = new PayPalAgentToolkit({
            clientId,
            clientSecret,
            configuration,
        });
    }

    public async generateOrder(llm: LanguageModelV1, userPrompt: string, systemPrompt: string): Promise<string> {
        // Step 1: Generate the order details for the transaction
        this.log!('Step 1: I am using the provided prompts to create a request object for PayPal.');
        const { object: orderObject } = await generateObject<z.infer<ReturnType<typeof createOrderParameters>>>({
            model: llm,
            schema: createOrderParameters({}),
            system: systemPrompt,
            prompt: userPrompt,
        });
        this.log!(`Response 1: I have now created the request object with provided details;\n ${JSON.stringify(orderObject)}`);
        this.log!(`Proceeding with next step.`)
        this.log!(`Step 2: I am now choosing the correct tool from PayPal's toolkit to create an an order using the generated object from previous step.`);
        const { text: orderId } = await generateText({
            model: llm,
            tools: this.toolkit.getTools(),
            maxSteps: 10,
            prompt: `Create an order using the following details: ${JSON.stringify(orderObject, null, 2)}`,
        });
        this.log!(`Response 2: I have created the order in PayPal's system with order ID: ${orderId}.`);
        this.log!(`Proceeding with next step.`)
        // Step 3: Retrieve the order details from PayPal
        this.log!(`Step 3: I am now choosing the correct tool from PayPal's toolkit to retrieve the order details with the order ID from previous step.`);
        const { text: orderDetails } = await generateText({
            model: llm,
            tools: this.toolkit.getTools(),
            maxSteps: 10,
            system: 'You are processing an order using PayPal APIs. Use the order ID to retrieve the order details.',
            prompt: `Retrieve the details of the order with ID: ${orderId}.`,
        });
        this.log!(`Response 3: Here is the order details with ID: ${orderId}; ${JSON.stringify(orderDetails, null, 2)}`);
        this.log!(`Proceeding with next step.`)
        // Step 4: Generate the summary for the order
        this.log!('Step 4: I am now generating the summary of the order using the order details retrieved in the previous step. This makes it easier to read the important information.');
        const { text: summary } = await generateText({
            model: llm,
            maxSteps: 10,
            system: 'You are tasked with generating a summary text for the order. Use the provided order details. For each item in order, update item level tax to be the tax amount*quantity of the item. Show the payment approval link only at the end of the page for the customer and hide all other links related to the order.',
            prompt: `
                Generate a summary for the following order details: ${orderDetails}.
            `,
        });
        this.log!(`Response 4: \n${summary}`);
        return summary;
    }

    public async getDisputeDetails(llm: LanguageModelV1, userPrompt: string): Promise<string> {
        // Step 1: Retrieve the dispute details for the transaction
        this.log!(`Step 1. I am now retrieving the details from PayPal.`);
        const { text: disputeDetail } = await generateText({
            model: llm,
            tools: this.toolkit.getTools(),
            maxSteps: 10,
            system: 'You are a tool to retrieve the dispute details based on the dispute ID.',
            prompt: userPrompt,
        });
        this.log!('Step 2. I am now generating the summary of the dispute using the dispute details retrieved in the previous step. This makes it easier to read the important information.');
        // Generate the summary for the dispute details
        const { text: summary } = await generateText({
            model: llm,
            tools: this.toolkit.getTools(),
            system: 'You are tasked with generating an summary text for the dispute. Use the provided dispute details. Show the appropriate links only at the end of the page.',
            prompt: `
                Generate a summary for the following dispute details: ${disputeDetail}.
            `,
        });
        this.log!(`Output: ${summary}`);
        return summary;
    }
}

export default PayPalWorkflows;
