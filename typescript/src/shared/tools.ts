import { z } from 'zod';

import {
  createInvoicePrompt,
  createRecurringSeriesPrompt,
  activateRecurringSeriesPrompt,
  getRecurringSeriesPrompt,
  cancelRecurringSeriesPrompt,
  deleteRecurringSeriesPrompt,
  listInvoicesPrompt,
  getInvoicePrompt,
  sendInvoicePrompt,
  sendInvoiceReminderPrompt,
  cancelSentInvoicePrompt,
  deleteInvoicePrompt,
  setupInvoiceAutoReminderPrompt,
  updateInvoiceAutoReminderPrompt,
  searchInvoicingPrompt,
  updateInvoicingPrompt,
  cancelInvoiceAutoReminderPrompt,
  createShipmentPrompt,
  getShipmentTrackingPrompt,
  generateInvoiceQrCodePrompt,
  generateInvoiceNumberPrompt,
  recordPaymentForInvoicePrompt,
  recordRefundForInvoicePrompt,
  createConditionalRulesForInvoicePrompt,
  createOrderPrompt,
  getOrderPrompt,
  updateShipmentTrackingPrompt,
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
  getMerchantInsightsPrompt
} from './prompts';

import {
  createInvoiceParameters,
  createRecurringSeriesParameters,
  activateRecurringSeriesParameters,
  getRecurringSeriesParameters,
  cancelRecurringSeriesParameters,
  deleteRecurringSeriesParameters,
  listInvoicesParameters,
  getInvoicParameters,
  sendInvoiceParameters,
  sendInvoiceReminderParameters,
  cancelSentInvoiceParameters,
  deleteInvoiceParameters,
  setupInvoiceAutoReminderParameters,
  updateInvoiceAutoReminderParameters,
  searchInvoicingParameters,
  updateInvoicingParameters,
  cancelInvoiceAutoReminderParameters,
  createShipmentParameters,
  getShipmentTrackingParameters,
  generateInvoiceQrCodeParameters,
  generateInvoiceNumberParameters,
  recordPaymentForInvoiceParameters,
  recordRefundForInvoiceParameters,
  createConditionalRulesForInvoiceParameters,
  createOrderParameters,
  getOrderParameters,
  updateShipmentTrackingParameters,
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
  getMerchantInsightsParameters
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
    method: 'create_recurring_series',
    name: 'Create Recurring Invoice Series',
    description: createRecurringSeriesPrompt(context),
    parameters: createRecurringSeriesParameters(context),
    actions: {
      invoices: {
        createRecurringSeries: true,
      },
    },
  },
  {
    method: 'activate_recurring_series',
    name: 'Activate Recurring Invoice Series',
    description: activateRecurringSeriesPrompt(context),
    parameters: activateRecurringSeriesParameters(context),
    actions: {
      invoices: {
        activateRecurringSeries: true,
      },
    },
  },
  {
    method: 'get_recurring_series',
    name: 'Get Recurring Invoice Series',
    description: getRecurringSeriesPrompt(context),
    parameters: getRecurringSeriesParameters(context),
    actions: {
      invoices: {
        getRecurringSeries: true,
      },
    },
  },
  {
    method: 'cancel_recurring_series',
    name: 'Cancel Recurring Invoice Series',
    description: cancelRecurringSeriesPrompt(context),
    parameters: cancelRecurringSeriesParameters(context),
    actions: {
      invoices: {
        cancelRecurringSeries: true,
      },
    },
  },
  {
    method: 'delete_recurring_series',
    name: 'Delete Recurring Invoice Series',
    description: deleteRecurringSeriesPrompt(context),
    parameters: deleteRecurringSeriesParameters(context),
    actions: {
      invoices: {
        deleteRecurringSeries: true,
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
    method: 'delete_invoice',
    name: 'Delete Invoice',
    description: deleteInvoicePrompt(context),
    parameters: deleteInvoiceParameters(context),
    actions: {
      invoices: {
        delete: true,
      },
    },
  },
  {
    method: 'setup_invoice_auto_reminders',
    name: 'Setup Invoice Auto Reminders',
    description: setupInvoiceAutoReminderPrompt(context),
    parameters: setupInvoiceAutoReminderParameters(context),
    actions: {
      invoices: {
        setupReminders: true,
      },
    },
  },
  {
    method: 'update_invoice_auto_reminder',
    name: 'Update Invoice Auto Reminder',
    description: updateInvoiceAutoReminderPrompt(context),
    parameters: updateInvoiceAutoReminderParameters(context),
    actions: {
      invoices: {
        updateReminder: true,
      },
    },
  },
  {
    method: 'search_invoicing',
    name: 'Search Invoices or Recurring Invoice Series',
    description: searchInvoicingPrompt(context),
    parameters: searchInvoicingParameters(context),
    actions: {
      invoices: {
        search: true,
      },
    },
  },
  {
    method: 'update_invoicing',
    name: 'Update Invoice or Recurring Invoice Series',
    description: updateInvoicingPrompt(context),
    parameters: updateInvoicingParameters(context),
    actions: {
      invoices: {
        update: true,
      },
    },
  },
  {
    method: 'cancel_invoice_auto_reminder',
    name: 'Cancel Invoice Auto Reminder',
    description: cancelInvoiceAutoReminderPrompt(context),
    parameters: cancelInvoiceAutoReminderParameters(context),
    actions: {
      invoices: {
        cancelReminders: true,
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
    method: 'generate_invoice_number',
    name: 'Generate Invoice Number',
    description: generateInvoiceNumberPrompt(context),
    parameters: generateInvoiceNumberParameters(context),
    actions: {
      invoices: {
        generateInvoiceNumber: true,
      },
    },
  },
  {
    method: 'record_payment_for_invoice',
    name: 'Record Payment For Invoice',
    description: recordPaymentForInvoicePrompt(context),
    parameters: recordPaymentForInvoiceParameters(context),
    actions: {
      invoices: {
        recordPayment: true,
      },
    },
  },
  {
    method: 'record_refund_for_invoice',
    name: 'Record Refund For Invoice',
    description: recordRefundForInvoicePrompt(context),
    parameters: recordRefundForInvoiceParameters(context),
    actions: {
      invoices: {
        recordRefund: true,
      },
    },
  },
  {
    method: 'create_conditional_rules_for_invoice',
    name: 'Create Conditional Rules For Invoice',
    description: createConditionalRulesForInvoicePrompt(context),
    parameters: createConditionalRulesForInvoiceParameters(context),
    actions: {
      invoices: {
        createConditionalRules: true,
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
    method: `update_shipment_tracking`,
    name: `Update Shipment Tracking`,
    description: updateShipmentTrackingPrompt(context),
    parameters: updateShipmentTrackingParameters(context),
    actions: {
      shipment: {
        update: true,
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
  {
    method: 'get_merchant_insights',
    name: 'Get Merchant Insights',
    description: getMerchantInsightsPrompt(context),
    parameters: getMerchantInsightsParameters(context),
    actions: {
      insights: {
        get: true,
      }
    }
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
