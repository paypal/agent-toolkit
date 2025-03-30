import axios from 'axios';
import {
  createInvoice,
  listInvoices,
  sendInvoice,
  sendInvoiceReminder,
  cancelSentInvoice,
  createProduct,
  listProducts,
  updateProduct,
  createSubscriptionPlan,
  listSubscriptionPlans,
} from './functions';

import type { Context } from './configuration';

class PayPalAPI {
  accessToken: string;
  context: Context;
  tokenExpiry?: Date;

  constructor(accessToken: string, context?: Context) {
    this.accessToken = accessToken;
    this.context = context || {};
    
    // Set default sandbox mode if not provided
    if (this.context.sandbox === undefined) {
      this.context.sandbox = true; // Default to sandbox for safety
    }
  }

  // Helper method to get base URL
  getBaseUrl(): string {
    return this.context.sandbox
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  }

  // Helper method to get headers
  async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    headers['Authorization'] = `Bearer ${this.accessToken}`;

    // Add additional headers if needed
    if (this.context.request_id) {
      headers['PayPal-Request-Id'] = this.context.request_id as string;
    }

    if (this.context.tenant_context) {
      headers['PayPal-Tenant-Context'] = JSON.stringify(this.context.tenant_context);
    }
    return headers;
  }

  async run(method: string, arg: any) {
    try {
      let output;
      
      if (method === 'create_invoice') {
        output = JSON.stringify(
          await createInvoice(this, this.context, arg)
        );
      } else if (method === 'list_invoices') {
        output = JSON.stringify(
          await listInvoices(this, this.context, arg)
        );
      } else if (method === 'send_invoice') {
        output = JSON.stringify(
          await sendInvoice(this, this.context, arg)
        );
      } else if (method === 'send_invoice_reminder') {
        output = JSON.stringify(
          await sendInvoiceReminder(this, this.context, arg)
        );
      } else if (method === 'cancel_sent_invoice') {
        output = JSON.stringify(
          await cancelSentInvoice(this, this.context, arg)
        );
      } else if (method === 'create_product') {
        output = JSON.stringify(
          await createProduct(this, this.context, arg)
        );
      } else if (method === 'list_products') {
        output = JSON.stringify(
          await listProducts(this, this.context, arg)
        );
      } else if (method === 'update_product') {
        output = JSON.stringify(
          await updateProduct(this, this.context, arg)
        );
      } else if (method === 'create_subscription_plan') {
        output = JSON.stringify(
          await createSubscriptionPlan(this, this.context, arg)
        );
      } else if (method === 'list_subscription_plans') {
        output = JSON.stringify(
          await listSubscriptionPlans(this, this.context, arg)
        );
      } else {
        throw new Error('Invalid method ' + method);
      }
      
      return output;
    } catch (error: any) {
      // Format error message
      const errorMessage = error.message || 'Unknown error';
      return JSON.stringify({
        error: {
          message: errorMessage,
          type: 'paypal_error',
        },
      });
    }
  }
}

export default PayPalAPI;
