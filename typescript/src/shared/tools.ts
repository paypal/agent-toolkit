import { z } from 'zod';

import {
  createInvoicePrompt,
  listInvoicesPrompt,
  getInvoicePrompt,
  sendInvoicePrompt,
  sendInvoiceReminderPrompt,
  cancelSentInvoicePrompt,
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
  createProductPrompt,
  listProductsPrompt,
  showProductDetailsPrompt,
  updateProductPrompt,
  createSubscriptionPlanPrompt,
  listSubscriptionPlansPrompt,
  showSubscriptionPlanDetailsPrompt,
  createSubscriptionPrompt,
  showSubscriptionDetailsPrompt,
  cancelSubscriptionPrompt,
  updatePlanPrompt,
  updateSubscriptionPrompt,
  getRefundPrompt,
  createRefundPrompt,
  // UBB prompts
  getUBBMetricsPrompt,
  createUBBMetricPrompt,
  getUBBMetricByIdPrompt,
  updateUBBMetricPrompt,
  deleteUBBMetricPrompt,
  getUBBPlansPrompt,
  createUBBPlanPrompt,
  getUBBPlanByIdPrompt,
  updateUBBPlanPrompt,
  getUBBCustomersPrompt,
  createUBBCustomerPrompt,
  getUBBCustomerByIdPrompt,
  updateUBBCustomerPrompt,
  deleteUBBCustomerPrompt,
  getUBBCustomerCurrentUsagePrompt,
  getUBBCustomerPastUsagePrompt,
  getUBBSubscriptionsPrompt,
  createUBBSubscriptionPrompt,
  getUBBSubscriptionByIdPrompt,
  updateUBBSubscriptionPrompt,
  cancelUBBSubscriptionPrompt,
  getUBBEventsPrompt,
  createUBBEventPrompt,
  createUBBEventsBatchPrompt,
} from './prompts';

import {
  createInvoiceParameters,
  listInvoicesParameters,
  getInvoicParameters,
  sendInvoiceParameters,
  sendInvoiceReminderParameters,
  cancelSentInvoiceParameters,
  createShipmentParameters,
  getShipmentTrackingParameters,
  generateInvoiceQrCodeParameters,
  createOrderParameters,
  getOrderParameters,
  getDisputeParameters,
  listDisputesParameters,
  acceptDisputeClaimParameters,
  captureOrderParameters,
  listTransactionsParameters,
  createProductParameters,
  listProductsParameters,
  updateProductParameters,
  showProductDetailsParameters,
  createSubscriptionPlanParameters,
  listSubscriptionPlansParameters,
  showSubscriptionPlanDetailsParameters,
  createSubscriptionParameters,
  showSubscriptionDetailsParameters,
  cancelSubscriptionParameters,
  updatePlanParameters,
  updateSubscriptionParameters,
  getRefundParameters,
  createRefundParameters,
  // UBB parameters
  getUBBMetricsParameters,
  createUBBMetricParameters,
  getUBBMetricByIdParameters,
  updateUBBMetricParameters,
  deleteUBBMetricParameters,
  getUBBPlansParameters,
  createUBBPlanParameters,
  getUBBPlanByIdParameters,
  updateUBBPlanParameters,
  getUBBCustomersParameters,
  createUBBCustomerParameters,
  getUBBCustomerByIdParameters,
  updateUBBCustomerParameters,
  deleteUBBCustomerParameters,
  getUBBCustomerCurrentUsageParameters,
  getUBBCustomerPastUsageParameters,
  getUBBSubscriptionsParameters,
  createUBBSubscriptionParameters,
  getUBBSubscriptionByIdParameters,
  updateUBBSubscriptionParameters,
  cancelUBBSubscriptionParameters,
  getUBBEventsParameters,
  createUBBEventParameters,
  createUBBEventsBatchParameters,
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
    method: 'generate_invoice_qr_code',
    name: 'Generate Invoice QR Code',
    description: generateInvoiceQrCodePrompt(context),
    parameters: generateInvoiceQrCodeParameters(context),
    actions: {
      invoices: {
        generateQRC: true,
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
    method: 'show_product_details',
    name: 'Show Products Details',
    description: showProductDetailsPrompt(context),
    parameters: showProductDetailsParameters(context),
    actions: {
      products: {
        show: true,
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
    method: 'show_subscription_plan_details',
    name: 'Show Subscription Plan Details',
    description: showSubscriptionPlanDetailsPrompt(context),
    parameters: showSubscriptionPlanDetailsParameters(context),
    actions: {
      subscriptionPlans: {
        show: true,
      },
    },
  },
  {
    method: 'create_subscription',
    name: 'Create Subscription',
    description: createSubscriptionPrompt(context),
    parameters: createSubscriptionParameters(context),
    actions: {
      subscriptions: {
        create: true,
      },
    },
  },
  {
    method: 'show_subscription_details',
    name: 'Show Subscription Details',
    description: showSubscriptionDetailsPrompt(context),
    parameters: showSubscriptionDetailsParameters(context),
    actions: {
      subscriptions: {
        show: true,
      },
    },
  },
  {
    method: 'cancel_subscription',
    name: 'Cancel Subscription',
    description: cancelSubscriptionPrompt(context),
    parameters: cancelSubscriptionParameters(context),
    actions: {
      subscriptions: {
        cancel: true,
      },
    },
  },
  {
    method: 'update_subscription',
    name: 'Update Subscription',
    description: updateSubscriptionPrompt(context),
    parameters: updateSubscriptionParameters(context),
    actions: {
      subscriptions: {
        update: true,
      },
    },
  },
  {
    method: 'create_shipment_tracking',
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
    method: 'pay_order',
    name: 'Process payment for an authorized order',
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
  {
    method: 'update_plan',
    name: 'Update Plan',
    description: updatePlanPrompt(context),
    parameters: updatePlanParameters(context),
    actions: {
      plan: {
        update: true,
      },
    },
  },
  {
    method: 'create_refund',
    name: 'Create Refund',
    description: createRefundPrompt(context),
    parameters: createRefundParameters(context),
    actions: {
      payments: {
        createRefund: true,
      },
    },
  },
  {
    method: 'get_refund',
    name: 'Get Refund',
    description: getRefundPrompt(context),
    parameters: getRefundParameters(context),
    actions: {
      payments: {
        getRefunds: true,
      },
    },
  },
  // UBB tools
  {
    method: 'get_ubb_metrics',
    name: 'Get UBB Metrics',
    description: getUBBMetricsPrompt(context),
    parameters: getUBBMetricsParameters(context),
    actions: {
      ubbMetrics: {
        list: true,
      },
    },
  },
  {
    method: 'create_ubb_metric',
    name: 'Create UBB Metric',
    description: createUBBMetricPrompt(context),
    parameters: createUBBMetricParameters(context),
    actions: {
      ubbMetrics: {
        create: true,
      },
    },
  },
  {
    method: 'get_ubb_metric_by_id',
    name: 'Get UBB Metric By ID',
    description: getUBBMetricByIdPrompt(context),
    parameters: getUBBMetricByIdParameters(context),
    actions: {
      ubbMetrics: {
        get: true,
      },
    },
  },
  {
    method: 'update_ubb_metric',
    name: 'Update UBB Metric',
    description: updateUBBMetricPrompt(context),
    parameters: updateUBBMetricParameters(context),
    actions: {
      ubbMetrics: {
        update: true,
      },
    },
  },
  {
    method: 'delete_ubb_metric',
    name: 'Delete UBB Metric',
    description: deleteUBBMetricPrompt(context),
    parameters: deleteUBBMetricParameters(context),
    actions: {
      ubbMetrics: {
        delete: true,
      },
    },
  },
  {
    method: 'get_ubb_plans',
    name: 'Get UBB Plans',
    description: getUBBPlansPrompt(context),
    parameters: getUBBPlansParameters(context),
    actions: {
      ubbPlans: {
        list: true,
      },
    },
  },
  {
    method: 'create_ubb_plan',
    name: 'Create UBB Plan',
    description: createUBBPlanPrompt(context),
    parameters: createUBBPlanParameters(context),
    actions: {
      ubbPlans: {
        create: true,
      },
    },
  },
  {
    method: 'get_ubb_plan_by_id',
    name: 'Get UBB Plan By ID',
    description: getUBBPlanByIdPrompt(context),
    parameters: getUBBPlanByIdParameters(context),
    actions: {
      ubbPlans: {
        get: true,
      },
    },
  },
  {
    method: 'update_ubb_plan',
    name: 'Update UBB Plan',
    description: updateUBBPlanPrompt(context),
    parameters: updateUBBPlanParameters(context),
    actions: {
      ubbPlans: {
        update: true,
      },
    },
  },
  {
    method: 'get_ubb_customers',
    name: 'Get UBB Customers',
    description: getUBBCustomersPrompt(context),
    parameters: getUBBCustomersParameters(context),
    actions: {
      ubbCustomers: {
        list: true,
      },
    },
  },
  {
    method: 'create_ubb_customer',
    name: 'Create UBB Customer',
    description: createUBBCustomerPrompt(context),
    parameters: createUBBCustomerParameters(context),
    actions: {
      ubbCustomers: {
        create: true,
      },
    },
  },
  {
    method: 'get_ubb_customer_by_id',
    name: 'Get UBB Customer By ID',
    description: getUBBCustomerByIdPrompt(context),
    parameters: getUBBCustomerByIdParameters(context),
    actions: {
      ubbCustomers: {
        get: true,
      },
    },
  },
  {
    method: 'update_ubb_customer',
    name: 'Update UBB Customer',
    description: updateUBBCustomerPrompt(context),
    parameters: updateUBBCustomerParameters(context),
    actions: {
      ubbCustomers: {
        update: true,
      },
    },
  },
  {
    method: 'delete_ubb_customer',
    name: 'Delete UBB Customer',
    description: deleteUBBCustomerPrompt(context),
    parameters: deleteUBBCustomerParameters(context),
    actions: {
      ubbCustomers: {
        delete: true,
      },
    },
  },
  {
    method: 'get_ubb_customer_current_usage',
    name: 'Get UBB Customer Current Usage',
    description: getUBBCustomerCurrentUsagePrompt(context),
    parameters: getUBBCustomerCurrentUsageParameters(context),
    actions: {
      ubbCustomerUsage: {
        getCurrent: true,
      },
    },
  },
  {
    method: 'get_ubb_customer_past_usage',
    name: 'Get UBB Customer Past Usage',
    description: getUBBCustomerPastUsagePrompt(context),
    parameters: getUBBCustomerPastUsageParameters(context),
    actions: {
      ubbCustomerUsage: {
        getPast: true,
      },
    },
  },
  {
    method: 'get_ubb_subscriptions',
    name: 'Get UBB Subscriptions',
    description: getUBBSubscriptionsPrompt(context),
    parameters: getUBBSubscriptionsParameters(context),
    actions: {
      ubbSubscriptions: {
        list: true,
      },
    },
  },
  {
    method: 'create_ubb_subscription',
    name: 'Create UBB Subscription',
    description: createUBBSubscriptionPrompt(context),
    parameters: createUBBSubscriptionParameters(context),
    actions: {
      ubbSubscriptions: {
        create: true,
      },
    },
  },
  {
    method: 'get_ubb_subscription_by_id',
    name: 'Get UBB Subscription By ID',
    description: getUBBSubscriptionByIdPrompt(context),
    parameters: getUBBSubscriptionByIdParameters(context),
    actions: {
      ubbSubscriptions: {
        get: true,
      },
    },
  },
  {
    method: 'update_ubb_subscription',
    name: 'Update UBB Subscription',
    description: updateUBBSubscriptionPrompt(context),
    parameters: updateUBBSubscriptionParameters(context),
    actions: {
      ubbSubscriptions: {
        update: true,
      },
    },
  },
  {
    method: 'cancel_ubb_subscription',
    name: 'Cancel UBB Subscription',
    description: cancelUBBSubscriptionPrompt(context),
    parameters: cancelUBBSubscriptionParameters(context),
    actions: {
      ubbSubscriptions: {
        cancel: true,
      },
    },
  },
  {
    method: 'get_ubb_events',
    name: 'Get UBB Events',
    description: getUBBEventsPrompt(context),
    parameters: getUBBEventsParameters(context),
    actions: {
      ubbEvents: {
        list: true,
      },
    },
  },
  {
    method: 'create_ubb_event',
    name: 'Create UBB Event',
    description: createUBBEventPrompt(context),
    parameters: createUBBEventParameters(context),
    actions: {
      ubbEvents: {
        create: true,
      },
    },
  },
  {
    method: 'create_ubb_events_batch',
    name: 'Create UBB Events Batch',
    description: createUBBEventsBatchPrompt(context),
    parameters: createUBBEventsBatchParameters(context),
    actions: {
      ubbEvents: {
        createBatch: true,
      },
    },
  }
];
const allActions = tools({}).reduce((acc, tool) => {
  Object.keys(tool.actions).forEach(product => {
    acc[product] = { ...acc[product], ...tool.actions[product] };
  });
  return acc;
}, {} as { [key: string]: { [key: string]: boolean } });

export const ALL_TOOLS_ENABLED = allActions;

export default tools;
