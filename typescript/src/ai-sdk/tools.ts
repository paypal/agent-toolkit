import type { Tool } from 'ai';
import { tool } from 'ai';
import { z } from 'zod';
import PayPalAPI from '../shared/api';

export default function PayPalTool(
  payPalApi: PayPalAPI,
  method: string,
  description: string,
  schema: z.ZodObject<any, any, any, any, { [x: string]: any }>
): Tool {
  return tool({
    description: description,
    parameters: schema,
    execute: (arg: z.output<typeof schema>) => {
      return payPalApi.run(method, arg);
    },
  });
}