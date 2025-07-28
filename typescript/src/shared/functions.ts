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
  getRefundParameters,
  createRefundParameters,
  updateSubscriptionParameters,
  updatePlanParameters,
  getMerchantInsightsParameters
} from "./parameters";
import {parseOrderDetails, parseUpdateSubscriptionPayload, toQueryString} from "./payloadUtils";
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

      // Automatically send the invoice with specific parameters
      logger('[createInvoice] Automatically sending invoice with thank you note');
      try {
        const sendResult = await sendInvoice(client, context, {
          invoice_id: invoiceId,
          note: "thank you for choosing us. If there are any issues, feel free to contact us",
          send_to_recipient: true
        });

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

  const headers = await client.getHeaders();
  logger('[listInvoices] Headers obtained');

  const url = `${client.getBaseUrl()}/v2/invoicing/invoices`;
  logger(`[listInvoices] API URL: ${url}`);

  // Make API call
  try {
    logger('[listInvoices] Sending request to PayPal API');
    const response = await axios.get(url, { headers, params });
    logger(`[listInvoices] Invoices retrieved successfully. Status: ${response.status}`);

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

  const headers = await client.getHeaders();
  logger('[getInvoice] Headers obtained');

  const url = `${client.getBaseUrl()}/v2/invoicing/invoices/${params.invoice_id}`;

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
  const {
    invoice_id,
    note,
    subject,
    additional_recipients,
  } = params;

  const headers = await client.getHeaders();
  logger('[sendInvoiceReminder] Headers obtained');

  const url = `${client.getBaseUrl()}/v2/invoicing/invoices/${invoice_id}/remind`;

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
  
  const {
    invoice_id,
    note,
    send_to_recipient,
    additional_recipients,
  } = params;

  const headers = await client.getHeaders();
  logger('[cancelSentInvoice] Headers obtained');

  const url = `${client.getBaseUrl()}/v2/invoicing/invoices/${invoice_id}/cancel`;

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
  const { subscription_id, get_additional_details } = params;
  const apiUrl = `${client.getBaseUrl()}/v1/billing/subscriptions/${subscription_id}${get_additional_details? "?fields=plan" : ""}`;

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

  try {
    const response = await axios.post(apiUrl, payload, { headers });
    return response.data;
  } catch (error) {
    // @ts-ignore
    console.error("Error Creating Subscription:", error.response?.data || error);
    throw error;
  }
}

export async function updateSubscription(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof updateSubscriptionParameters>>){

  const headers = await client.getHeaders();
  const { subscription_id } = params;
  try {
    const subscriptionDetails = await showSubscriptionDetails(client, context, { subscription_id, get_additional_details: true});
    const operations = parseUpdateSubscriptionPayload(params, subscriptionDetails);
    const apiUrl = `${client.getBaseUrl()}/v1/billing/subscriptions/${subscription_id}`;
    const response = await axios.patch(apiUrl, operations, { headers });
    return response.data;
  } catch(error: any){
    logger('[updateSubscription] Error updating subscription:', JSON.stringify(error.message));
    handleAxiosError(error);
  }
}


// === ORDER FUNCTIONS ===

export const createOrder = async (
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof createOrderParameters>>
): Promise<any> => {
  logger('[createOrder] Starting order creation process');
  console.log("hi")
  const headers = await client.getHeaders();
  console.log("headers", headers)
  const url = `${client.getBaseUrl()}/v2/checkout/orders`;
  console.log("url", url)
  const schema = createOrderParameters(context);
  console.log("schema", schema)
  const parsedParams = schema.parse(params);
  console.log("parsedParans", parsedParams)
  const orderRequest = parseOrderDetails(parsedParams);
  console.log("orderRequest", orderRequest)
  try {
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
  const {
    tracking_number,
    transaction_id,
    status,
    carrier
  } = params;
  
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
  const {
    transaction_id: providedTransactionId,
    order_id
  } = params;
 
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

  const headers = await client.getHeaders();
  logger('[listDisputes] Headers obtained');

  const url = `${client.getBaseUrl()}/v1/customer/disputes?${toQueryString(params)}`;

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


  export async function createRefund(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof createRefundParameters>>
): Promise<any> {
  logger(`[createRefund] Starting to refund capture for ID: ${params.capture_id}`);

  const { capture_id } = params;

  const headers = await client.getHeaders();
  logger('[createRefund] Headers obtained');

  const url = `${client.getBaseUrl()}/v2/payments/captures/${capture_id}/refund`;
  logger(`[createRefund] API URL: ${url}`);

  try {
    logger('[createRefund] Sending request to PayPal API');
    const response = await axios.post(url, params, { headers });
    logger(`[createRefund] Capture refunded successfully. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    logger(`[createRefund] Error refunding capture for ID: ${capture_id}:`, error.message);
    handleAxiosError(error);
  }
}

export async function getRefund(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof getRefundParameters>>
): Promise<any> {
  logger(`[getRefund] Starting to get refund details for ID: ${params.refund_id}`);

  const { refund_id } = params;

  const headers = await client.getHeaders();
  logger('[getRefund] Headers obtained');

  const url = `${client.getBaseUrl()}/v2/payments/refunds/${refund_id}`;
  logger(`[getRefund] API URL: ${url}`);

  try {
    logger('[getRefund] Sending request to PayPal API');
    const response = await axios.get(url, { headers });
    logger(`[getRefund] Refund details retrieved successfully. Status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    logger(`[getRefund] Error retrieving refund details for ID: ${refund_id}:`, error.message);
    handleAxiosError(error);
  }
}

export async function updatePlan(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof updatePlanParameters>>
) {
  const planId = params.plan_id;
  if (!planId) {
    logger('[updatePlan] No plan_id provided.');
    return "No plan_id provided.";
  }

  // Check if the plan exists using showSubscriptionPlanDetails
  const planDetails = await showSubscriptionPlanDetails(client, context, { plan_id: planId });

  if (!planDetails || planDetails.error || planDetails.status === 'RESOURCE_NOT_FOUND') {
    logger(`[updatePlan] Plan Id ${planId} not available.`);
    return "Plan Id not available";
  }

  // Map of optional parameter keys to their JSON Patch paths
  const optionalKeysToPaths: Record<string, string> = {
    description: '/description',
    auto_bill_outstanding: '/payment_preferences/auto_bill_outstanding',
    percentage: '/taxes/percentage',
    payment_failure_threshold: '/payment_preferences/payment_failure_threshold',
    setup_fee: '/payment_preferences/setup_fee',
    setup_fee_failure_action: '/payment_preferences/setup_fee_failure_action',
    name: '/name'
  };

  // Collect received optional parameters
  const receivedParams: Record<string, unknown> = {};
  for (const key of Object.keys(optionalKeysToPaths)) {
    if (params[key as keyof typeof params] !== undefined) {
      receivedParams[key] = params[key as keyof typeof params];
    }
  }


  if (Object.keys(receivedParams).length === 0) {
    logger('[updatePlan] No params to patch.');
    return "No params to patch";
  }

  // Helper to check if a nested property exists in planDetails
  function hasNestedProperty(obj: any, path: string): boolean {
    return path
      .replace(/^\//, '')
      .split('/')
      .reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj) !== undefined;
  }

  // Build patch operations array using 'replace' or 'add' as needed
  const patchOperations = Object.entries(receivedParams).map(([key, value]) => {
    const path = optionalKeysToPaths[key];
    const op = hasNestedProperty(planDetails, path) ? 'replace' : 'add';
    return { op, path, value };
  });

  const headers = await client.getHeaders();
  const apiUrl = `${client.getBaseUrl()}/v1/billing/plans/${planId}`;

  try {
    const response = await axios.patch(apiUrl, patchOperations, { headers });
    return response.data;
  } catch (error: any) {
    logger('[updatePlan] Error updating plan:', error.message);
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

export async function getMerchantInsights(
  client: PayPalClient,
  context: Context,
  params: TypeOf<ReturnType<typeof getMerchantInsightsParameters>>
): Promise<any> {

  const { start_date, end_date, insight_type, time_interval } = params

  const headers = await client.getHeaders();
  logger('[getMerchantInsights] Headers obtained');

  const url = `${client.getBaseUrl()}/v1/merchants/insights?start_date=${start_date}&end_date=${end_date}&insight_type=${insight_type}&time_interval=${time_interval}`;
  try {
    const response = await axios.get(url, { headers: headers });
    return response.data;
  } catch (error: any) {
    logger('[updatePlan] Error retrieving insights:', error.message);
    handleAxiosError(error);
  }
}