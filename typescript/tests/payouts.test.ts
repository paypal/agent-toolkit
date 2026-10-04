import axios from 'axios';
import { zodToJsonSchema } from 'zod-to-json-schema';
import PayPalAPI from '../src/shared/api';
import { isToolAllowed } from '../src/shared/configuration';
import tools, { ALL_TOOLS_ENABLED } from '../src/shared/tools';
import { createPayoutBatchParameters } from '../src/shared/parameters';
import PayPalAgentToolkit from '../src/modelcontextprotocol/toolkit';
import PayPalMCPToolkit from '../src/modelcontextprotocol/mcpToolkit';

jest.mock('axios', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));

const mockedAxios = jest.mocked(axios);

const BASE_URL = 'https://api.sandbox.paypal.com';
const PAYOUT_BATCH_ID = '5UXD2E8A7EBQJ';
const PAYOUT_ITEM_ID = '8AELMXH8UB2P8';

const payoutBatchParams = () => ({
  sender_batch_header: {
    sender_batch_id: 'Payouts_2026_10_04_001',
    recipient_type: 'EMAIL',
    email_subject: 'You have a payout!',
  },
  items: [
    {
      receiver: 'seller@example.com',
      amount: { currency: 'USD', value: '12.34' },
      note: 'Thanks for selling with us!',
      sender_item_id: 'seller-42',
    },
  ],
});

const runTool = async (method: string, params: unknown, context = {}) => {
  const api = new PayPalAPI('test-access-token', { sandbox: true, ...context });
  return JSON.parse(await api.run(method, params));
};

beforeEach(() => {
  jest.resetAllMocks();
  mockedAxios.post.mockResolvedValue({ status: 201, data: { batch_header: { payout_batch_id: PAYOUT_BATCH_ID, batch_status: 'PENDING' } } });
  mockedAxios.get.mockResolvedValue({ status: 200, data: { payout_item_id: PAYOUT_ITEM_ID, transaction_status: 'UNCLAIMED' } });
});

describe('create_payout_batch', () => {
  it('posts the payout request', async () => {
    const result = await runTool('create_payout_batch', payoutBatchParams());

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${BASE_URL}/v1/payments/payouts`,
      payoutBatchParams(),
      { headers: expect.objectContaining({ Authorization: 'Bearer test-access-token' }) },
    );
    expect(result.batch_header.payout_batch_id).toBe(PAYOUT_BATCH_ID);
  });

  it('drops fields that are not part of the payout request', async () => {
    await runTool('create_payout_batch', { ...payoutBatchParams(), paypal_request_id: '3f2b7c1e-other-key' });

    const [, body] = mockedAxios.post.mock.calls[0];
    expect(body).not.toHaveProperty('paypal_request_id');
  });

  it.each(['-10.00', 'ten', '', '1e3', '0', '0.00', '.0', '10.'])('rejects the amount %p before calling PayPal', async (value) => {
    const params = payoutBatchParams();
    params.items[0].amount.value = value;

    const result = await runTool('create_payout_batch', params);

    expect(result.error.type).toBe('paypal_error');
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it.each(['10', '0.01', '.5', '10.123456'])('leaves the precision of %p to PayPal', async (value) => {
    const params = payoutBatchParams();
    params.items[0].amount.value = value;

    await runTool('create_payout_batch', params);

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('requires at least one item', async () => {
    const result = await runTool('create_payout_batch', { ...payoutBatchParams(), items: [] });

    expect(result.error.type).toBe('paypal_error');
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('requires a recipient_type on the header or on every item', async () => {
    const params = { ...payoutBatchParams(), sender_batch_header: { sender_batch_id: 'Payouts_2026_10_04_001' } };

    const result = await runTool('create_payout_batch', params);

    expect(result.error.message).toContain('recipient_type');
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('returns PayPal API errors to the agent', async () => {
    mockedAxios.post.mockRejectedValue({
      response: { status: 422, headers: {}, data: { name: 'INSUFFICIENT_FUNDS', message: 'Sender does not have sufficient funds.' } },
    });

    const result = await runTool('create_payout_batch', payoutBatchParams());

    expect(result).toMatchObject({ ok: false, status: 422, code: 'PAYPAL_API_HTTP_ERROR', message: 'Sender does not have sufficient funds.' });
  });

  it('tells the agent when the sender_batch_id was already used', async () => {
    mockedAxios.post.mockRejectedValue({
      response: {
        status: 400,
        headers: {},
        data: {
          name: 'USER_BUSINESS_ERROR',
          message: 'User business error.',
          details: [{ field: 'SENDER_BATCH_ID', location: 'body', issue: 'Batch with given sender_batch_id already exists' }],
        },
      },
    });

    const result = await runTool('create_payout_batch', payoutBatchParams());

    expect(result).toMatchObject({ status: 400, message: 'User business error.: Batch with given sender_batch_id already exists' });
  });

  it('has a fully inlined JSON schema', () => {
    const schema = JSON.stringify(zodToJsonSchema(createPayoutBatchParameters({})));

    expect(schema).not.toContain('$ref');
  });
});

describe('get_payout_batch', () => {
  it('requests the first page with totals by default', async () => {
    await runTool('get_payout_batch', { payout_batch_id: PAYOUT_BATCH_ID });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${BASE_URL}/v1/payments/payouts/${PAYOUT_BATCH_ID}?page=1&page_size=100&total_required=true`,
      expect.anything(),
    );
  });

  it('forwards paging', async () => {
    await runTool('get_payout_batch', { payout_batch_id: PAYOUT_BATCH_ID, page: 3, page_size: 50, total_required: false });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${BASE_URL}/v1/payments/payouts/${PAYOUT_BATCH_ID}?page=3&page_size=50&total_required=false`,
      expect.anything(),
    );
  });
});

describe('get_payout_item', () => {
  it('gets the payout item', async () => {
    const result = await runTool('get_payout_item', { payout_item_id: PAYOUT_ITEM_ID });

    expect(mockedAxios.get).toHaveBeenCalledWith(`${BASE_URL}/v1/payments/payouts-item/${PAYOUT_ITEM_ID}`, expect.anything());
    expect(result.transaction_status).toBe('UNCLAIMED');
  });
});

describe('cancel_unclaimed_payout_item', () => {
  it('cancels the payout item', async () => {
    await runTool('cancel_unclaimed_payout_item', { payout_item_id: PAYOUT_ITEM_ID });

    expect(mockedAxios.post).toHaveBeenCalledWith(`${BASE_URL}/v1/payments/payouts-item/${PAYOUT_ITEM_ID}/cancel`, {}, expect.anything());
  });
});

describe('payout requests', () => {
  it.each([
    ['create_payout_batch', payoutBatchParams()],
    ['get_payout_batch', { payout_batch_id: PAYOUT_BATCH_ID }],
    ['get_payout_item', { payout_item_id: PAYOUT_ITEM_ID }],
    ['cancel_unclaimed_payout_item', { payout_item_id: PAYOUT_ITEM_ID }],
  ])('%s does not send a request_id set on the context', async (method, params) => {
    await runTool(method, params, { request_id: 'context-wide-id' });

    const calls = [...mockedAxios.post.mock.calls, ...mockedAxios.get.mock.calls];
    expect(calls).toHaveLength(1);
    const config: any = calls[0][calls[0].length - 1];
    expect(config.headers).not.toHaveProperty('PayPal-Request-Id');
  });

  it.each([
    ['get_payout_batch', { payout_batch_id: '../../v1/oauth2/token' }],
    ['get_payout_batch', { payout_batch_id: 'A'.repeat(31) }],
    ['get_payout_item', { payout_item_id: '' }],
    ['cancel_unclaimed_payout_item', { payout_item_id: '8AELMXH8UB2P8/../../x' }],
  ])('%s rejects the ID in %p before calling PayPal', async (method, params) => {
    const result = await runTool(method, params);

    expect(result.error.type).toBe('paypal_error');
    expect(mockedAxios.get).not.toHaveBeenCalled();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});

describe('payouts actions', () => {
  it('only exposes the payout tools that are enabled', () => {
    const configuration = { actions: { payouts: { get: true, getItem: true } } };

    const enabled = tools({}).filter((tool) => isToolAllowed(tool, configuration)).map((tool) => tool.method);

    expect(enabled).toEqual(['get_payout_batch', 'get_payout_item']);
  });

  it('leaves the payout tools that move funds out of ALL_TOOLS_ENABLED', () => {
    expect(ALL_TOOLS_ENABLED.payouts).toEqual({ get: true, getItem: true });
  });

  it('does not register create_payout_batch on MCP servers configured with ALL_TOOLS_ENABLED', () => {
    const configuration = { actions: ALL_TOOLS_ENABLED, context: { sandbox: true } };

    const remoteTools = new PayPalMCPToolkit({ accessToken: 'test-access-token', configuration }).getTools().map((tool) => tool.method);
    const server: any = new PayPalAgentToolkit({ accessToken: 'test-access-token', configuration });
    const registeredTools = Object.keys(server._registeredTools);

    for (const methods of [remoteTools, registeredTools]) {
      expect(methods).toEqual(expect.arrayContaining(['get_payout_batch', 'get_payout_item']));
      expect(methods).not.toContain('create_payout_batch');
      expect(methods).not.toContain('cancel_unclaimed_payout_item');
    }
  });
});
