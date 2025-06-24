import { z } from 'zod';
import { StructuredTool } from '@langchain/core/tools';
import {CallbackManagerForToolRun} from '@langchain/core/callbacks/manager';
import { RunnableConfig } from '@langchain/core/runnables';
import PayPalAPI from '../shared/api';

class PayPalTool extends StructuredTool {
  PayPalAPI: PayPalAPI;
  method: string;
  name: string;
  description: string;
  schema: z.ZodObject<any, any, any, any>;

  constructor(
    PayPalAPI: PayPalAPI,
    method: string, 
    name: string,
    description: string,
    schema: z.ZodObject<any, any, any, any, {[x: string]: any}>
  ) {
    super();
    this.PayPalAPI = PayPalAPI;
    this.method = method;
    this.name = name;
    this.description = description;
    this.schema = schema;
  }

  _call(
    arg: z.output<typeof this.schema>,
    _runManager?: CallbackManagerForToolRun,
    _parentConfig?: RunnableConfig,
  ): Promise<any> {
    return this.PayPalAPI.run(this.method, arg);
  }
}

export default PayPalTool;