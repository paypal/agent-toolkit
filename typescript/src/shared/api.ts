import {
  createInvoice,
  listInvoices,
  getInvoice,
  sendInvoice,
  sendInvoiceReminder,
  cancelSentInvoice,
  createProduct,
  listProducts,
  createSubscriptionPlan,
  listSubscriptionPlans,
  createShipment,
  getShipmentTracking,
  generateInvoiceQrCode,
  createOrder,
  getOrder,
  listDisputes,
  getDispute,
  acceptDisputeClaim,
  captureOrder, listTransactions,
  createSubscription,
  showProductDetails,
  showSubscriptionPlanDetails,
  showSubscriptionDetails,
  cancelSubscription,
  createRefund,
  getRefund
} from './functions';

import type { Context } from './configuration';
import PayPalClient from './client';

class PayPalAPI {
  paypalClient: PayPalClient;
  context: Context;
  baseUrl: string;
  accessToken?: string;

  constructor(paypalClientOrAccessToken: PayPalClient | string, context?: Context) {
    this.context = context || {};

    // Set default sandbox mode if not provided
    this.context.sandbox = this.context.sandbox ?? false;
    this.baseUrl = this.context.sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

    if (typeof paypalClientOrAccessToken === 'string') {
      this.accessToken = paypalClientOrAccessToken;
      this.paypalClient = new PayPalClient({context: this.context, accessToken: this.accessToken });
    } else {
      this.paypalClient = paypalClientOrAccessToken;
    }

    

  }


  async run(method: string, arg: any): Promise<string> {
    try {
      const output = await this.executeMethod(method, arg);
      return JSON.stringify(output);
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      return JSON.stringify({
        error: {
          message: errorMessage,
          type: 'paypal_error',
        },
      });
    }
  }

  private async executeMethod(method: string, arg: any): Promise<any> {
    switch (method) {
      case 'create_invoice':
        return createInvoice(this.paypalClient, this.context, arg);
      case 'list_invoices':
        return listInvoices(this.paypalClient, this.context, arg);
      case 'get_invoice':
        return getInvoice(this.paypalClient, this.context, arg);
      case 'send_invoice':
        return sendInvoice(this.paypalClient, this.context, arg);
      case 'send_invoice_reminder':
        return sendInvoiceReminder(this.paypalClient, this.context, arg);
      case 'cancel_sent_invoice':
        return cancelSentInvoice(this.paypalClient, this.context, arg);
      case 'generate_invoice_qr_code':
        return generateInvoiceQrCode(this.paypalClient, this.context, arg);
      case 'create_product':
        return createProduct(this.paypalClient, this.context, arg);
      case 'list_products':
        return listProducts(this.paypalClient, this.context, arg);
      case 'show_product_details':
        return showProductDetails(this.paypalClient, this.context, arg);
      case 'create_subscription_plan':
        return createSubscriptionPlan(this.paypalClient, this.context, arg);
      case 'list_subscription_plans':
        return listSubscriptionPlans(this.paypalClient, this.context, arg);
      case 'show_subscription_plan_details':
        return showSubscriptionPlanDetails(this.paypalClient, this.context, arg);
      case 'create_subscription':
        return createSubscription(this.paypalClient, this.context, arg);
      case 'show_subscription_details':
        return showSubscriptionDetails(this.paypalClient, this.context, arg);
      case 'cancel_subscription':
        return cancelSubscription(this.paypalClient, this.context, arg);
      case 'create_shipment_tracking':
        return createShipment(this.paypalClient, this.context, arg);
      case 'get_shipment_tracking':
        return getShipmentTracking(this.paypalClient, this.context, arg);
      case 'create_order':
        return createOrder(this.paypalClient, this.context, arg);
      case 'get_order':
        return getOrder(this.paypalClient, this.context, arg);
      case 'pay_order':
        return captureOrder(this.paypalClient, this.context, arg);
      case 'list_disputes':
        return listDisputes(this.paypalClient, this.context, arg);
      case 'get_dispute':
        return getDispute(this.paypalClient, this.context, arg);
      case 'accept_dispute_claim':
        return acceptDisputeClaim(this.paypalClient, this.context, arg);
      case 'list_transactions':
        return listTransactions(this.paypalClient, this.context, arg);
      case 'create_refund':
        return createRefund(this.paypalClient, this.context, arg);
      case 'get_refund':
        return getRefund(this.paypalClient, this.context, arg);
      default:
        throw new Error(`Invalid method: ${method}`);
    }
  }
}

export default PayPalAPI;
