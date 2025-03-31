import axios from 'axios';
import type PayPalAPI from './api';
import type { Context } from './configuration';
import PayPalClient from "./client";
import {createOrderParameters, getOrderParameters} from "./parameters";
import {getResponseFromStatus, parseOrderDetails, PayPalResponse} from "./payloadUtils";
import {ApiResponse, Order, OrdersController} from "@paypal/paypal-server-sdk";
import {TypeOf} from "zod";

// === INVOICE FUNCTIONS ===

export async function createInvoice(
  paypal: PayPalAPI,
  context: Context,
  { detail, items, invoicer, primary_recipients, amount }: { detail: any; items?: any[], invoicer: any, primary_recipients?:any[],amount: any }
) {
  console.error('[createInvoice] Starting invoice creation process');
  console.error(`[createInvoice] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  console.error(`[createInvoice] Invoice detail: ${JSON.stringify(detail)}`);
  
  if (items) {
    console.error(`[createInvoice] Items provided: ${items.length} items`);
  } else {
    console.error('[createInvoice] No items provided');
  }
  
  const headers = await paypal.getHeaders();
  console.error('[createInvoice] Headers obtained');
  
  const url = `${paypal.getBaseUrl()}/v2/invoicing/invoices`;
  console.error(`[createInvoice] API URL: ${url}`);

  // Prepare invoice data
  const invoiceData: any = {
    detail: detail,
    primary_recipients: primary_recipients,
    invoicer: invoicer,
    amount: amount,
  };

  if (items) {
    invoiceData.items = items;
  }

  // Add merchant_id from context if available
  if (context.merchant_id && invoiceData.detail && invoiceData.detail.merchant_info) {
    invoiceData.detail.merchant_info.merchant_id = context.merchant_id;
    console.error(`[createInvoice] Added merchant_id: ${context.merchant_id} to invoice data`);
  }

  // Make API call
  try {
    console.error('[createInvoice] Sending request to PayPal API');
    const response = await axios.post(url, invoiceData, { headers });
    console.error(`[createInvoice] Invoice created successfully. Status: ${response.status}`);
    
    // Check if response matches the expected format for a successful invoice creation
    if (response.data && response.data.rel === 'self' && 
        response.data.href && response.data.href.includes('/v2/invoicing/invoices/') && 
        response.data.method === 'GET') {
      
      // Extract invoice ID from the href URL
      const hrefParts = response.data.href.split('/');
      const invoiceId = hrefParts[hrefParts.length - 1];
      console.error(`[createInvoice] Invoice ID extracted from href: ${invoiceId}`);
      
      // Automatically send the invoice with specific parameters
      console.error('[createInvoice] Automatically sending invoice with thank you note');
      try {
        const sendResult = await sendInvoice(paypal, context, {
          invoice_id: invoiceId,
          note: "thank you for choosing us. If there are any issues, feel free to contact us",
          send_to_recipient: true
        });
        console.error(`[createInvoice] Auto-send invoice result: ${JSON.stringify(sendResult)}`);
        
        // Return both the create and send results
        return {
          createResult: response.data,
          sendResult: sendResult
        };
      } catch (sendError: any) {
        console.error('[createInvoice] Error in auto-send invoice:', sendError.message);
        // Still return the original creation result even if sending fails
        return response.data;
      }
    } else {
      console.error(`[createInvoice] Invoice ID: ${response.data.id || 'N/A'}`);
      return response.data;
    }
  } catch (error: any) {
    console.error('[createInvoice] Error creating invoice:', error.message);
    handleAxiosError(error);
  }
}

export async function listInvoices(
  paypal: PayPalAPI,
  context: Context,
  { page, page_size, total_required }: { page?: number; page_size?: number; total_required?: boolean }
) {
  console.error('[listInvoices] Starting to list invoices');
  console.error(`[listInvoices] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  console.error(`[listInvoices] Pagination: page=${page}, page_size=${page_size}, total_required=${total_required}`);
  
  const headers = await paypal.getHeaders();
  console.error('[listInvoices] Headers obtained');
  
  const url = `${paypal.getBaseUrl()}/v2/invoicing/invoices`;
  console.error(`[listInvoices] API URL: ${url}`);

  // Prepare query parameters
  const params: any = {};
  if (page !== undefined) {
    params.page = page;
  }
  if (page_size !== undefined) {
    params.page_size = page_size;
  }
  if (total_required !== undefined) {
    params.total_required = total_required.toString().toLowerCase();
  }
  console.error(`[listInvoices] Query parameters: ${JSON.stringify(params)}`);

  // Make API call
  try {
    console.error('[listInvoices] Sending request to PayPal API');
    const response = await axios.get(url, { headers, params });
    console.error(`[listInvoices] Invoices retrieved successfully. Status: ${response.status}`);
    
    if (response.data.total_items !== undefined) {
      console.error(`[listInvoices] Total items: ${response.data.total_items}`);
    }
    
    if (response.data.items && Array.isArray(response.data.items)) {
      console.error(`[listInvoices] Retrieved ${response.data.items.length} invoices`);
    }
    
    return response.data;
  } catch (error: any) {
    console.error('[listInvoices] Error listing invoices:', error.message);
    handleAxiosError(error);
  }
}

export async function sendInvoice(
  paypal: PayPalAPI,
  context: Context,
  {
    invoice_id,
    note,
    send_to_recipient,
    additional_recipients,
  }: {
    invoice_id: string;
    note?: string;
    send_to_recipient?: boolean;
    additional_recipients?: string[];
  }
) {
  console.error('[sendInvoice] Starting to send invoice');
  console.error(`[sendInvoice] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  console.error(`[sendInvoice] Invoice ID: ${invoice_id}`);
  
  if (note) {
    console.error(`[sendInvoice] Note: ${note}`);
  }
  
  console.error(`[sendInvoice] Send to recipient: ${send_to_recipient}`);
  
  if (additional_recipients && additional_recipients.length > 0) {
    console.error(`[sendInvoice] Additional recipients: ${additional_recipients.join(', ')}`);
  }
  
  const headers = await paypal.getHeaders();
  console.error('[sendInvoice] Headers obtained');
  
  const url = `${paypal.getBaseUrl()}/v2/invoicing/invoices/${invoice_id}/send`;
  console.error(`[sendInvoice] API URL: ${url}`);

  // Prepare request data
  const sendData: any = {};
  if (note !== undefined) {
    sendData.note = note;
  }
  if (send_to_recipient !== undefined) {
    sendData.send_to_recipient = send_to_recipient;
  }
  if (additional_recipients !== undefined) {
    sendData.additional_recipients = additional_recipients;
  }
  console.error(`[sendInvoice] Request data: ${JSON.stringify(sendData)}`);

  // Make API call
  try {
    console.error('[sendInvoice] Sending request to PayPal API');
    const response = await axios.post(url, sendData, { headers });
    console.error(`[sendInvoice] Invoice sent successfully. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    console.error('[sendInvoice] Error sending invoice:', error.message);
    handleAxiosError(error);
  }
}

export async function sendInvoiceReminder(
  paypal: PayPalAPI,
  context: Context,
  {
    invoice_id,
    subject,
    note,
    additional_recipients,
  }: {
    invoice_id: string;
    subject?: string;
    note?: string;
    additional_recipients?: string[];
  }
) {
  console.error('[sendInvoiceReminder] Starting to send invoice reminder');
  console.error(`[sendInvoiceReminder] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  console.error(`[sendInvoiceReminder] Invoice ID: ${invoice_id}`);
  
  if (subject) {
    console.error(`[sendInvoiceReminder] Subject: ${subject}`);
  }
  
  if (note) {
    console.error(`[sendInvoiceReminder] Note: ${note}`);
  }
  
  if (additional_recipients && additional_recipients.length > 0) {
    console.error(`[sendInvoiceReminder] Additional recipients: ${additional_recipients.join(', ')}`);
  }
  
  const headers = await paypal.getHeaders();
  console.error('[sendInvoiceReminder] Headers obtained');
  
  const url = `${paypal.getBaseUrl()}/v2/invoicing/invoices/${invoice_id}/remind`;
  console.error(`[sendInvoiceReminder] API URL: ${url}`);

  // Prepare request data
  const reminderData: any = {};
  if (subject !== undefined) {
    reminderData.subject = subject;
  }
  if (note !== undefined) {
    reminderData.note = note;
  }
  if (additional_recipients !== undefined) {
    reminderData.additional_recipients = additional_recipients;
  }
  console.error(`[sendInvoiceReminder] Request data: ${JSON.stringify(reminderData)}`);

  // Make API call
  try {
    console.error('[sendInvoiceReminder] Sending request to PayPal API');
    const response = await axios.post(url, reminderData, { headers });
    console.error(`[sendInvoiceReminder] Invoice reminder sent successfully. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    console.error('[sendInvoiceReminder] Error sending invoice reminder:', error.message);
    handleAxiosError(error);
  }
}

export async function cancelSentInvoice(
  paypal: PayPalAPI,
  context: Context,
  {
    invoice_id,
    note,
    send_to_recipient,
    additional_recipients,
  }: {
    invoice_id: string;
    note?: string;
    send_to_recipient?: boolean;
    additional_recipients?: string[];
  }
) {
  console.error('[cancelSentInvoice] Starting to cancel sent invoice');
  console.error(`[cancelSentInvoice] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  console.error(`[cancelSentInvoice] Invoice ID: ${invoice_id}`);
  
  if (note) {
    console.error(`[cancelSentInvoice] Note: ${note}`);
  }
  
  console.error(`[cancelSentInvoice] Send to recipient: ${send_to_recipient}`);
  
  if (additional_recipients && additional_recipients.length > 0) {
    console.error(`[cancelSentInvoice] Additional recipients: ${additional_recipients.join(', ')}`);
  }
  
  const headers = await paypal.getHeaders();
  console.error('[cancelSentInvoice] Headers obtained');
  
  const url = `${paypal.getBaseUrl()}/v2/invoicing/invoices/${invoice_id}/cancel`;
  console.error(`[cancelSentInvoice] API URL: ${url}`);

  // Prepare request data
  const cancelData: any = {};
  if (note !== undefined) {
    cancelData.note = note;
  }
  if (send_to_recipient !== undefined) {
    cancelData.send_to_recipient = send_to_recipient;
  }
  if (additional_recipients !== undefined) {
    cancelData.additional_recipients = additional_recipients;
  }
  console.error(`[cancelSentInvoice] Request data: ${JSON.stringify(cancelData)}`);

  // Make API call
  try {
    console.error('[cancelSentInvoice] Sending request to PayPal API');
    const response = await axios.post(url, cancelData, { headers });
    if (response.status === 204) {
      console.error(`[cancelSentInvoice] Invoice cancelled successfully. Status: ${response.status}`);
      return { success: true, invoice_id };
    }
    console.error(`[cancelSentInvoice] Invoice cancellation response received. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    console.error('[cancelSentInvoice] Error cancelling invoice:', error.message);
    handleAxiosError(error);
  }
}

// === PRODUCT FUNCTIONS ===

export async function createProduct(
  paypal: PayPalAPI,
  context: Context,
  {
    name,
    type,
    description,
    category,
    image_url,
    home_url,
  }: {
    name: string;
    type: string;
    description?: string;
    category?: string;
    image_url?: string;
    home_url?: string;
  }
) {
  console.error('[createProduct] Starting product creation process');
  console.error(`[createProduct] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  console.error(`[createProduct] Product name: ${name}, type: ${type}`);
  
  if (description) {
    console.error(`[createProduct] Description: ${description}`);
  }
  
  if (category) {
    console.error(`[createProduct] Category: ${category}`);
  }
  
  if (image_url) {
    console.error(`[createProduct] Image URL: ${image_url}`);
  }
  
  if (home_url) {
    console.error(`[createProduct] Home URL: ${home_url}`);
  }
  
  const headers = await paypal.getHeaders();
  console.error('[createProduct] Headers obtained');
  
  const url = `${paypal.getBaseUrl()}/v1/catalogs/products`;
  console.error(`[createProduct] API URL: ${url}`);

  // Prepare product data
  const productData: any = {
    name,
    type,
  };

  if (description !== undefined) {
    productData.description = description;
  }
  if (category !== undefined) {
    productData.category = category;
  }
  if (image_url !== undefined) {
    productData.image_url = image_url;
  }
  if (home_url !== undefined) {
    productData.home_url = home_url;
  }
  console.error(`[createProduct] Product data: ${JSON.stringify(productData)}`);

  // Make API call
  try {
    console.error('[createProduct] Sending request to PayPal API');
    const response = await axios.post(url, productData, { headers });
    console.error(`[createProduct] Product created successfully. Status: ${response.status}`);
    console.error(`[createProduct] Product ID: ${response.data.id || 'N/A'}`);
    return response.data;
  } catch (error: any) {
    console.error('[createProduct] Error creating product:', error.message);
    handleAxiosError(error);
  }
}

export async function listProducts(
  paypal: PayPalAPI,
  context: Context,
  { page, page_size, total_required }: { page?: number; page_size?: number; total_required?: boolean }
) {
  console.error('[listProducts] Starting to list products');
  console.error(`[listProducts] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  console.error(`[listProducts] Pagination: page=${page}, page_size=${page_size}, total_required=${total_required}`);
  
  const headers = await paypal.getHeaders();
  console.error('[listProducts] Headers obtained');
  
  const url = `${paypal.getBaseUrl()}/v1/catalogs/products`;
  console.error(`[listProducts] API URL: ${url}`);

  // Prepare query parameters
  const params: any = {};
  if (page !== undefined) {
    params.page = page;
  }
  if (page_size !== undefined) {
    params.page_size = page_size;
  }
  if (total_required !== undefined) {
    params.total_required = total_required.toString().toLowerCase();
  }
  console.error(`[listProducts] Query parameters: ${JSON.stringify(params)}`);

  // Make API call
  try {
    console.error('[listProducts] Sending request to PayPal API');
    const response = await axios.get(url, { headers, params });
    console.error(`[listProducts] Products retrieved successfully. Status: ${response.status}`);
    
    if (response.data.total_items !== undefined) {
      console.error(`[listProducts] Total items: ${response.data.total_items}`);
    }
    
    if (response.data.products && Array.isArray(response.data.products)) {
      console.error(`[listProducts] Retrieved ${response.data.products.length} products`);
    }
    
    return response.data;
  } catch (error: any) {
    console.error('[listProducts] Error listing products:', error.message);
    handleAxiosError(error);
  }
}

export async function updateProduct(
  paypal: PayPalAPI,
  context: Context,
  { product_id, operations }: { product_id: string; operations: any[] }
) {
  console.error('[updateProduct] Starting product update process');
  console.error(`[updateProduct] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  console.error(`[updateProduct] Product ID: ${product_id}`);
  console.error(`[updateProduct] Operations: ${JSON.stringify(operations)}`);
  
  const headers = await paypal.getHeaders();
  headers['Content-Type'] = 'application/json-patch+json';
  console.error('[updateProduct] Headers obtained with patch content type');
  
  const url = `${paypal.getBaseUrl()}/v1/catalogs/products/${product_id}`;
  console.error(`[updateProduct] API URL: ${url}`);

  // Make API call
  try {
    console.error('[updateProduct] Sending PATCH request to PayPal API');
    const response = await axios.patch(url, operations, { headers });
    if (response.status === 204) {
      console.error(`[updateProduct] Product updated successfully. Status: ${response.status}`);
      return { success: true, product_id };
    }
    console.error(`[updateProduct] Product update response received. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    console.error('[updateProduct] Error updating product:', error.message);
    handleAxiosError(error);
  }
}

// === SUBSCRIPTION PLAN FUNCTIONS ===

export async function createSubscriptionPlan(
  paypal: PayPalAPI,
  context: Context,
  {
    product_id,
    name,
    billing_cycles,
    description,
    payment_preferences,
    taxes,
  }: {
    product_id: string;
    name: string;
    billing_cycles: any[];
    description?: string;
    payment_preferences?: any;
    taxes?: any;
  }
) {
  console.error('[createSubscriptionPlan] Starting subscription plan creation process');
  console.error(`[createSubscriptionPlan] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  console.error(`[createSubscriptionPlan] Product ID: ${product_id}`);
  console.error(`[createSubscriptionPlan] Plan name: ${name}`);
  console.error(`[createSubscriptionPlan] Billing cycles: ${JSON.stringify(billing_cycles)}`);
  
  if (description) {
    console.error(`[createSubscriptionPlan] Description: ${description}`);
  }
  
  if (payment_preferences) {
    console.error(`[createSubscriptionPlan] Payment preferences: ${JSON.stringify(payment_preferences)}`);
  }
  
  if (taxes) {
    console.error(`[createSubscriptionPlan] Taxes: ${JSON.stringify(taxes)}`);
  }
  
  const headers = await paypal.getHeaders();
  console.error('[createSubscriptionPlan] Headers obtained');
  
  const url = `${paypal.getBaseUrl()}/v1/billing/plans`;
  console.error(`[createSubscriptionPlan] API URL: ${url}`);

  // Prepare plan data
  const planData: any = {
    product_id,
    name,
    billing_cycles,
  };

  if (description !== undefined) {
    planData.description = description;
  }
  if (payment_preferences !== undefined) {
    planData.payment_preferences = payment_preferences;
  }
  if (taxes !== undefined) {
    planData.taxes = taxes;
  }
  console.error(`[createSubscriptionPlan] Plan data: ${JSON.stringify(planData)}`);

  // Make API call
  try {
    console.error('[createSubscriptionPlan] Sending request to PayPal API');
    const response = await axios.post(url, planData, { headers });
    console.error(`[createSubscriptionPlan] Subscription plan created successfully. Status: ${response.status}`);
    console.error(`[createSubscriptionPlan] Plan ID: ${response.data.id || 'N/A'}`);
    return response.data;
  } catch (error: any) {
    console.error('[createSubscriptionPlan] Error creating subscription plan:', error.message);
    handleAxiosError(error);
  }
}

export async function listSubscriptionPlans(
  paypal: PayPalAPI,
  context: Context,
  {
    product_id,
    page,
    page_size,
    total_required,
  }: {
    product_id?: string;
    page?: number;
    page_size?: number;
    total_required?: boolean;
  }
) {
  console.error('[listSubscriptionPlans] Starting to list subscription plans');
  console.error(`[listSubscriptionPlans] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  
  if (product_id) {
    console.error(`[listSubscriptionPlans] Filtering by product ID: ${product_id}`);
  }
  
  console.error(`[listSubscriptionPlans] Pagination: page=${page}, page_size=${page_size}, total_required=${total_required}`);
  
  const headers = await paypal.getHeaders();
  console.error('[listSubscriptionPlans] Headers obtained');
  
  const url = `${paypal.getBaseUrl()}/v1/billing/plans`;
  console.error(`[listSubscriptionPlans] API URL: ${url}`);

  // Prepare query parameters
  const params: any = {};
  if (product_id !== undefined) {
    params.product_id = product_id;
  }
  if (page !== undefined) {
    params.page = page;
  }
  if (page_size !== undefined) {
    params.page_size = page_size;
  }
  if (total_required !== undefined) {
    params.total_required = total_required.toString().toLowerCase();
  }
  console.error(`[listSubscriptionPlans] Query parameters: ${JSON.stringify(params)}`);

  // Make API call
  try {
    console.error('[listSubscriptionPlans] Sending request to PayPal API');
    const response = await axios.get(url, { headers, params });
    console.error(`[listSubscriptionPlans] Subscription plans retrieved successfully. Status: ${response.status}`);
    
    if (response.data.total_items !== undefined) {
      console.error(`[listSubscriptionPlans] Total items: ${response.data.total_items}`);
    }
    
    if (response.data.plans && Array.isArray(response.data.plans)) {
      console.error(`[listSubscriptionPlans] Retrieved ${response.data.plans.length} subscription plans`);
    }
    
    return response.data;
  } catch (error: any) {
    console.error('[listSubscriptionPlans] Error listing subscription plans:', error.message);
    handleAxiosError(error);
  }
}

// Helper function to handle Axios errors
function handleAxiosError(error: any): never {
  console.error('[handleAxiosError] Processing error from PayPal API');
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error(`[handleAxiosError] Response error status: ${error.response.status}`);
    console.error(`[handleAxiosError] Response error headers: ${JSON.stringify(error.response.headers)}`);
    
    try {
      const errorData = error.response.data;
      console.error(`[handleAxiosError] Error data: ${JSON.stringify(errorData)}`);
      
      let errorMessage = errorData.message || 'Unknown error';
      
      if (errorData.details && Array.isArray(errorData.details)) {
        const detailDescriptions = errorData.details
          .map((detail: any) => detail.description || '')
          .filter(Boolean)
          .join('; ');
        
        if (detailDescriptions) {
          errorMessage += ': ' + detailDescriptions;
          console.error(`[handleAxiosError] Error details: ${detailDescriptions}`);
        }
      }
      
      console.error(`[handleAxiosError] Throwing error with message: PayPal API error (${error.response.status}): ${errorMessage}`);
      throw new Error(`PayPal API error (${error.response.status}): ${errorMessage}`);
    } catch (e) {
      // In case of parsing issues, throw a more generic error
      console.error('[handleAxiosError] Error parsing response data, using raw data');
      console.error(`[handleAxiosError] Throwing error with message: PayPal API error (${error.response.status}): ${error.response.data}`);
      throw new Error(`PayPal API error (${error.response.status}): ${error.response.data}`);
    }
  } else if (error.request) {
    // The request was made but no response was received
    console.error('[handleAxiosError] No response received from PayPal API');
    console.error(`[handleAxiosError] Request: ${JSON.stringify(error.request)}`);
    console.error(`[handleAxiosError] Throwing error with message: PayPal API error: No response received - ${error.message}`);
    throw new Error(`PayPal API error: No response received - ${error.message}`);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error(`[handleAxiosError] Error setting up request: ${error.message}`);
    console.error(`[handleAxiosError] Throwing error with message: PayPal API error: ${error.message}`);
    throw new Error(`PayPal API error: ${error.message}`);
  }
}

// === ORDER FUNCTIONS ===

export const createOrder = async (
    paypalClient: PayPalClient,
    params: TypeOf<typeof createOrderParameters>
): Promise<PayPalResponse<Order>> => {
  const ordersController = new OrdersController(paypalClient.sdkClient);
  // Currently using only single currency for entire transaction
  const orderRequest = parseOrderDetails(params);
  try {
    const result: ApiResponse<Order> = await ordersController.ordersCreate({
      body: orderRequest,
    });
    return getResponseFromStatus(result);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to create order');
  }
};

export const getOrder = async (
    paypalClient: PayPalClient,
    params: TypeOf<typeof getOrderParameters>
): Promise<PayPalResponse<Order>> => {
  const ordersController = new OrdersController(paypalClient.sdkClient);
  try {
    const result = await ordersController.ordersGet({
      id: params.id
    });
    return getResponseFromStatus(result);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to retrieve order');
  }
};
