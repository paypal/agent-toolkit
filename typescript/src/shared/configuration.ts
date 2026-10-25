export type Context = {
  merchant_id?: string;
  sandbox?: boolean;
  access_token?: string;
  request_id?: string;
  tenant_context?: any;
  debug?: boolean;
  // Verifier behind the verify_agent_purchase tool; see AgentPurchaseVerifier.
  agentPurchaseVerifier?: AgentPurchaseVerifier;
  [key: string]: any;
};

// Read-only PayPal GET over the toolkit's own HTTP layer, handed to the verifier. Errors are
// returned, not thrown, so the verifier can fail closed. The shape matches @readback/verify's
// PayPalClient.get(path, schema).
export type PayPalGetResult<T> =
  | { ok: true; status: number; data: T; debugId: string | null }
  | { ok: false; status: number; issues: string[]; debugId: string | null };
export type PayPalGet = <T = unknown>(
  path: string,
  schema?: { safeParse(value: unknown): { success: true; data: T } | { success: false } }
) => Promise<PayPalGetResult<T>>;

// Rebuilds an agent purchase from PayPal (dispute -> capture -> order -> vault payment token)
// and returns a verdict. TODO(@readback/verify@^0.1.0, unpublished): the intended default is
//   (id, paypal, now) => verifyCase(id, paypal, now)  from '@readback/verify'
// It is ESM-only and needs Node >= 22.18, while this package also ships CJS for node18, so it
// would be loaded with a dynamic import(); until it is on npm, callers inject it here.
export type AgentPurchaseVerifier = (
  id: string,
  paypal: { get: PayPalGet },
  now: Date
) => Promise<unknown>;

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
