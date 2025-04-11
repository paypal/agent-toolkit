import { TypeOf } from "zod";
import { createOrderParameters } from "./parameters";
import { round } from "mathjs";
import { snakeCase, camelCase } from "lodash";

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