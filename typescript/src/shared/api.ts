import {
  createInvoice,
  listInvoices,
  getInvoice,
  sendInvoice,
  sendInvoiceReminder,
  cancelSentInvoice,
  createProduct,
  listProducts,
  updateProduct,
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
  captureOrder, listTransactions
} from './functions';

import type { Context } from './configuration';
import PayPalClient from './client';

class PayPalAPI {
  paypalClient?: PayPalClient;
  context: Context;
  baseUrl: string;
  accessToken?: string;

  constructor(paypalClientOrAccessToken: PayPalClient | string, context?: Context) {
    if (typeof paypalClientOrAccessToken === 'string') {
      this.accessToken = paypalClientOrAccessToken;
    } else {
      this.paypalClient = paypalClientOrAccessToken;
    }

    this.context = context || {};

    // Set default sandbox mode if not provided
    this.context.sandbox = this.context.sandbox ?? true; // Default to sandbox for safety
    this.baseUrl = this.context.sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  }


  // Helper method to get base URL
  getBaseUrl(): string {
    return this.baseUrl;
  }

  // Helper method to get headers
  async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    this.accessToken = this.accessToken || (await this.paypalClient?.getAccessToken());
    headers['Authorization'] = `Bearer ${this.accessToken}`;

    // Add additional headers if needed
    if (this.context.request_id) {
      headers['PayPal-Request-Id'] = this.context.request_id;
    }

    if (this.context.tenant_context) {
      headers['PayPal-Tenant-Context'] = JSON.stringify(this.context.tenant_context);
    }
    return headers;
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
        return createInvoice(this, this.context, arg);
      case 'list_invoices':
        return listInvoices(this, this.context, arg);
      case 'get_invoice':
        return getInvoice(this, this.context, arg);
      case 'send_invoice':
        return sendInvoice(this, this.context, arg);
      case 'send_invoice_reminder':
        return sendInvoiceReminder(this, this.context, arg);
      case 'cancel_sent_invoice':
        return cancelSentInvoice(this, this.context, arg);
      case 'generate_invoice_qr':
        return generateInvoiceQrCode(this, this.context, arg);
      case 'create_product':
        return createProduct(this, this.context, arg);
      case 'list_products':
        return listProducts(this, this.context, arg);
      case 'update_product':
        return updateProduct(this, this.context, arg);
      case 'create_subscription_plan':
        return createSubscriptionPlan(this, this.context, arg);
      case 'list_subscription_plans':
        return listSubscriptionPlans(this, this.context, arg);
      case 'create_shipment':
        return createShipment(this, this.context, arg);
      case 'get_shipment_tracking':
        return getShipmentTracking(this, this.context, arg);
      case 'create_order':
        return createOrder(this, this.context, arg);
      case 'get_order':
        return getOrder(this, this.context, arg);
      case 'capture_order':
        return captureOrder(this, this.context, arg);
      case 'list_disputes':
        return listDisputes(this, this.context, arg);
      case 'get_dispute':
        return getDispute(this, this.context, arg);
      case 'accept_dispute_claim':
        return acceptDisputeClaim(this, this.context, arg);
      case 'list_transactions':
        return listTransactions(this, this.context, arg);
      default:
        throw new Error(`Invalid method: ${method}`);
    }
  }
}

export default PayPalAPI;
