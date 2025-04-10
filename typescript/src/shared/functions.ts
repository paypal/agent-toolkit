import axios from 'axios';
import type PayPalAPI from './api';
import type { Context } from './configuration';
import {
  getInvoicParameters,
  cancelSentInvoiceParameters,
  createInvoiceParameters,
  createOrderParameters,
  generateInvoiceQrCodeParameters,
  getOrderParameters,
  listInvoicesParameters,
  sendInvoiceParameters,
  sendInvoiceReminderParameters,
  createSubscriptionPlanParameters,
  createShipmentParameters,
  getShipmentTrackingParameters,
  getDisputeParameters,
  listDisputesParameters,
  captureOrderParameters,
  acceptDisputeClaimParameters,
  listTransactionsParameters
} from "./parameters";
import { parseOrderDetails } from "./payloadUtils";
import { TypeOf } from "zod";
import debug from "debug";

const logger = debug('agent-toolkit:functions');

// === INVOICE FUNCTIONS ===

export async function createInvoice(
  paypal: PayPalAPI,
  context: Context,
  params: TypeOf<ReturnType<typeof createInvoiceParameters>>
) {
  logger('[createInvoice] Starting invoice creation process');
  logger(`[createInvoice] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  logger(`[createInvoice] Invoice detail: ${JSON.stringify(params)}`);


  const headers = await paypal.getHeaders();
  logger('[createInvoice] Headers obtained');

  const url = `${paypal.getBaseUrl()}/v2/invoicing/invoices`;
  logger(`[createInvoice] API URL: ${url}`);

  // Make API call
  try {
    logger('[createInvoice] Sending request to PayPal API');
    const response = await axios.post(url, params, { headers });
    logger(`[createInvoice] Invoice created successfully. Status: ${response.status}`);

    // Check if response matches the expected format for a successful invoice creation
    if (response.data && response.data.rel === 'self' &&
      response.data.href && response.data.href.includes('/v2/invoicing/invoices/') &&
      response.data.method === 'GET') {

      // Extract invoice ID from the href URL
      const hrefParts = response.data.href.split('/');
      const invoiceId = hrefParts[hrefParts.length - 1];
      logger(`[createInvoice] Invoice ID extracted from href: ${invoiceId}`);

      // Automatically send the invoice with specific parameters
      logger('[createInvoice] Automatically sending invoice with thank you note');
      try {
        const sendResult = await sendInvoice(paypal, context, {
          invoice_id: invoiceId,
          note: "thank you for choosing us. If there are any issues, feel free to contact us",
          send_to_recipient: true
        });
        logger(`[createInvoice] Auto-send invoice result: ${JSON.stringify(sendResult)}`);

        // Return both the create and send results
        return {
          createResult: response.data,
          sendResult: sendResult
        };
      } catch (sendError: any) {
        logger('[createInvoice] Error in auto-send invoice:', sendError.message);
        // Still return the original creation result even if sending fails
        return response.data;
      }
    } else {
      logger(`[createInvoice] Invoice ID: ${response.data.id || 'N/A'}`);
      return response.data;
    }
  } catch (error: any) {
    logger('[createInvoice] Error creating invoice:', error.message);
    handleAxiosError(error);
  }
}

export async function listInvoices(
  paypal: PayPalAPI,
  context: Context,
  params: TypeOf<ReturnType<typeof listInvoicesParameters>>
) {
  logger('[listInvoices] Starting to list invoices');
  logger(`[listInvoices] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  logger(`[listInvoices] Query parameters: ${JSON.stringify(params)}`);

  const headers = await paypal.getHeaders();
  logger('[listInvoices] Headers obtained');

  const url = `${paypal.getBaseUrl()}/v2/invoicing/invoices`;
  logger(`[listInvoices] API URL: ${url}`);

  // Make API call
  try {
    logger('[listInvoices] Sending request to PayPal API');
    const response = await axios.get(url, { headers, params });
    logger(`[listInvoices] Invoices retrieved successfully. Status: ${response.status}`);

    if (response.data.total_items !== undefined) {
      logger(`[listInvoices] Total items: ${response.data.total_items}`);
    }

    if (response.data.items && Array.isArray(response.data.items)) {
      logger(`[listInvoices] Retrieved ${response.data.items.length} invoices`);
    }

    return response.data;
  } catch (error: any) {
    logger('[listInvoices] Error listing invoices:', error.message);
    handleAxiosError(error);
  }
}

export async function getInvoice(
  paypal: PayPalAPI,
  context: Context,
  params: TypeOf<ReturnType<typeof getInvoicParameters>>
) {
  logger('[getInvoice] Starting to get invoice');
  logger(`[getInvoice] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  logger(`[getInvoice] Query parameters: ${JSON.stringify(params)}`);

  const headers = await paypal.getHeaders();
  logger('[getInvoice] Headers obtained');

  const url = `${paypal.getBaseUrl()}/v2/invoicing/invoices/${params.invoice_id}`;
  logger(`[getInvoice] API URL: ${url}`);

  // Make API call
  try {
    logger('[getInvoice] Sending request to PayPal API');
    const response = await axios.get(url, { headers });
    logger(`[getInvoice] Invoice retrieved successfully. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    logger('[getInvoice] Error getting invoice:', error.message);
    handleAxiosError(error);
  }
}

export async function sendInvoice(
  paypal: PayPalAPI,
  context: Context,
  params: TypeOf<ReturnType<typeof sendInvoiceParameters>>
) {
  logger('[sendInvoice] Starting to send invoice');
  logger(`[sendInvoice] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);

  const {
    invoice_id,
    note,
    send_to_recipient,
    additional_recipients,
  } = params;

  logger(`[sendInvoice] Invoice ID: ${invoice_id}`);

  if (note) {
    logger(`[sendInvoice] Note: ${note}`);
  }

  logger(`[sendInvoice] Send to recipient: ${send_to_recipient}`);

  if (additional_recipients && additional_recipients.length > 0) {
    logger(`[sendInvoice] Additional recipients: ${additional_recipients.join(', ')}`);
  }

  const headers = await paypal.getHeaders();
  logger('[sendInvoice] Headers obtained');

  const url = `${paypal.getBaseUrl()}/v2/invoicing/invoices/${invoice_id}/send`;
  logger(`[sendInvoice] API URL: ${url}`);

  // Make API call
  try {
    logger('[sendInvoice] Sending request to PayPal API');
    const response = await axios.post(url, params, { headers });
    logger(`[sendInvoice] Invoice sent successfully. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    logger('[sendInvoice] Error sending invoice:', error.message);
    handleAxiosError(error);
  }
}

export async function sendInvoiceReminder(
  paypal: PayPalAPI,
  context: Context,
  params: TypeOf<ReturnType<typeof sendInvoiceReminderParameters>>,
) {
  logger('[sendInvoiceReminder] Starting to send invoice reminder');
  logger(`[sendInvoiceReminder] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);

  const {
    invoice_id,
    note,
    subject,
    additional_recipients,
  } = params;

  logger(`[sendInvoiceReminder] Invoice ID: ${invoice_id}`);

  if (subject) {
    logger(`[sendInvoiceReminder] Subject: ${subject}`);
  }

  if (note) {
    logger(`[sendInvoiceReminder] Note: ${note}`);
  }

  if (additional_recipients && additional_recipients.length > 0) {
    logger(`[sendInvoiceReminder] Additional recipients: ${additional_recipients.join(', ')}`);
  }

  const headers = await paypal.getHeaders();
  logger('[sendInvoiceReminder] Headers obtained');

  const url = `${paypal.getBaseUrl()}/v2/invoicing/invoices/${invoice_id}/remind`;
  logger(`[sendInvoiceReminder] API URL: ${url}`);

  logger(`[sendInvoiceReminder] Request data: ${JSON.stringify(params)}`);

  // Make API call
  try {
    logger('[sendInvoiceReminder] Sending request to PayPal API');
    const response = await axios.post(url, params, { headers });
    logger(`[sendInvoiceReminder] Invoice reminder sent successfully. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    logger('[sendInvoiceReminder] Error sending invoice reminder:', error.message);
    handleAxiosError(error);
  }
}

export async function cancelSentInvoice(
  paypal: PayPalAPI,
  context: Context,
  params: TypeOf<ReturnType<typeof cancelSentInvoiceParameters>>
) {
  logger('[cancelSentInvoice] Starting to cancel sent invoice');
  logger(`[cancelSentInvoice] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);

  const {
    invoice_id,
    note,
    send_to_recipient,
    additional_recipients,
  } = params;

  logger(`[cancelSentInvoice] Invoice ID: ${invoice_id}`);

  if (note) {
    logger(`[cancelSentInvoice] Note: ${note}`);
  }

  logger(`[cancelSentInvoice] Send to recipient: ${send_to_recipient}`);

  if (additional_recipients && additional_recipients.length > 0) {
    logger(`[cancelSentInvoice] Additional recipients: ${additional_recipients.join(', ')}`);
  }

  const headers = await paypal.getHeaders();
  logger('[cancelSentInvoice] Headers obtained');

  const url = `${paypal.getBaseUrl()}/v2/invoicing/invoices/${invoice_id}/cancel`;
  logger(`[cancelSentInvoice] API URL: ${url}`);

  logger(`[cancelSentInvoice] Request data: ${JSON.stringify(params)}`);

  // Make API call
  try {
    logger('[cancelSentInvoice] Sending request to PayPal API');
    const response = await axios.post(url, params, { headers });
    if (response.status === 204) {
      logger(`[cancelSentInvoice] Invoice cancelled successfully. Status: ${response.status}`);
      return { success: true, invoice_id };
    }
    logger(`[cancelSentInvoice] Invoice cancellation response received. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    logger('[cancelSentInvoice] Error cancelling invoice:', error.message);
    handleAxiosError(error);
  }
}

export async function generateInvoiceQrCode(
  paypal: PayPalAPI,
  context: Context,
  params: TypeOf<ReturnType<typeof generateInvoiceQrCodeParameters>>
) {
  const { invoice_id } = params;
  const requestBody = {
    width: params.width,
    height: params.height
  };
  const url = `${paypal.getBaseUrl()}/v2/invoicing/invoices/${invoice_id}/generate-qr-code`;
  // Make API call
  const headers = await paypal.getHeaders();
  logger('[generateInvoiceQrCodePrompt] Headers obtained');
  try {
    logger('[cancelSentInvoice] Sending request to PayPal API');
    const response = await axios.post(url, requestBody, { headers });
    if (response.status === 204) {
      logger(`[cancelSentInvoice] Invoice cancelled successfully. Status: ${response.status}`);
      return { success: true, invoice_id };
    }
    logger(`[cancelSentInvoice] Invoice cancellation response received. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    logger('[cancelSentInvoice] Error cancelling invoice:', error.message);
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
  logger('[createProduct] Starting product creation process');
  logger(`[createProduct] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  logger(`[createProduct] Product name: ${name}, type: ${type}`);

  if (description) {
    logger(`[createProduct] Description: ${description}`);
  }

  if (category) {
    logger(`[createProduct] Category: ${category}`);
  }

  if (image_url) {
    logger(`[createProduct] Image URL: ${image_url}`);
  }

  if (home_url) {
    logger(`[createProduct] Home URL: ${home_url}`);
  }

  const headers = await paypal.getHeaders();
  logger('[createProduct] Headers obtained');

  const url = `${paypal.getBaseUrl()}/v1/catalogs/products`;
  logger(`[createProduct] API URL: ${url}`);

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
  logger(`[createProduct] Product data: ${JSON.stringify(productData)}`);

  // Make API call
  try {
    logger('[createProduct] Sending request to PayPal API');
    const response = await axios.post(url, productData, { headers });
    logger(`[createProduct] Product created successfully. Status: ${response.status}`);
    logger(`[createProduct] Product ID: ${response.data.id || 'N/A'}`);
    return response.data;
  } catch (error: any) {
    logger('[createProduct] Error creating product:', error.message);
    handleAxiosError(error);
  }
}

export async function listProducts(
  paypal: PayPalAPI,
  context: Context,
  { page, page_size, total_required }: { page?: number; page_size?: number; total_required?: boolean }
) {
  logger('[listProducts] Starting to list products');
  logger(`[listProducts] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  logger(`[listProducts] Pagination: page=${page}, page_size=${page_size}, total_required=${total_required}`);

  const headers = await paypal.getHeaders();
  logger('[listProducts] Headers obtained');

  const url = `${paypal.getBaseUrl()}/v1/catalogs/products`;
  logger(`[listProducts] API URL: ${url}`);

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
  logger(`[listProducts] Query parameters: ${JSON.stringify(params)}`);

  // Make API call
  try {
    logger('[listProducts] Sending request to PayPal API');
    const response = await axios.get(url, { headers, params });
    logger(`[listProducts] Products retrieved successfully. Status: ${response.status}`);

    if (response.data.total_items !== undefined) {
      logger(`[listProducts] Total items: ${response.data.total_items}`);
    }

    if (response.data.products && Array.isArray(response.data.products)) {
      logger(`[listProducts] Retrieved ${response.data.products.length} products`);
    }

    return response.data;
  } catch (error: any) {
    logger('[listProducts] Error listing products:', error.message);
    handleAxiosError(error);
  }
}

export async function updateProduct(
  paypal: PayPalAPI,
  context: Context,
  { product_id, operations }: { product_id: string; operations: any[] }
) {
  logger('[updateProduct] Starting product update process');
  logger(`[updateProduct] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  logger(`[updateProduct] Product ID: ${product_id}`);
  logger(`[updateProduct] Operations: ${JSON.stringify(operations)}`);

  const headers = await paypal.getHeaders();
  headers['Content-Type'] = 'application/json-patch+json';
  logger('[updateProduct] Headers obtained with patch content type');

  const url = `${paypal.getBaseUrl()}/v1/catalogs/products/${product_id}`;
  logger(`[updateProduct] API URL: ${url}`);

  // Make API call
  try {
    logger('[updateProduct] Sending PATCH request to PayPal API');
    const response = await axios.patch(url, operations, { headers });
    if (response.status === 204) {
      logger(`[updateProduct] Product updated successfully. Status: ${response.status}`);
      return { success: true, product_id };
    }
    logger(`[updateProduct] Product update response received. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    logger('[updateProduct] Error updating product:', error.message);
    handleAxiosError(error);
  }
}

// === SUBSCRIPTION PLAN FUNCTIONS ===

export async function createSubscriptionPlan(
  paypal: PayPalAPI,
  context: Context,
  params: TypeOf<ReturnType<typeof createSubscriptionPlanParameters>>
) {
  logger('[createSubscriptionPlan] Starting subscription plan creation process');
  logger(`[createSubscriptionPlan] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  const { product_id, name, billing_cycles, description, payment_preferences, taxes } = params;
  logger(`[createSubscriptionPlan] Product ID: ${product_id}`);
  logger(`[createSubscriptionPlan] Plan name: ${name}`);
  logger(`[createSubscriptionPlan] Billing cycles: ${JSON.stringify(billing_cycles)}`);

  if (description) {
    logger(`[createSubscriptionPlan] Description: ${description}`);
  }

  if (payment_preferences) {
    logger(`[createSubscriptionPlan] Payment preferences: ${JSON.stringify(payment_preferences)}`);
  }

  if (taxes) {
    logger(`[createSubscriptionPlan] Taxes: ${JSON.stringify(taxes)}`);
  }

  const headers = await paypal.getHeaders();
  logger('[createSubscriptionPlan] Headers obtained');

  const url = `${paypal.getBaseUrl()}/v1/billing/plans`;
  logger(`[createSubscriptionPlan] API URL: ${url}`);

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
  logger(`[createSubscriptionPlan] Plan data: ${JSON.stringify(planData)}`);

  // Make API call
  try {
    logger('[createSubscriptionPlan] Sending request to PayPal API');
    const response = await axios.post(url, planData, { headers });
    logger(`[createSubscriptionPlan] Subscription plan created successfully. Status: ${response.status}`);
    logger(`[createSubscriptionPlan] Plan ID: ${response.data.id || 'N/A'}`);
    return response.data;
  } catch (error: any) {
    logger('[createSubscriptionPlan] Error creating subscription plan:', error.message);
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
  logger('[listSubscriptionPlans] Starting to list subscription plans');
  logger(`[listSubscriptionPlans] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);

  if (product_id) {
    logger(`[listSubscriptionPlans] Filtering by product ID: ${product_id}`);
  }

  logger(`[listSubscriptionPlans] Pagination: page=${page}, page_size=${page_size}, total_required=${total_required}`);

  const headers = await paypal.getHeaders();
  logger('[listSubscriptionPlans] Headers obtained');

  const url = `${paypal.getBaseUrl()}/v1/billing/plans`;
  logger(`[listSubscriptionPlans] API URL: ${url}`);

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
  logger(`[listSubscriptionPlans] Query parameters: ${JSON.stringify(params)}`);

  // Make API call
  try {
    logger('[listSubscriptionPlans] Sending request to PayPal API');
    const response = await axios.get(url, { headers, params });
    logger(`[listSubscriptionPlans] Subscription plans retrieved successfully. Status: ${response.status}`);

    if (response.data.total_items !== undefined) {
      logger(`[listSubscriptionPlans] Total items: ${response.data.total_items}`);
    }

    if (response.data.plans && Array.isArray(response.data.plans)) {
      logger(`[listSubscriptionPlans] Retrieved ${response.data.plans.length} subscription plans`);
    }

    return response.data;
  } catch (error: any) {
    logger('[listSubscriptionPlans] Error listing subscription plans:', error.message);
    handleAxiosError(error);
  }
}

// === ORDER FUNCTIONS ===

export const createOrder = async (
  paypal: PayPalAPI,
  context: Context,
  params: TypeOf<ReturnType<typeof createOrderParameters>>
): Promise<any> => {
  logger('[createOrder] Starting order creation process');
  logger(`[createOrder] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  logger(`[createOrder] Order details: ${JSON.stringify(params)}`);
  const headers = await paypal.getHeaders();
  const url = `${paypal.getBaseUrl()}/v2/checkout/orders`;
  const orderRequest = parseOrderDetails(params);
  try {
    logger(`[createOrder] Request body: ${JSON.stringify(orderRequest)}`);
    const response = await axios.post(url, orderRequest, { headers });
    logger(`[createOrder] Order created successfully. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    logger('[createOrder] Error creating order:', error.message);
    handleAxiosError(error);
  }
};

export const getOrder = async (
  paypal: PayPalAPI,
  context: Context,
  params: TypeOf<ReturnType<typeof getOrderParameters>>
): Promise<any> => {
  logger('[getOrder] Starting order retrieval process');
  logger(`[getOrder] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  logger(`[getOrder] Order ID: ${params.id}`);

  const headers = await paypal.getHeaders();
  logger('[getOrder] Headers obtained');

  const url = `${paypal.getBaseUrl()}/v2/checkout/orders/${params.id}`;
  logger(`[getOrder] API URL: ${url}`);

  try {
    logger('[getOrder] Sending GET request to PayPal API');
    const response = await axios.get(url, { headers });
    logger(`[getOrder] Order retrieved successfully. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    logger('[getOrder] Error retrieving order:', error.message);
    handleAxiosError(error);
  }
};

export const captureOrder = async (
  paypal: PayPalAPI,
  context: Context,
  params: TypeOf<ReturnType<typeof captureOrderParameters>>
) => {
  try {
    logger(`[captureOrder] Starting order capture process with params: ${JSON.stringify(params)}`);
    const url = `${paypal.getBaseUrl()}/v2/checkout/orders/${params.id}/capture`;
    const response = await axios.post(url, {}, {
      headers: await paypal.getHeaders()
    });
    logger(`[captureOrder] Response %s`, response);
    if (response.status <= 299) {
      return {
        status: "success",
        response: response.data
      };
    } else {
      return {
        status: "error",
        response: response.data
      };
    }
  } catch (error) {
    console.error(error);
    throw new Error('Failed to capture order');
  }
}

// === TRACKING FUNCTIONS ===

export async function createShipment(
  paypal: PayPalAPI,
  context: Context,
  params: TypeOf<ReturnType<typeof createShipmentParameters>>
) {
  logger('[createShipment] Starting shipment tracking creation process');
  logger(`[createShipment] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  const {
    tracking_number,
    transaction_id,
    status,
    carrier
  } = params;
  logger(`[createShipment] Tracker details: tracking_number=${tracking_number}, transaction_id=${transaction_id}, status=${status}, carrier=${carrier}`);

  const headers = await paypal.getHeaders();
  logger('[createShipment] Headers obtained');

  const url = `${paypal.getBaseUrl()}/v1/shipping/trackers-batch`;
  logger(`[createShipment] API URL: ${url}`);

  // Prepare trackers data - wrapping single shipment in an array
  const trackersData = {
    trackers: [{
      tracking_number,
      transaction_id,
      status,
      carrier
    }]
  };

  logger(`[createShipment] Trackers data: ${JSON.stringify(trackersData)}`);

  // Make API call
  try {
    logger('[createShipment] Sending request to PayPal API');
    const response = await axios.post(url, trackersData, { headers });
    logger(`[createShipment] Shipment tracking created successfully. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    logger('[createShipment] Error creating shipment tracking:', error.message);
    handleAxiosError(error);
  }
}

export async function getShipmentTracking(
  paypal: PayPalAPI,
  context: Context,
  params: TypeOf<ReturnType<typeof getShipmentTrackingParameters>>
) {
  logger('[getShipmentTracking] Starting to get shipment tracking information');
  logger(`[getShipmentTracking] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  const {
    transaction_id,
    tracking_number
  } = params;
  logger(`[getShipmentTracking] Tracking details: transaction_id=${transaction_id}, tracking_number=${tracking_number}`);

  const headers = await paypal.getHeaders();
  logger('[getShipmentTracking] Headers obtained');

  const url = `${paypal.getBaseUrl()}/v1/shipping/trackers/${transaction_id}-${tracking_number}`;
  logger(`[getShipmentTracking] API URL: ${url}`);

  // Make API call
  try {
    logger('[getShipmentTracking] Sending request to PayPal API');
    const response = await axios.get(url, { headers });
    logger(`[getShipmentTracking] Shipment tracking retrieved successfully. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    logger('[getShipmentTracking] Error retrieving shipment tracking:', error.message);
    handleAxiosError(error);
  }
}

// === DISPUTE FUNCTIONS ===


export function toQueryString(params: TypeOf<ReturnType<typeof listDisputesParameters>>): string {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

export async function listDisputes(
  paypal: PayPalAPI,
  context: Context,
  params: TypeOf<ReturnType<typeof listDisputesParameters>>
): Promise<any> {
  logger('[listDisputes] Starting to list disputes');
  logger(`[listDisputes] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);

  const headers = await paypal.getHeaders();
  logger('[listDisputes] Headers obtained');

  const url = `${paypal.getBaseUrl()}/v1/customer/disputes?${toQueryString(params)}`;
  logger(`[listDisputes] API URL: ${url}`);

  try {
    logger('[listDisputes] Sending request to PayPal API');
    const response = await axios.get(url, { headers, params });
    logger(`[listDisputes] Disputes retrieved successfully. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    logger('[listDisputes] Error listing disputes:', error.message);
    handleAxiosError(error);
  }
}

export async function getDispute(
  paypal: PayPalAPI,
  context: Context,
  params: TypeOf<ReturnType<typeof getDisputeParameters>>
): Promise<any> {
  logger(`[getDispute] Starting to get dispute details for ID: ${params.dispute_id}`);
  logger(`[getDispute] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);

  const { dispute_id } = params

  const headers = await paypal.getHeaders();
  logger('[getDispute] Headers obtained');

  const url = `${paypal.getBaseUrl()}/v1/customer/disputes/${dispute_id}`;
  logger(`[getDispute] API URL: ${url}`);

  try {
    logger('[getDispute] Sending request to PayPal API');
    const response = await axios.get(url, { headers });
    logger(`[getDispute] Dispute details retrieved successfully. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    logger(`[getDispute] Error retrieving dispute details for ID: ${dispute_id}:`, error.message);
    handleAxiosError(error);
  }
}

export async function acceptDisputeClaim(
  paypal: PayPalAPI,
  context: Context,
  params: TypeOf<ReturnType<typeof acceptDisputeClaimParameters>>
): Promise<any> {
  logger('[acceptClaim] Starting to list disputes');
  logger(`[acceptClaim] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);

  const headers = await paypal.getHeaders();
  logger('[acceptClaim] Headers obtained');

  const url = `${paypal.getBaseUrl()}/v1/customer/disputes/${params.dispute_id}/accept-claim`;
  logger(`[acceptClaim] API URL: ${url}`);

  try {
    logger('[acceptClaim] Sending request to PayPal API');
    const response = await axios.post(url, { note: params.note }, { headers, params });
    logger(`[acceptClaim] Disputes retrieved successfully. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    logger('[acceptClaim] Error listing disputes:', error.message);
    handleAxiosError(error);
  }
}

export async function listTransactions(
    paypal: PayPalAPI,
    context: Context,
    params: TypeOf<ReturnType<typeof listTransactionsParameters>>
): Promise<any> {
  logger('[listTransactions] Starting to list disputes');
  logger(`[listTransactions] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);

  const headers = await paypal.getHeaders();
  logger('[listTransactions] Headers obtained');

  if (!params.end_date && !params.start_date) {
    params.end_date = new Date().toLocaleString();
    params.start_date = new Date(new Date().getDay() - 31).toLocaleString();
  } else if(!params.end_date){
    params.end_date = new Date(new Date(params.start_date as string).getDay() + 31).toLocaleString();
  } else if(!params.start_date){
    params.start_date = new Date(new Date(params.end_date as string).getDay() - 31).toLocaleString();
  } else {
    let dayRange = new Date(params.end_date as string).getDay() - new Date(params.start_date as string).getDay();
    if (dayRange > 31) {
      // Reset start_date time if range > 31
      params.start_date = new Date(new Date(params.end_date as string).getDay() - 31).toLocaleString();
    }
  }

  const url = `${paypal.getBaseUrl()}/v1/reporting/transactions?${toQueryString(params)}`;
  logger(`[listTransactions] API URL: ${url}`);

  try {
    logger('[listTransactions] Sending request to PayPal API');
    const response = await axios.get(url, { headers, params });
    logger(`[listTransactions] Disputes retrieved successfully. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    logger('[listTransactions] Error listing disputes:', error.message);
    handleAxiosError(error);
  }
}

// Helper function to handle Axios errors
function handleAxiosError(error: any): never {
  logger('[handleAxiosError] Processing error from PayPal API');

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    logger(`[handleAxiosError] Response error status: ${error.response.status}`);
    logger(`[handleAxiosError] Response error headers: ${JSON.stringify(error.response.headers)}`);

    try {
      const errorData = error.response.data;
      logger(`[handleAxiosError] Error data: ${JSON.stringify(errorData)}`);

      let errorMessage = errorData.message || 'Unknown error';

      if (errorData.details && Array.isArray(errorData.details)) {
        const detailDescriptions = errorData.details
          .map((detail: any) => detail.description || '')
          .filter(Boolean)
          .join('; ');

        if (detailDescriptions) {
          errorMessage += ': ' + detailDescriptions;
          logger(`[handleAxiosError] Error details: ${detailDescriptions}`);
        }
      }

      logger(`[handleAxiosError] Throwing error with message: PayPal API error (${error.response.status}): ${errorMessage}`);
      throw new Error(`PayPal API error (${error.response.status}): ${errorMessage}`);
    } catch (e) {
      // In case of parsing issues, throw a more generic error
      logger('[handleAxiosError] Error parsing response data, using raw data');
      logger(`[handleAxiosError] Throwing error with message: PayPal API error (${error.response.status}): ${error.response.data}`);
      throw new Error(`PayPal API error (${error.response.status}): ${error.response.data}`);
    }
  } else if (error.request) {
    // The request was made but no response was received
    logger('[handleAxiosError] No response received from PayPal API');
    logger(`[handleAxiosError] Request: ${JSON.stringify(error.request)}`);
    logger(`[handleAxiosError] Throwing error with message: PayPal API error: No response received - ${error.message}`);
    throw new Error(`PayPal API error: No response received - ${error.message}`);
  } else {
    // Something happened in setting up the request that triggered an Error
    logger(`[handleAxiosError] Error setting up request: ${error.message}`);
    logger(`[handleAxiosError] Throwing error with message: PayPal API error: ${error.message}`);
    throw new Error(`PayPal API error: ${error.message}`);
  }
}


