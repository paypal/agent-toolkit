import {TypeOf, z} from "zod";
import {createOrderParameters, updateSubscriptionParameters} from "./parameters";
import { round } from "mathjs";
import { snakeCase, camelCase } from "lodash";
import {subscriptionKeys, updateSubscriptionPathMapping} from "./constants";
import debug from "debug";

const logger = debug('agent-toolkit:payloadUtils');

export function parseOrderDetails(params: TypeOf<ReturnType<typeof createOrderParameters>>) {
    try {
        const currCode = params.currencyCode;
        let items: any[] = [];
        const subTotal = params.items.reduce((sum, item) => sum + item.itemCost * item.quantity, 0);
        const shippingCost = params.shippingCost || 0;
        const taxAmount = params.items.reduce((sum, item) => sum + item.itemCost * item.taxPercent * item.quantity / 100, 0)
        const discount = params.discount || 0;
        const total = subTotal + taxAmount + shippingCost - discount;
        const amountBreakdown = {
            item_total: {
                value: round(subTotal, 2).toString(),
                currency_code: currCode
            },
            shipping: {
                value: round(shippingCost, 2).toString(),
                currency_code: currCode
            },
            tax_total: {
                value: round(taxAmount, 2).toString(),
                currency_code: currCode
            },
            discount: {
                value: round(discount, 2).toString(),
                currency_code: currCode
            },
        }
        params.items.forEach(item => {
            items.push({
                name: item.name,
                description: item.description,
                unit_amount: {
                    value: item.itemCost.toString() || '0',
                    currency_code: currCode
                },
                quantity: item.quantity.toString() || '1',
                tax: {
                    value: round((item.itemCost * item.taxPercent) / 100, 2).toString() || '0',
                    currency_code: currCode
                }
            })
        })
        const basePurchaseUnit = {
            amount: {
                value: round(total, 2).toString(),
                currency_code: currCode,
                breakdown: amountBreakdown
            },
            items: items,
        }
        // Conditionally add shipping address if available
        const purchaseUnit = params.shippingAddress
            ? { ...basePurchaseUnit, shipping: { address: params.shippingAddress } }
            : basePurchaseUnit;
        const request = {
            intent: 'CAPTURE',
            purchase_units: [purchaseUnit],
        }
        if (params.returnUrl || params.cancelUrl) {
            // @ts-expect-error
            request.payment_source = {
                paypal: {
                    experience_context: {
                        return_url: params.returnUrl,
                        cancel_url: params.cancelUrl
                    }
                }
            }
        }
        return request;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to parse order details');
    }
}

type opType = {
    op: string,
    path: string,
    value?: any
}

const subscriptionKeysWithAddOperations = [subscriptionKeys.customId, subscriptionKeys.taxesInclusive, subscriptionKeys.taxesPercentage, subscriptionKeys.shippingAmount, subscriptionKeys.shippingAddress]
// These keys have an "add" possible operation in the update subscription payload

export const parseUpdateSubscriptionPayload = (params: TypeOf<ReturnType<typeof updateSubscriptionParameters>>, subscriptionDetails: any) => {

    const currCode = params.currency_code || "USD";
    const operations = [];

    for(let key in params){
        if(key === subscriptionKeys.subscriptionId || key === subscriptionKeys.currencyCode) continue;
        const path = updateSubscriptionPathMapping[key];
        if(!path) {
            throw new Error(`Unsupported field for update: ${key}`);
        }

        let op = "replace";

        if(subscriptionKeysWithAddOperations.includes(key as subscriptionKeys)){
            const pathArray = path.split("/");
            pathArray.shift()
            const doesValueExist = pathArray.reduce((obj, key) => obj?.[key], subscriptionDetails);
            if(doesValueExist === undefined) op = "add";
        }

        let opItem: opType = { op, path}
        let opValue = params[key as keyof typeof params];

        // Custom logic for fixed price to handle sequence replacement in path
        if(key === subscriptionKeys.fixedPrice){
            opItem.path = path.replace("{0}", opValue?.sequence || 1)
            delete opValue?.sequence
            opValue = opValue?.value;
        }

        // Creating the value structure expected in the payload
        if([subscriptionKeys.outstandingBalance, subscriptionKeys.shippingAmount, subscriptionKeys.fixedPrice].includes(key as subscriptionKeys)){
            opItem.value = {
                currency_code: currCode,
                value: opValue
            }
        } else{
            opItem.value = opValue
        }
        operations.push(opItem);
    }

    logger("Update Subscription Operations", JSON.stringify(operations));
    return operations;
}

export const toSnakeCaseKeys = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(toSnakeCaseKeys);
    } else if (typeof obj === "object" && obj !== null) {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [snakeCase(key), toSnakeCaseKeys(value)])
        );
    }
    return obj;
};

export const toCamelCaseKeys = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(toCamelCaseKeys);
    } else if (typeof obj === 'object' && obj !== null) {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [camelCase(key), toCamelCaseKeys(value)])
        );
    }
    return obj;
};

export function toQueryString(params: TypeOf<ReturnType<typeof listDisputesParameters>>): string {
    return Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
  }