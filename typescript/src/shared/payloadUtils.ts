// Generate a dynamic PATCH request
import {
    ApiResponse,
    CheckoutPaymentIntent,
    OrderRequest,
} from "@paypal/paypal-server-sdk";
import {TypeOf} from "zod";
import {createOrderParameters} from "./parameters";
import {round} from "mathjs";

export function parseOrderDetails(params: TypeOf<typeof createOrderParameters>) {
    try {
        const currCode = params.currencyCode;
        let items: any[] = [];
        const subTotal = params.items.reduce((sum, item) => sum + item.itemCost * item.quantity, 0);
        const taxAmount = params.items.reduce((sum, item) => sum + item.itemCost * item.taxPercent * item.quantity / 100, 0)
        const total = subTotal + taxAmount;
        params.items.forEach(item => {
            items.push({
                name: item.name,
                description: item.description,
                unitAmount: {
                    value: item.itemCost.toString() || '0',
                    currencyCode: currCode
                },
                quantity: item.quantity.toString() || '1',
                tax: {
                    value: round((item.itemCost * item.taxPercent) / 100, 2).toString() || '0',
                    currencyCode: currCode
                }
            })
        })
        const request: OrderRequest = {
            intent: CheckoutPaymentIntent.Capture,
            purchaseUnits: [{
                amount: {
                    value: round(total, 2).toString(),
                    currencyCode: currCode,
                    breakdown: {
                        itemTotal: {
                            value: round(subTotal, 2).toString(),
                            currencyCode: currCode
                        },
                        taxTotal: {
                            value: round(taxAmount, 2).toString(),
                            currencyCode: currCode
                        }
                    }
                },
                items: items
            }],
            paymentSource: {
                paypal: {
                    experienceContext: {
                        returnUrl: params.returnUrl,
                        cancelUrl: params.cancelUrl
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

export type PayPalResponse<T> =
    | { status: "success"; data: T }         // Generic success response
    | { status: "clientError"; error: string }   // Client error as string - needs request updates
    | { status: "systemError"; error: string }; // System error as string - retryable
export function getResponseFromStatus<T>(response: ApiResponse<T>): PayPalResponse<T> {
    const statusCode = response.statusCode;
    if (statusCode >= 200 && statusCode < 300) return {status: "success", data: response.result};
    if (statusCode >= 400 && statusCode < 500) return {status: "clientError", error: response.body.toString()};
    return {status: "systemError", error: response.body.toString()};
}

// Calculate new amount details based on items
function calculateNewAmount(items: any[], existingAmount: any) {
    let itemTotal = 0;
    let taxTotal = 0;

    for (const item of items) {
        const itemPrice = parseFloat(item.unitAmount?.value || "0") * parseInt(item.quantity || "1");
        itemTotal += itemPrice;
        taxTotal += parseFloat(item.tax?.value || "0") * parseInt(item.quantity || "1");
    }

    return {
        currencyCode: existingAmount?.currencyCode || "USD",
        value: (itemTotal + taxTotal).toFixed(2),
        breakdown: {
            itemTotal: {currencyCode: "USD", value: itemTotal.toFixed(2)},
            taxTotal: {currencyCode: "USD", value: taxTotal.toFixed(2)}
        },
    };
}
