import axios from 'axios';
import { parseUpdateSubscriptionPayload } from '../payloadUtils';
import { updateSubscription } from '../functions';
import type PayPalClient from '../client';

jest.mock('axios');

const mockedAxios = jest.mocked(axios);
const subscriptionId = 'I-BW452GLLEP1G';
const paramsForCycle = (sequence: number) => ({
  subscription_id: subscriptionId,
  currency_code: 'USD' as const,
  fixed_price: { sequence, value: '12.00' },
});
const priceOperation = (sequence: number) => ({
  op: 'replace',
  path: `/plan/billing_cycles/@sequence==${sequence}/pricing_scheme/fixed_price`,
  value: { currency_code: 'USD', value: '12.00' },
});

describe('subscription billing-cycle updates', () => {
  beforeEach(() => jest.resetAllMocks());

  test.each([1, 2, 3])('preserves the input for cycle %i', (sequence) => {
    const params = paramsForCycle(sequence);

    expect(parseUpdateSubscriptionPayload(params, {})).toEqual([priceOperation(sequence)]);
    expect(params).toEqual(paramsForCycle(sequence));
  });

  test('reusing the same input produces the same billing-cycle patch', () => {
    const params = paramsForCycle(2);

    const first = parseUpdateSubscriptionPayload(params, {});
    const second = parseUpdateSubscriptionPayload(params, {});

    expect(first).toEqual([priceOperation(2)]);
    expect(second).toEqual(first);
  });

  test('accepts a frozen input and nested price without mutation', () => {
    const params = Object.freeze({
      ...paramsForCycle(2),
      fixed_price: Object.freeze({ sequence: 2, value: '12.00' }),
    });

    expect(parseUpdateSubscriptionPayload(params, {})).toEqual([priceOperation(2)]);
    expect(params.fixed_price.sequence).toBe(2);
  });

  test('retry after a lost response keeps the same billing-cycle target', async () => {
    const params = paramsForCycle(2);
    const headers = { 'Content-Type': 'application/json' };
    const client = {
      getBaseUrl: () => 'https://offline.invalid',
      getHeaders: jest.fn().mockResolvedValue(headers),
    } as unknown as PayPalClient;
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: { id: subscriptionId, status: 'ACTIVE' },
    });
    mockedAxios.patch
      .mockRejectedValueOnce(Object.assign(new Error('synthetic lost response'), {
        request: {}, code: 'ETIMEDOUT',
      }))
      .mockResolvedValueOnce({ status: 204, data: '' });

    await expect(updateSubscription(client, {}, params)).rejects.toMatchObject({
      code: 'PAYPAL_API_NO_RESPONSE',
    });
    await expect(updateSubscription(client, {}, params)).resolves.toBe('');

    expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
    for (const call of mockedAxios.patch.mock.calls) {
      expect(call).toEqual([
        `https://offline.invalid/v1/billing/subscriptions/${subscriptionId}`,
        [priceOperation(2)],
        { headers },
      ]);
    }
    expect(params).toEqual(paramsForCycle(2));
  });
});
