import { z } from 'zod';
import type { Context } from './configuration';

export const createInvoiceParameters = (context: Context) => 
  z.object({
    detail: z.object({}).passthrough().describe('The details dictionary containing information about the merchant, primary recipients, and invoice information.'),
    items: z.array(z.object({}).passthrough()).optional().describe('An array of items that the invoice is for.'),
    invoicer: z.object({}).passthrough().describe('The invoicer name, email address details'),
    primary_recipients: z.array(z.object({}).passthrough().describe('The primary recipients email address details')),
    amount: z.object({}).passthrough().describe('The amount object to be charged - contains taxes, discounts and charges') 
  });

export const listInvoicesParameters = (context: Context) => 
  z.object({
    page: z.number().optional().describe('The page number of the result set to fetch.'),
    page_size: z.number().optional().describe('The number of records to return per page (maximum 100).'),
    total_required: z.boolean().optional().describe('Indicates whether the response should include the total count of items.'),
  });

export const sendInvoiceParameters = (context: Context) => 
  z.object({
    invoice_id: z.string().describe('The ID of the invoice to send.'),
    note: z.string().optional().describe('A note to the recipient.'),
    send_to_recipient: z.boolean().optional().describe('Indicates whether to send the invoice to the recipient.'),
    additional_recipients: z.array(z.string()).optional().describe('Additional email addresses to which to send the invoice.'),
  });

export const sendInvoiceReminderParameters = (context: Context) => 
  z.object({
    invoice_id: z.string().describe('The ID of the invoice for which to send a reminder.'),
    subject: z.string().optional().describe('The subject of the reminder email.'),
    note: z.string().optional().describe('A note to the recipient.'),
    additional_recipients: z.array(z.string()).optional().describe('Additional email addresses to which to send the reminder.'),
  });

export const cancelSentInvoiceParameters = (context: Context) => 
  z.object({
    invoice_id: z.string().describe('The ID of the invoice to cancel.'),
    note: z.string().optional().describe('A cancellation note to the recipient.'),
    send_to_recipient: z.boolean().optional().describe('Indicates whether to send the cancellation to the recipient.'),
    additional_recipients: z.array(z.string()).optional().describe('Additional email addresses to which to send the cancellation.'),
  });

export const createProductParameters = (context: Context) => 
  z.object({
    name: z.string().describe('The product name.'),
    type: z.enum(['PHYSICAL', 'DIGITAL', 'SERVICE']).describe('The product type. Value is PHYSICAL, DIGITAL, or SERVICE.'),
    description: z.string().optional().describe('The product description.'),
    category: z.string().optional().describe('The product category.'),
    image_url: z.string().optional().describe('The image URL for the product.'),
    home_url: z.string().optional().describe('The home page URL for the product.'),
  });

export const listProductsParameters = (context: Context) => 
  z.object({
    page: z.number().optional().describe('The page number of the result set to fetch.'),
    page_size: z.number().optional().describe('The number of records to return per page (maximum 100).'),
    total_required: z.boolean().optional().describe('Indicates whether the response should include the total count of products.'),
  });

export const updateProductParameters = (context: Context) => 
  z.object({
    product_id: z.string().describe('The ID of the product to update.'),
    operations: z.array(z.object({}).passthrough()).describe('The PATCH operations to perform on the product.'),
  });

export const createSubscriptionPlanParameters = (context: Context) => 
  z.object({
    product_id: z.string().describe('The ID of the product for which to create the plan.'),
    name: z.string().describe('The subscription plan name.'),
    billing_cycles: z.array(z.object({}).passthrough()).describe('The billing cycles of the plan.'),
    description: z.string().optional().describe('The subscription plan description.'),
    payment_preferences: z.object({}).passthrough().optional().describe('The payment preferences for the subscription plan.'),
    taxes: z.object({}).passthrough().optional().describe('The tax details.'),
  });

export const listSubscriptionPlansParameters = (context: Context) => 
  z.object({
    product_id: z.string().optional().describe('The ID of the product for which to get subscription plans.'),
    page: z.number().optional().describe('The page number of the result set to fetch.'),
    page_size: z.number().optional().describe('The number of records to return per page (maximum 100).'),
    total_required: z.boolean().optional().describe('Indicates whether the response should include the total count of plans.'),
  });
