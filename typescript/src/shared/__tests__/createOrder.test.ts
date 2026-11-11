import axios from 'axios';
import PayPalClient from '../client';
import { createOrder } from '../functions';

jest.mock('axios');
const mocked = axios as jest.Mocked<typeof axios>;

const order = {
  currencyCode: 'USD' as const,
  items: [{ name: 'Water bottle', quantity: 1, itemCost: 24, taxPercent: 0, itemTotal: 24 }],
};

const client = () => new PayPalClient({ context: { sandbox: true }, accessToken: 'test-token' });

/** The body of the nth order sent to PayPal. */
const sentOrder = (call = 0) => (mocked.post as jest.Mock).mock.calls[call]?.[1];

beforeEach(() => {
  jest.resetAllMocks();
  mocked.post.mockResolvedValue({ status: 201, data: { id: '5O190127TN364715T' } });
});

describe('create_order', () => {
  it('creates a CAPTURE order with no custom_id by default', async () => {
    await createOrder(client(), {}, order as any);
    expect(sentOrder().intent).toBe('CAPTURE');
    expect(sentOrder().purchase_units[0]).not.toHaveProperty('custom_id');
  });

  it('creates an AUTHORIZE order when asked to', async () => {
    await createOrder(client(), {}, { ...order, intent: 'AUTHORIZE' } as any);
    expect(sentOrder().intent).toBe('AUTHORIZE');
  });

  it('sends customId as the purchase unit custom_id', async () => {
    await createOrder(client(), {}, { ...order, customId: 'cart-8f14e45f' } as any);
    expect(sentOrder().purchase_units[0].custom_id).toBe('cart-8f14e45f');
  });

  it('rejects an intent PayPal does not support', async () => {
    await expect(createOrder(client(), {}, { ...order, intent: 'SALE' } as any)).rejects.toThrow();
    expect(mocked.post).not.toHaveBeenCalled();
  });

  it('rejects a customId longer than PayPal accepts', async () => {
    await expect(
      createOrder(client(), {}, { ...order, customId: 'x'.repeat(256) } as any),
    ).rejects.toThrow();
    expect(mocked.post).not.toHaveBeenCalled();
  });
});
