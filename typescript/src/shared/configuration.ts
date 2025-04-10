export type Context = {
  merchant_id?: string;
  sandbox?: boolean;
  access_token?: string;
  request_id?: string;
  tenant_context?: any;
  debug?: boolean;
  [key: string]: any;
};

export type Configuration = {
  actions: {
    [product: string]: {
      [action: string]: boolean;
    };
  };
  context?: Context;
};

export function isToolAllowed(
  tool: { actions: { [key: string]: { [action: string]: boolean } } },
  configuration: Configuration
): boolean {
  for (const product in tool.actions) {
    for (const action in tool.actions[product]) {
      if (
        configuration.actions[product] &&
        configuration.actions[product][action]
      ) {
        return true;
      }
    }
  }
  return false;
}
