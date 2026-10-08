import axios from 'axios';
import PayPalClient from '../client';
import { captureOrder, createOrder, createRefund, getOrder } from '../functions';

jest.mock('axios');
const mocked = axios as jest.Mocked<typeof axios>;

const ORDER_ID = '5O190127TN364715T';
const CAPTURE_ID = '2GG279541U471931P';
const order = {
  currencyCode: 'USD' as const,
  items: [{ name: 'Water bottle', quantity: 1, itemCost: 24, taxPercent: 0, itemTotal: 24 }],
};

/** The PayPal-Request-Id header of the nth call to a mocked axios method. */
const requestIdOf = (method: jest.Mock, call: number) =>
  method.mock.calls[call]?.[2]?.headers?.['PayPal-Request-Id'] ??
  method.mock.calls[call]?.[1]?.headers?.['PayPal-Request-Id'];

const client = (context: Record<string, unknown> = {}) =>
  new PayPalClient({ context: { sandbox: true, ...context }, accessToken: 'test-token' });

beforeEach(() => {
  jest.resetAllMocks();
  mocked.post.mockResolvedValue({ status: 201, data: { id: ORDER_ID } });
  mocked.get.mockResolvedValue({ status: 200, data: { id: ORDER_ID } });
});

describe('PayPal-Request-Id', () => {
  it('sends the caller’s request_id when creating an order', async () => {
    const paypal = client();
    await createOrder(paypal, {}, { ...order, request_id: 'purchase-42' } as any);
    expect(requestIdOf(mocked.post as jest.Mock, 0)).toBe('purchase-42');
  });

  it('gives each new order its own key, even with a client-wide request_id', async () => {
    const paypal = client({ request_id: 'one-for-the-whole-client' });
    await createOrder(paypal, {}, order as any);
    await createOrder(paypal, {}, order as any);
    const first = requestIdOf(mocked.post as jest.Mock, 0);
    const second = requestIdOf(mocked.post as jest.Mock, 1);
    expect(first).toBeTruthy();
    expect(first).not.toBe(second);
    expect(first).not.toBe('one-for-the-whole-client');
  });

  it('keys a capture on its order, so a retried capture is the same request', async () => {
    const paypal = client();
    await captureOrder(paypal, {}, { id: ORDER_ID });
    await captureOrder(paypal, {}, { id: ORDER_ID });
    expect(requestIdOf(mocked.post as jest.Mock, 0)).toBe(`capture-${ORDER_ID}`);
    expect(requestIdOf(mocked.post as jest.Mock, 1)).toBe(`capture-${ORDER_ID}`);
  });

  it('lets the caller choose the capture key', async () => {
    await captureOrder(client(), {}, { id: ORDER_ID, request_id: 'capture-attempt-2' });
    expect(requestIdOf(mocked.post as jest.Mock, 0)).toBe('capture-attempt-2');
  });

  it('keys a refund on its capture, amount and invoice, so a retried refund is the same request', async () => {
    const paypal = client();
    const partial = {
      capture_id: CAPTURE_ID,
      amount: { currency_code: 'USD', value: '20.00' },
      invoice_id: 'INV-7',
    };
    await createRefund(paypal, {}, partial as any);
    await createRefund(paypal, {}, partial as any);
    const key = `refund-${CAPTURE_ID}-20.00-USD-INV-7`;
    expect(requestIdOf(mocked.post as jest.Mock, 0)).toBe(key);
    expect(requestIdOf(mocked.post as jest.Mock, 1)).toBe(key);
  });

  it('gives different refunds of one capture different keys', async () => {
    const paypal = client();
    await createRefund(paypal, {}, { capture_id: CAPTURE_ID } as any);
    await createRefund(paypal, {}, {
      capture_id: CAPTURE_ID,
      amount: { currency_code: 'USD', value: '5.00' },
    } as any);
    expect(requestIdOf(mocked.post as jest.Mock, 0)).toBe(`refund-${CAPTURE_ID}-full`);
    expect(requestIdOf(mocked.post as jest.Mock, 1)).toBe(`refund-${CAPTURE_ID}-5.00-USD`);
  });

  it('lets the caller choose the refund key, and never sends it to PayPal in the body', async () => {
    await createRefund(client(), {}, {
      capture_id: CAPTURE_ID,
      amount: { currency_code: 'USD', value: '20.00' },
      request_id: 'second-refund-on-purpose',
    } as any);
    expect(requestIdOf(mocked.post as jest.Mock, 0)).toBe('second-refund-on-purpose');
    expect((mocked.post as jest.Mock).mock.calls[0]?.[1]).toEqual({
      amount: { currency_code: 'USD', value: '20.00' },
    });
  });

  it('leaves every other call as it was', async () => {
    await getOrder(client({ request_id: 'configured' }), {}, { id: ORDER_ID });
    expect(requestIdOf(mocked.get as jest.Mock, 0)).toBe('configured');
  });
});
