import axios from 'axios';
import { acceptDisputeClaimParameters } from '../parameters';
import { acceptDisputeClaim } from '../functions';
import type PayPalClient from '../client';

const fakeClient = {
  getBaseUrl: () => 'https://api.sandbox.paypal.com',
  getHeaders: async () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
} as unknown as PayPalClient;

afterEach(() => jest.restoreAllMocks());

describe('accept_dispute_claim', () => {
  it('accepts an ordinary note (spaces and punctuation)', () => {
    const r = acceptDisputeClaimParameters({}).safeParse({
      dispute_id: 'PP-D-12345',
      note: 'Customer is right, refunding in full.',
    });
    expect(r.error?.issues).toBeUndefined();
    expect(r.success).toBe(true);
  });

  it('validates dispute_id, and caps note at the 2000 characters PayPal allows', () => {
    const params = acceptDisputeClaimParameters({});
    expect(params.safeParse({ dispute_id: 'PP-D-1/../x', note: 'ok' }).success).toBe(false);
    expect(params.safeParse({ dispute_id: 'PP-D-1', note: '' }).success).toBe(false);
    expect(params.safeParse({ dispute_id: 'PP-D-1', note: 'x'.repeat(2001) }).success).toBe(false);
  });

  it('sends dispute_id and note only in the path and body, never in the query string', async () => {
    const post = jest.spyOn(axios, 'post').mockResolvedValue({ status: 200, data: {} });
    await acceptDisputeClaim(fakeClient, {}, { dispute_id: 'PP-D-12345', note: 'Refunding' });

    const [url, body, config] = post.mock.calls[0];
    const sentUrl = axios.getUri({ url, params: config?.params });
    expect(sentUrl).toBe('https://api.sandbox.paypal.com/v1/customer/disputes/PP-D-12345/accept-claim');
    expect(body).toEqual({ note: 'Refunding' });
  });
});
