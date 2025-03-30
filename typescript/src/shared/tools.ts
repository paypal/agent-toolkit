import { z } from 'zod';

import {
  createInvoicePrompt,
  listInvoicesPrompt,
  sendInvoicePrompt,
  sendInvoiceReminderPrompt,
  cancelSentInvoicePrompt,
  createProductPrompt,
  listProductsPrompt,
  updateProductPrompt,
  createSubscriptionPlanPrompt,
  listSubscriptionPlansPrompt,
} from './prompts';

import {
  createInvoiceParameters,
  listInvoicesParameters,
  sendInvoiceParameters,
  sendInvoiceReminderParameters,
  cancelSentInvoiceParameters,
  createProductParameters,
  listProductsParameters,
  updateProductParameters,
  createSubscriptionPlanParameters,
  listSubscriptionPlansParameters,
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
];

export default tools;
