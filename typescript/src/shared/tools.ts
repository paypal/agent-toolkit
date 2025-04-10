import { z } from 'zod';

import {
  createInvoicePrompt,
  listInvoicesPrompt,
  getInvoicePrompt,
  sendInvoicePrompt,
  sendInvoiceReminderPrompt,
  cancelSentInvoicePrompt,
  createProductPrompt,
  listProductsPrompt,
  updateProductPrompt,
  createSubscriptionPlanPrompt,
  listSubscriptionPlansPrompt,
  createShipmentPrompt,
  getShipmentTrackingPrompt,
  generateInvoiceQrCodePrompt,
  createOrderPrompt,
  getOrderPrompt,
  getDisputePrompt,
  listDisputesPrompt,
  acceptDisputeClaimPrompt,
  captureOrderPrompt,
  listTransactionsPrompt,
} from './prompts';

import {
  createInvoiceParameters,
  listInvoicesParameters,
  getInvoicParameters,
  sendInvoiceParameters,
  sendInvoiceReminderParameters,
  cancelSentInvoiceParameters,
  createProductParameters,
  listProductsParameters,
  updateProductParameters,
  createSubscriptionPlanParameters,
  listSubscriptionPlansParameters,
  createShipmentParameters,
  getShipmentTrackingParameters,
  generateInvoiceQrCodeParameters,
  createOrderParameters,
  getOrderParameters,
  getDisputeParameters,
  listDisputesParameters,
  acceptDisputeClaimParameters,
  captureOrderParameters,
  listTransactionsParameters
} from './parameters';

import type { Context } from './configuration';

export type Tool = {
  method: string;
  name: string;
  description: string;
  parameters: z.ZodObject<any, any, any, any>;
  actions: {
    [key: string]: {
      [action: string]: boolean;
    };
  };
};

const tools = (context: Context): Tool[] => [
  {
    method: 'create_invoice',
    name: 'Create Invoice',
    description: createInvoicePrompt(context),
    parameters: createInvoiceParameters(context),
    actions: {
      invoices: {
        create: true,
      },
    },
  },
  {
    method: 'list_invoices',
    name: 'List Invoices',
    description: listInvoicesPrompt(context),
    parameters: listInvoicesParameters(context),
    actions: {
      invoices: {
        list: true,
      },
    },
  },
  {
    method: 'get_invoice',
    name: 'Get Invoice',
    description: getInvoicePrompt(context),
    parameters: getInvoicParameters(context),
    actions: {
      invoices: {
        get: true,
      },
    },
  },
  {
    method: 'send_invoice',
    name: 'Send Invoice',
    description: sendInvoicePrompt(context),
    parameters: sendInvoiceParameters(context),
    actions: {
      invoices: {
        send: true,
      },
    },
  },
  {
    method: 'send_invoice_reminder',
    name: 'Send Invoice Reminder',
    description: sendInvoiceReminderPrompt(context),
    parameters: sendInvoiceReminderParameters(context),
    actions: {
      invoices: {
        sendReminder: true,
      },
    },
  },
  {
    method: 'cancel_sent_invoice',
    name: 'Cancel Sent Invoice',
    description: cancelSentInvoicePrompt(context),
    parameters: cancelSentInvoiceParameters(context),
    actions: {
      invoices: {
        cancel: true,
      },
    },
  },
  {
    method: 'generate_invoice_qr',
    name: 'Generate Invoice QR Code',
    description: generateInvoiceQrCodePrompt(context),
    parameters: generateInvoiceQrCodeParameters(context),
    actions: {
      invoices: {
        generateQR: true,
      },
    },
  },
  {
    method: 'create_product',
    name: 'Create Product',
    description: createProductPrompt(context),
    parameters: createProductParameters(context),
    actions: {
      products: {
        create: true,
      },
    },
  },
  {
    method: 'list_products',
    name: 'List Products',
    description: listProductsPrompt(context),
    parameters: listProductsParameters(context),
    actions: {
      products: {
        list: true,
      },
    },
  },
  {
    method: 'update_product',
    name: 'Update Product',
    description: updateProductPrompt(context),
    parameters: updateProductParameters(context),
    actions: {
      products: {
        update: true,
      },
    },
  },
  {
    method: 'create_subscription_plan',
    name: 'Create Subscription Plan',
    description: createSubscriptionPlanPrompt(context),
    parameters: createSubscriptionPlanParameters(context),
    actions: {
      subscriptionPlans: {
        create: true,
      },
    },
  },
  {
    method: 'list_subscription_plans',
    name: 'List Subscription Plans',
    description: listSubscriptionPlansPrompt(context),
    parameters: listSubscriptionPlansParameters(context),
    actions: {
      subscriptionPlans: {
        list: true,
      },
    },
  },
  {
    method: 'create_shipment',
    name: 'Create shipment',
    description: createShipmentPrompt(context),
    parameters: createShipmentParameters(context),
    actions: {
      shipment: {
        create: true,
      },
    },
  },
  {
    method: 'get_shipment_tracking',
    name: 'Get Shipment Tracking',
    description: getShipmentTrackingPrompt(context),
    parameters: getShipmentTrackingParameters(context),
    actions: {
      shipment: {
        get: true,
      },
    },
  },
  {
    method: 'create_order',
    name: 'Create Order',
    description: createOrderPrompt(context),
    parameters: createOrderParameters(context),
    actions: {
      orders: {
        create: true,
      },
    },
  },
  {
    method: 'get_order',
    name: 'Get Order',
    description: getOrderPrompt(context),
    parameters: getOrderParameters(context),
    actions: {
      orders: {
        get: true,
      },
    },
  },
  {
    method: 'capture_order',
    name: 'Capture Order',
    description: captureOrderPrompt(context),
    parameters: captureOrderParameters(context),
    actions: {
      orders: {
        capture: true,
      },
    },
  },
  {
    method: 'list_disputes',
    name: 'List Disputes',
    description: listDisputesPrompt(context),
    parameters: listDisputesParameters(context),
    actions: {
      disputes: {
        list: true,
      },
    },
  },
  {
    method: 'get_dispute',
    name: 'Get Dispute',
    description: getDisputePrompt(context),
    parameters: getDisputeParameters(context),
    actions: {
      disputes: {
        get: true,
      },
    },
  },
  {
    method: 'accept_dispute_claim',
    name: 'Accept dispute claim',
    description: acceptDisputeClaimPrompt(context),
    parameters: acceptDisputeClaimParameters(context),
    actions: {
      disputes: {
        create: true,
      },
    },
  },
  {
    method: 'list_transactions',
    name: 'List Transactions',
    description: listTransactionsPrompt(context),
    parameters: listTransactionsParameters(context),
    actions: {
      transactions: {
        list: true,
      },
    },
  },
];
const allActions = tools({}).reduce((acc, tool) => {
  Object.keys(tool.actions).forEach(product => {
    acc[product] = { ...acc[product], ...tool.actions[product] };
  });
  return acc;
}, {} as { [key: string]: { [key: string]: boolean } });

export const ALL_TOOLS_ENABLED = allActions;

export default tools;
