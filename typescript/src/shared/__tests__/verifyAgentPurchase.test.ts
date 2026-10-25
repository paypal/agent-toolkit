import axios from 'axios';
import { verifyAgentPurchase } from '../functions';
import tools from '../tools';
import { verifyAgentPurchaseParameters } from '../parameters';
import type { AgentPurchaseVerifier } from '../configuration';
import type PayPalClient from '../client';

const API = 'https://api.sandbox.paypal.com';
const fakeClient = {
  getBaseUrl: () => API,
  getHeaders: async () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
} as unknown as PayPalClient;

// Minimal PayPal objects for one agent purchase.
const records: Record<string, unknown> = {
  '/v1/customer/disputes/PP-D-12345': { dispute_id: 'PP-D-12345', disputed_transactions: [{ seller_transaction_id: 'CAP0000000000001' }] },
  '/v2/payments/captures/CAP0000000000001': { id: 'CAP0000000000001', supplementary_data: { related_ids: { order_id: 'ORDER00000000001' } } },
  '/v2/checkout/orders/ORDER00000000001': { id: 'ORDER00000000001', purchase_units: [{ custom_id: 'rb1:TOKEN1:x:p001:y' }] },
  '/v3/vault/payment-tokens/TOKEN1': { id: 'TOKEN1', payment_source: { paypal: { description: 'terms' } } },
};

// Stands in for @readback/verify's verifyCase: walks the chain through the injected get().
const stubVerifier: AgentPurchaseVerifier = async (id, paypal) => {
  const dispute = await paypal.get<any>(`/v1/customer/disputes/${id}`);
  if (!dispute.ok) return { verdict: 'UNVERIFIED', issues: dispute.issues };
  const capture = await paypal.get<any>(`/v2/payments/captures/${dispute.data.disputed_transactions[0].seller_transaction_id}`);
  if (!capture.ok) return { verdict: 'UNVERIFIED' };
  const order = await paypal.get<any>(`/v2/checkout/orders/${capture.data.supplementary_data.related_ids.order_id}`);
  if (!order.ok) return { verdict: 'UNVERIFIED' };
  const token = await paypal.get<any>(`/v3/vault/payment-tokens/${order.data.purchase_units[0].custom_id.split(':')[1]}`);
  return { verdict: token.ok ? 'SELLER_FAVOR' : 'UNVERIFIED' };
};

function servePayPal() {
  return jest.spyOn(axios, 'get').mockImplementation(async (url: string) => {
    const path = url.slice(API.length);
    if (path in records) return { status: 200, data: records[path], headers: { 'paypal-debug-id': 'dbg1' } };
    throw { response: { status: 404, data: { name: 'RESOURCE_NOT_FOUND', details: [{ issue: 'INVALID_RESOURCE_ID' }] }, headers: {} } };
  });
}

afterEach(() => jest.restoreAllMocks());

describe('verify_agent_purchase', () => {
  it('walks dispute -> capture -> order -> payment token through the toolkit HTTP layer and returns the verdict', async () => {
    const get = servePayPal();
    const out = await verifyAgentPurchase(fakeClient, { agentPurchaseVerifier: stubVerifier }, { id: 'PP-D-12345' });

    expect(out).toEqual({ verdict: 'SELLER_FAVOR' });
    expect(get.mock.calls.map(([url]) => url)).toEqual(Object.keys(records).map((p) => API + p));
    for (const [, config] of get.mock.calls) expect(config?.headers?.Authorization).toBe('Bearer test');
  });

  it('returns PayPal errors to the verifier instead of throwing', async () => {
    servePayPal();
    const out = await verifyAgentPurchase(fakeClient, { agentPurchaseVerifier: stubVerifier }, { id: 'PP-D-99999' });
    expect(out).toEqual({ verdict: 'UNVERIFIED', issues: ['INVALID_RESOURCE_ID'] });
  });

  it('applies the verifier schema and refuses absolute or protocol-relative paths', async () => {
    const get = servePayPal();
    const results: unknown[] = [];
    await verifyAgentPurchase(fakeClient, {
      agentPurchaseVerifier: async (_id, paypal) => {
        results.push(await paypal.get('/v2/payments/captures/CAP0000000000001', { safeParse: () => ({ success: false }) }));
        results.push(await paypal.get('@evil.example/steal'));
        results.push(await paypal.get('//evil.example/steal'));
      },
    }, { id: 'CAP0000000000001' });

    expect(results).toEqual([
      { ok: false, status: 502, issues: ['UNEXPECTED_RESPONSE_SHAPE'], debugId: 'dbg1' },
      { ok: false, status: 400, issues: ['INVALID_PATH'], debugId: null },
      { ok: false, status: 400, issues: ['INVALID_PATH'], debugId: null },
    ]);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('fails clearly when no verifier is configured', async () => {
    await expect(verifyAgentPurchase(fakeClient, {}, { id: 'PP-D-12345' })).rejects.toMatchObject({ code: 'VERIFIER_NOT_CONFIGURED' });
  });

  it('accepts short dispute IDs and capture IDs, rejects path tricks', () => {
    const schema = verifyAgentPurchaseParameters({});
    expect(schema.safeParse({ id: 'PP-D-27803' }).success).toBe(true);
    expect(schema.safeParse({ id: '8MC585209K746392H' }).success).toBe(true);
    expect(schema.safeParse({ id: 'PP-D-1/../../v1/x' }).success).toBe(false);
  });

  it('is registered as a read-only disputes tool only when a verifier is configured', () => {
    expect(tools({ agentPurchaseVerifier: stubVerifier }).find((t) => t.method === 'verify_agent_purchase')?.actions).toEqual({ disputes: { get: true } });
    expect(tools({}).find((t) => t.method === 'verify_agent_purchase')).toBeUndefined();
  });
});
