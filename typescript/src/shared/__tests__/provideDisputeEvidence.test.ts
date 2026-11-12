import axios from 'axios';
import { provideDisputeEvidence } from '../functions';
import { provideDisputeEvidenceParameters } from '../parameters';
import tools from '../tools';
import type PayPalClient from '../client';

const BASE = 'https://api.sandbox.paypal.com/v1/customer/disputes/PP-D-12345';
const fakeClient = {
  getBaseUrl: () => 'https://api.sandbox.paypal.com',
  getHeaders: async () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
} as unknown as PayPalClient;

function disputeOffering(...rels: string[]) {
  return jest.spyOn(axios, 'get').mockResolvedValue({
    status: 200,
    data: { dispute_id: 'PP-D-12345', links: [{ rel: 'self' }, ...rels.map((rel) => ({ rel }))] },
  });
}

const params = { dispute_id: 'PP-D-12345', evidence_type: 'BILLING_AGREEMENT' as const, notes: 'Signed by the approved agent key.' };

async function inputPart(form: unknown): Promise<unknown> {
  const part = (form as FormData).get('input') as Blob;
  expect(part.type).toBe('application/json');
  return JSON.parse(await part.text());
}

afterEach(() => jest.restoreAllMocks());

describe('provide_dispute_evidence', () => {
  it('posts multipart provide-evidence when the dispute offers it', async () => {
    const get = disputeOffering('provide_evidence', 'provide_supporting_info');
    const post = jest.spyOn(axios, 'post').mockResolvedValue({ status: 200, data: { links: [] } });

    const out = await provideDisputeEvidence(fakeClient, {}, params);

    expect(get).toHaveBeenCalledWith(BASE, expect.anything());
    const [url, form, config] = post.mock.calls[0];
    expect(url).toBe(`${BASE}/provide-evidence`);
    expect(form).toBeInstanceOf(FormData);
    expect(config?.headers).not.toHaveProperty('Content-Type');
    expect(config?.params).toBeUndefined();
    expect(await inputPart(form)).toEqual({ evidences: [{ evidence_type: 'BILLING_AGREEMENT', notes: params.notes }] });
    expect(out).toEqual({ action: 'provide_evidence', response: { links: [] } });
  });

  it('falls back to provide-supporting-info (notes only) when that is all PayPal offers', async () => {
    disputeOffering('provide_supporting_info', 'send_message');
    const post = jest.spyOn(axios, 'post').mockResolvedValue({ status: 200, data: {} });

    const out = await provideDisputeEvidence(fakeClient, {}, {
      ...params,
      documents: [{ name: 'receipt.pdf', content_type: 'application/pdf', content_base64: Buffer.from('%PDF-1.4').toString('base64') }],
    });

    const [url, form] = post.mock.calls[0];
    expect(url).toBe(`${BASE}/provide-supporting-info`);
    expect(await inputPart(form)).toEqual({ notes: params.notes });
    const file = (form as FormData).get('supporting document') as File;
    expect(file.name).toBe('receipt.pdf');
    expect(await file.text()).toBe('%PDF-1.4');
    expect(out.action).toBe('provide_supporting_info');
  });

  it('fails clearly and posts nothing when PayPal offers neither action', async () => {
    disputeOffering('accept_claim', 'send_message');
    const post = jest.spyOn(axios, 'post');

    await expect(provideDisputeEvidence(fakeClient, {}, params)).rejects.toMatchObject({
      code: 'DISPUTE_ACTION_NOT_OFFERED',
      message: expect.stringContaining('Offered: accept_claim, send_message'),
    });
    expect(post).not.toHaveBeenCalled();
  });

  it('accepts only real PayPal evidence types', () => {
    const schema = provideDisputeEvidenceParameters({});
    expect(schema.safeParse(params).success).toBe(true);
    expect(schema.safeParse({ ...params, evidence_type: 'PROOF_OF_AUTHORIZATION' }).success).toBe(false);
  });

  it('is registered as a disputes tool', () => {
    expect(tools({}).find((t) => t.method === 'provide_dispute_evidence')?.actions).toEqual({ disputes: { create: true } });
  });
});
