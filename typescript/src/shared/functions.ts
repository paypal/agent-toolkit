import axios from 'axios';
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
  createShipmentParameters,
  getShipmentTrackingParameters,
  getDisputeParameters,
  listDisputesParameters,
  captureOrderParameters,
  acceptDisputeClaimParameters,
  listTransactionsParameters,
  createProductParameters,
  listProductsParameters,
  showProductDetailsParameters,
  createSubscriptionPlanParameters,
  listSubscriptionPlansParameters,
  showSubscriptionPlanDetailsParameters,
  createSubscriptionParameters,
  showSubscriptionDetailsParameters,
  cancelSubscriptionParameters,
  createPaymentLinkParameters,
  getPaymentLinkParameters,
  getAllPaymentLinksParameters,
  updatePaymentLinkParameters
} from "./parameters";
import { parseOrderDetails, toQueryString } from "./payloadUtils";
import { TypeOf } from "zod";
import debug from "debug";
import PayPalClient from './client';

const logger = debug('agent-toolkit:functions');

// === INVOICE FUNCTIONS ===

export async function createInvoice(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof createInvoiceParameters>>
) {
  logger('[createInvoice] Starting invoice creation process');
  logger(`[createInvoice] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  logger(`[createInvoice] Invoice detail: ${JSON.stringify(params)}`);


  const headers = await client.getHeaders();
  logger('[createInvoice] Headers obtained');

  const url = `${client.getBaseUrl()}/v2/invoicing/invoices`;
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
        const sendResult = await sendInvoice(client, context, {
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
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof listInvoicesParameters>>
) {
  logger('[listInvoices] Starting to list invoices');
  logger(`[listInvoices] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  logger(`[listInvoices] Query parameters: ${JSON.stringify(params)}`);

  const headers = await client.getHeaders();
  logger('[listInvoices] Headers obtained');

  const url = `${client.getBaseUrl()}/v2/invoicing/invoices`;
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
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof getInvoicParameters>>
) {
  logger('[getInvoice] Starting to get invoice');
  logger(`[getInvoice] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  logger(`[getInvoice] Query parameters: ${JSON.stringify(params)}`);

  const headers = await client.getHeaders();
  logger('[getInvoice] Headers obtained');

  const url = `${client.getBaseUrl()}/v2/invoicing/invoices/${params.invoice_id}`;
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
  client: PayPalClient,
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

  const headers = await client.getHeaders();
  logger('[sendInvoice] Headers obtained');

  const url = `${client.getBaseUrl()}/v2/invoicing/invoices/${invoice_id}/send`;
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
  client: PayPalClient,
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

  const headers = await client.getHeaders();
  logger('[sendInvoiceReminder] Headers obtained');

  const url = `${client.getBaseUrl()}/v2/invoicing/invoices/${invoice_id}/remind`;
  logger(`[sendInvoiceReminder] API URL: ${url}`);

  logger(`[sendInvoiceReminder] Request params: ${JSON.stringify(params)}`);

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
  client: PayPalClient,
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

  const headers = await client.getHeaders();
  logger('[cancelSentInvoice] Headers obtained');

  const url = `${client.getBaseUrl()}/v2/invoicing/invoices/${invoice_id}/cancel`;
  logger(`[cancelSentInvoice] API URL: ${url}`);

  logger(`[cancelSentInvoice] Request params: ${JSON.stringify(params)}`);

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
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof generateInvoiceQrCodeParameters>>
) {
  const { invoice_id } = params;
  const requestBody = {
    width: params.width,
    height: params.height
  };
  const url = `${client.getBaseUrl()}/v2/invoicing/invoices/${invoice_id}/generate-qr-code`;
  // Make API call
  const headers = await client.getHeaders();
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
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof createProductParameters>>) {

  const headers = await client.getHeaders();
  const apiUrl = `${client.getBaseUrl()}/v1/catalogs/products`;
  logger(`[createProduct] Payload: ${JSON.stringify(params, null, 2)}`);
  try {
    const response = await axios.post(apiUrl, params, { headers });
    return response.data;
  } catch (error) {
    // @ts-ignore
    console.error("Error Creating Product:", error.response?.data || error);
    throw error;
  }
}


export async function listProducts(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof listProductsParameters>>) {

  const headers = await client.getHeaders();
  const { page = 1, page_size = 2, total_required = true } = params;
  const apiUrl = `${client.getBaseUrl()}/v1/catalogs/products?page_size=${page_size}&page=${page}&total_required=${total_required}`;

  try {
    const response = await axios.get(apiUrl, { headers });
    return response.data;
  } catch (error) {
    // @ts-ignore
    console.error("Error Listing Product:", error.response?.data || error);
    throw error;
  }
};

export async function showProductDetails(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof showProductDetailsParameters>>) {

  const headers = await client.getHeaders();
  const apiUrl = `${client.getBaseUrl()}/v1/catalogs/products/${params.product_id}`;
  try {
    const response = await axios.get(apiUrl, {
      headers: headers,
    });


    return response.data;
  } catch (error) {
    // @ts-ignore
    console.error("Error Show Product Details:", error.response?.data || error);
    throw error;
  }
};



// === SUBSCRIPTION PLAN FUNCTIONS ===
export async function createSubscriptionPlan(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof createSubscriptionPlanParameters>>) {

  const headers = await client.getHeaders();
  const apiUrl = `${client.getBaseUrl()}/v1/billing/plans`;
  logger(`[createSubscriptionPlan] Payload: ${JSON.stringify(params, null, 2)}`);
  try {
    const response = await axios.post(apiUrl, params, { headers });
    return response.data;
  } catch (error) {
    // @ts-ignore
    console.error("Error Creating Plan:", error.response?.data || error);
    throw error;
  }
}

export async function listSubscriptionPlans(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof listSubscriptionPlansParameters>>) {
  const { page = 1, page_size = 10, total_required = true, product_id } = params;
  let apiUrl = `${client.getBaseUrl()}/v1/billing/plans?page_size=${page_size}&page=${page}&total_required=${total_required}`;
  if (product_id) {
    apiUrl += `&product_id=${product_id}`;
  }
  const headers = await client.getHeaders();
  try {
    const response = await axios.get(apiUrl, {
      headers: headers,
    });
    return response.data;
  } catch (error) {
    // @ts-ignore
    console.error("Error Creating Plan:", error.response?.data || error);
    throw error;
  }
}

export async function showSubscriptionPlanDetails(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof showSubscriptionPlanDetailsParameters>>) {

  const headers = await client.getHeaders();
  const apiUrl = `${client.getBaseUrl()}/v1/billing/plans/${params.plan_id}`;
  try {
    const response = await axios.get(apiUrl, {
      headers: headers,
    });

    return response.data;
  } catch (error) {
    // @ts-ignore
    console.error("Error Show Plan Details:", error.response?.data || error);
    throw error;
  }
}


// === SUBSCRIPTION  FUNCTIONS ===
export async function createSubscription(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof createSubscriptionParameters>>) {

  const headers = await client.getHeaders();
  const apiUrl = `${client.getBaseUrl()}/v1/billing/subscriptions`;

  logger(`[createSubscription] Payload: ${JSON.stringify(params, null, 2)}`);
  try {
    const response = await axios.post(apiUrl, params, { headers });
    return response.data;
  } catch (error) {
    // @ts-ignore
    console.error("Error Creating Subscription:", error.response?.data || error);
    throw error;
  }
}


export async function showSubscriptionDetails(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof showSubscriptionDetailsParameters>>) {

  const headers = await client.getHeaders();
  const { subscription_id } = params;
  const apiUrl = `${client.getBaseUrl()}/v1/billing/subscriptions/${subscription_id}`;

  try {
    const response = await axios.get(apiUrl, {
      headers: headers,
    });

    return response.data;
  } catch (error) {
    // @ts-ignore
    console.error("Error Show Subscription Details:", error.response?.data || error);
    throw error;
  }
}


export async function cancelSubscription(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof cancelSubscriptionParameters>>) {

  const headers = await client.getHeaders();
  const { subscription_id, payload } = params;
  const apiUrl = `${client.getBaseUrl()}/v1/billing/subscriptions/${subscription_id}/cancel`;

  logger(`[cancelSubscription] Payload: ${JSON.stringify(params, null, 3)}`);
  try {
    const response = await axios.post(apiUrl, payload, { headers });
    return response.data;
  } catch (error) {
    // @ts-ignore
    console.error("Error Creating Subscription:", error.response?.data || error);
    throw error;
  }
}


// === ORDER FUNCTIONS ===

export const createOrder = async (
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof createOrderParameters>>
): Promise<any> => {
  logger('[createOrder] Starting order creation process');
  logger(`[createOrder] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  logger(`[createOrder] Order details: ${JSON.stringify(params)}`);
  const headers = await client.getHeaders();
  const url = `${client.getBaseUrl()}/v2/checkout/orders`;
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
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof getOrderParameters>>
): Promise<any> => {
  logger('[getOrder] Starting order retrieval process');
  logger(`[getOrder] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  logger(`[getOrder] Order ID: ${params.id}`);

  const headers = await client.getHeaders();
  logger('[getOrder] Headers obtained');

  const url = `${client.getBaseUrl()}/v2/checkout/orders/${params.id}`;
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
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof captureOrderParameters>>
) => {
  try {
    logger(`[captureOrder] Starting order capture process with params: ${JSON.stringify(params)}`);
    const url = `${client.getBaseUrl()}/v2/checkout/orders/${params.id}/capture`;
    const response = await axios.post(url, {}, {
      headers: await client.getHeaders()
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
  client: PayPalClient,
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

  const headers = await client.getHeaders();
  logger('[createShipment] Headers obtained');

  const url = `${client.getBaseUrl()}/v1/shipping/trackers-batch`;
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

  logger(`[createShipment] Trackers params: ${JSON.stringify(trackersData)}`);

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
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof getShipmentTrackingParameters>>
) {
  logger('[getShipmentTracking] Starting to get shipment tracking information');
  logger(`[getShipmentTracking] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  const {
    transaction_id: providedTransactionId,
    order_id
  } = params;
  logger(`[getShipmentTracking] Tracking details: transaction_id=${providedTransactionId}, order_id=${order_id}`);

  const headers = await client.getHeaders();
  logger('[getShipmentTracking] Headers obtained');

  let transaction_id = providedTransactionId;

  // Check if order_id is provided and transaction_id is not.
  if (order_id && !providedTransactionId) {
    logger('[getShipmentTracking] order_id provided but transaction_id is missing. Attempting to extract transaction_id from order details.');
    try {
      const orderDetails = await getOrder(client, context, { id: order_id });

      if (orderDetails && orderDetails.purchase_units && orderDetails.purchase_units.length > 0) {
        const purchaseUnit = orderDetails.purchase_units[0];

        if (purchaseUnit.payments && purchaseUnit.payments.captures && purchaseUnit.payments.captures.length > 0) {
          const captureDetails = purchaseUnit.payments.captures[0];
          transaction_id = captureDetails.id;
          logger(`[getShipmentTracking] transaction_id extracted from order details: ${transaction_id}`);

        } else {
          throw new Error("Could not find capture id in the purchase unit details.")
        }
      }

      else {
        throw new Error("Could not find purchase unit details in order details.")
      }

    } catch (error: any) {
      logger(`[getShipmentTracking] Error extracting transaction_id from order details: ${error.message}`);
      throw new Error(`Error extracting transaction_id from order details: ${error.message}`);
    }
  } else if (!providedTransactionId) {
    throw new Error("Either transaction_id or order_id must be provided.");
  }


  const url = `${client.getBaseUrl()}/v1/shipping/trackers?transaction_id=${transaction_id}`;
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

export async function listDisputes(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof listDisputesParameters>>
): Promise<any> {
  logger('[listDisputes] Starting to list disputes');
  logger(`[listDisputes] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);

  const headers = await client.getHeaders();
  logger('[listDisputes] Headers obtained');

  const url = `${client.getBaseUrl()}/v1/customer/disputes?${toQueryString(params)}`;
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
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof getDisputeParameters>>
): Promise<any> {
  logger(`[getDispute] Starting to get dispute details for ID: ${params.dispute_id}`);
  logger(`[getDispute] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);

  const { dispute_id } = params

  const headers = await client.getHeaders();
  logger('[getDispute] Headers obtained');

  const url = `${client.getBaseUrl()}/v1/customer/disputes/${dispute_id}`;
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
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof acceptDisputeClaimParameters>>
): Promise<any> {
  logger('[acceptClaim] Starting to list disputes');
  logger(`[acceptClaim] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);

  const headers = await client.getHeaders();
  logger('[acceptClaim] Headers obtained');

  const url = `${client.getBaseUrl()}/v1/customer/disputes/${params.dispute_id}/accept-claim`;
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
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof listTransactionsParameters>>
): Promise<any> {
  logger('[listTransactions] Starting to list transactions');
  logger(`[listTransactions] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);

  const headers = await client.getHeaders();
  logger('[listTransactions] Headers obtained');

  // If we're looking for a specific transaction by ID
  if (params.transaction_id) {
    logger(`[listTransactions] Searching for transaction with ID: ${params.transaction_id}`);
    
    // Set maximum number of months to search back
    const searchMonths = params.search_months || 12;
    logger(`[listTransactions] Will search up to ${searchMonths} months back for the transaction`);
    
    // Start searching from current date
    const endDate = new Date();
    let startDate = new Date();
    startDate.setDate(endDate.getDate() - 31); // Start with the past 31 days
    
    // For each month, query the transactions until we find the one we're looking for
    for (let month = 0; month < searchMonths; month++) {
      const queryParams = { ...params };
      // Delete search_months parameter before sending to the API
      // @ts-expect-error
      delete queryParams.search_months;
      queryParams.end_date = endDate.toISOString();
      queryParams.start_date = startDate.toISOString();
      
      logger(`[listTransactions] Searching month ${month + 1}: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // Construct URL for API call
      const url = `${client.getBaseUrl()}/v1/reporting/transactions?${toQueryString(queryParams)}`;
      logger(`[listTransactions] API URL: ${url}`);
      
      try {
        logger('[listTransactions] Sending request to PayPal API');
        const response = await axios.get(url, { headers, params: queryParams });
        logger(`[listTransactions] Transactions retrieved successfully. Status: ${response.status}`);
        
        // Check if our transaction is in the results
        if (response.data && response.data.transaction_details && response.data.transaction_details.length > 0) {
          const foundTransaction = response.data.transaction_details.find(
            (transaction: any) => transaction.transaction_info.transaction_id === params.transaction_id
          );
          
          if (foundTransaction) {
            logger(`[listTransactions] Found transaction with ID: ${params.transaction_id}`);
            return {
              found: true,
              transaction_details: [foundTransaction],
              total_items: 1
            };
          }
        }
        
        // Move back one month for the next search
        endDate.setTime(startDate.getTime());
        startDate.setMonth(startDate.getMonth() - 1);
        
      } catch (error: any) {
        logger(`[listTransactions] Error searching transactions for month ${month + 1}:`, error.message);
        // Continue to next month instead of failing completely
      }
    }
    
    // If we've gone through all months and haven't found the transaction
    logger(`[listTransactions] Transaction with ID ${params.transaction_id} not found after searching ${searchMonths} months`);
    return {
      found: false,
      transaction_details: [],
      total_items: 0,
      message: `The transaction ID ${params.transaction_id} was not found in the last ${searchMonths} months. Please verify the transaction ID and try again, or let me know if there's anything else I can assist you with!`
    };
  } else {
    // Original behavior for listing transactions without a specific ID
    const queryParams = { ...params };
    // Delete search_months parameter before sending to the API
    // @ts-expect-error
    delete queryParams.search_months;
    
    if (!queryParams.end_date && !queryParams.start_date) {
      queryParams.end_date = new Date().toISOString();
      queryParams.start_date = new Date(new Date().getTime() - (31 * 24 * 60 * 60 * 1000)).toISOString();
    } else if (!queryParams.end_date) {
      const startDate = new Date(queryParams.start_date as string);
      queryParams.end_date = new Date(startDate.getTime() + (31 * 24 * 60 * 60 * 1000)).toISOString();
    } else if (!queryParams.start_date) {
      const endDate = new Date(queryParams.end_date as string);
      queryParams.start_date = new Date(endDate.getTime() - (31 * 24 * 60 * 60 * 1000)).toISOString();
    } else {
      const startDate = new Date(queryParams.start_date as string);
      const endDate = new Date(queryParams.end_date as string);
      const dayRange = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
      
      if (dayRange > 31) {
        // Reset start_date time if range > 31
        queryParams.start_date = new Date(endDate.getTime() - (31 * 24 * 60 * 60 * 1000)).toISOString();
      }
    }

    const url = `${client.getBaseUrl()}/v1/reporting/transactions?${toQueryString(queryParams)}`;
    logger(`[listTransactions] API URL: ${url}`);

    try {
      logger('[listTransactions] Sending request to PayPal API');
      const response = await axios.get(url, { headers, params: queryParams });
      logger(`[listTransactions] Transactions retrieved successfully. Status: ${response.status}`);
      return response.data;
    } catch (error: any) {
      logger('[listTransactions] Error listing transactions:', error.message);
      handleAxiosError(error);
    }
  }
}

export async function createPaymentLink(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof createPaymentLinkParameters>>
): Promise<any> {
  try {
    logger(`[createPaymentLink] Starting create a payment link process with Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
    if(process.env.PAYPAL_ENVIRONMENT?.toUpperCase() !== 'SANDBOX') {
      return {
        status: "error",
        response: "This is a limited release and only supports specific accounts on sandbox at the moment"
      };
    }
    const request = {
      "type": "BUY_NOW",
      "items": [
        {
          "name": params.item_name,
          "description": params.description,
          "max_allowed_quantity": params.quantity,
          "amount": {
            "currency_code": params.currency_code,
            "value": params.value
          }
        }
      ]
    }
    const url = `${client.getBaseUrl()}/v1/checkout/payment-links`;

    const response = await axios.post(url, request, {
      headers: await client.getHeaders()
    });
    if (response.status <= 299) {
      logger(`[createPaymentLink] Payment link created successfully. Status: ${response.status}`);
      return {
        status: "success",
        response: response.data
      };
    } else {
      logger(`[createPaymentLink] Payment link creation failed. Status: ${response.status}`);
      return {
        status: "error",
        response: response.data
      };
    }
  } catch (error: any) {
    logger('[createPaymentLink] Error creating a payment link:', error.message);
    handleAxiosError(error);
  }
}

export async function getPaymentLinkByID(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof getPaymentLinkParameters>>
): Promise<any> {
  logger('[getPaymentLinkByID] Starting to get a payment link by ID');
  logger(`[getPaymentLinkByID] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  if(process.env.PAYPAL_ENVIRONMENT !== 'Sandbox') {
    return {
      status: "error",
      response: "This is a limited release and only supports specific accounts on sandbox at the moment"
    };
  }

  const url = `${client.getBaseUrl()}/v1/checkout/payment-links/${params.link_id}`;
  logger(`[getPaymentLinkByID] API URL: ${url}`);

  try {
    logger('[getPaymentLinkByID] Sending request to PayPal API');
    const response = await axios.get(url, {
      headers: await client.getHeaders()
    });
    logger(`[getPaymentLinkByID] Payment link retrieved successfully. Status: ${response.status}`);
    return { status: "success", data: response.data };
  } catch (error: any) {
    logger('[getPaymentLinkByID] Error getting the payment link:', error.message);
    handleAxiosError(error);
  }
}

export async function updatePaymentLink(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof updatePaymentLinkParameters>>
): Promise<any> {
  logger('[updatePaymentLink] Starting to update a payment link');
  logger(`[updatePaymentLink] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  if(process.env.PAYPAL_ENVIRONMENT?.toUpperCase() !== 'SANDBOX') {
    return {
      status: "error",
      response: "This is a limited release and only supports specific accounts on sandbox at the moment"
    };
  }

  const url = `${client.getBaseUrl()}/v1/checkout/payment-links/${params.link_id}`;
  logger(`[updatePaymentLink] API URL: ${url}`);

  const request = [];

        if(params.item_name) {
            request.push({
                "op": "replace",
                "path": "/details/items/0/name",
                "value": params.item_name
            });
        }

        if(params.currency_code || params.value) {
            request.push({ 
                "op": "replace",
                "path": "/details/items/0/amount",
                "value": {
                    ...(params.currency_code && { currency_code: params.currency_code }),
                    ...(params.value && { value: params.value })
                }
            });
        }

        if(params.description) {
            request.push({
                "op": "add",
                "path": "/details/items/0/description",
                "value": params.description
            });
        }

        if(params.quantity) {
            request.push({
                "op": "add",
                "path": "/details/items/0/max_allowed_quantity",
                "value": params.quantity
            });
        }

  try {
    logger('[updatePaymentLink] Sending request to PayPal API');
    const response = await axios.patch(url, request, {
      headers: await client.getHeaders()
    });
    logger(`[updatePaymentLink] payment link updated successfully. Status: ${response.status}`);
    return { status: "success", data: response.data };
  } catch (error: any) {
    logger('[updatePaymentLink] Error updating the payment link:', error.message);
    handleAxiosError(error);
  }
}

export async function getAllPaymentLinks(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof getAllPaymentLinksParameters>>): Promise<any> {
  logger('[getAllPaymentLinks] Starting to get all payment links');
  logger(`[getAllPaymentLinks] Context: ${JSON.stringify({ sandbox: context.sandbox, merchant_id: context.merchant_id })}`);
  if(process.env.PAYPAL_ENVIRONMENT?.toUpperCase() !== 'SANDBOX') {
    return {
      status: "error",
      response: "This is a limited release and only supports specific accounts on sandbox at the moment"
    };
  }

  const url = `${client.getBaseUrl()}/v1/checkout/payment-links?limit=20`;
  logger(`[getAllPaymentLinks] API URL: ${url}`);

  try {
    logger('[getAllPaymentLinks] Sending request to PayPal API', params);
    const response = await axios.get(url, {
      headers: await client.getHeaders()
    });
    logger(`[getAllPaymentLinks] Payment links retrieved successfully. Status: ${response.status}`);
    return { status: "success", data: response.data };
  } catch (error: any) {
    logger('[getAllPaymentLinks] Error getting payment links:', error.message);
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


