import PayPalClient from "../shared/client";
import { Tool } from "ai";
import {
    createOrderParameters,
    getOrderParameters,
} from "../shared/parameters";
import { createOrder, getOrder } from "../shared/functions";

class PayPalAgentToolkit {
    // @ts-ignore
    readonly client: PayPalClient;

    constructor({ clientId, clientSecret, environment, logRequestDetails, logResponseDetails, debug }: {
        clientId: string,
        clientSecret: string,
        environment?: string,
        logRequestDetails?: string,
        logResponseDetails?: string,
        debug?: string
    }) {
        this.client = new PayPalClient({ clientId, clientSecret, environment, logRequestDetails, logResponseDetails, debug });
    }


    createAnOrder = (): Tool => {
        return {
            description: `This tool is used to invoke the Create Order call in PayPal. This is typically the first step in integrating a PayPal payment flow. It creates a payment order, which is essentially a resource that represents the intent to purchase something, including details like the amount, currency, and other details specific to the order. If the merchant has provided it, also include the return url and cancel url for the post transaction steps. `,
            parameters: createOrderParameters,
            execute: async (params): Promise<string> => {
                return await createOrder(this.client, params)
                    .then(response => {
                        if (response.status == "success") {
                            return response.data.id || '';
                        } else {
                            return response.error;
                        }
                    });
            },
        };
    };

    getOrderDetails = (): Tool => {
        return{
            description: `This tool is used to retrieve the order details for a PayPal payment order. This can only be invoked if the order has been created and an order ID is available. This tool uses the order ID specified as part of prompt to retrieve the order's current status, review transaction details, and access other metadata associated with the order.`,
            parameters: getOrderParameters,
            execute: (params) => {
                return getOrder(this.client, params)
            },
        };
    }

    getTools = async () => {
        return {
            createOrder: this.createAnOrder(),
            getOrder: this.getOrderDetails()
        };
    }

}

export default PayPalAgentToolkit;
