const axios = require('axios');
const { PayPalMCPToolkit } = require('@paypal/agent-toolkit/mcp');

// Exercise the built public export, schema, dispatcher, generator and axios serialization.
// Expected values are explicit decimal strings, independent of the generator.
const cases = [
  {"name":"shipping and discount rounding boundaries","input":{"currencyCode":"USD","items":[{"name":"Item","itemCost":1,"quantity":1,"taxPercent":0,"itemTotal":1}],"shippingCost":0.006,"discount":0.004},"expected":{"unitTax":["0"],"itemTotal":"1","taxTotal":"0","shipping":"0.01","discount":"0","amount":"1.01"}},
  {"name":"half-cent unit tax, quantity three","input":{"currencyCode":"USD","items":[{"name":"Small item","itemCost":0.05,"quantity":3,"taxPercent":10,"itemTotal":0.15}]},"expected":{"unitTax":["0.01"],"itemTotal":"0.15","taxTotal":"0.03","shipping":"0","discount":"0","amount":"0.18"}},
  {"name":"below half-cent unit tax","input":{"currencyCode":"USD","items":[{"name":"Small item","itemCost":0.04,"quantity":3,"taxPercent":10,"itemTotal":0.12}]},"expected":{"unitTax":["0"],"itemTotal":"0.12","taxTotal":"0","shipping":"0","discount":"0","amount":"0.12"}},
  {"name":"above half-cent unit tax","input":{"currencyCode":"USD","items":[{"name":"Small item","itemCost":0.06,"quantity":3,"taxPercent":10,"itemTotal":0.18}]},"expected":{"unitTax":["0.01"],"itemTotal":"0.18","taxTotal":"0.03","shipping":"0","discount":"0","amount":"0.21"}},
  {"name":"non-half-cent unit tax","input":{"currencyCode":"USD","items":[{"name":"Small item","itemCost":0.07,"quantity":3,"taxPercent":10,"itemTotal":0.21}]},"expected":{"unitTax":["0.01"],"itemTotal":"0.21","taxTotal":"0.03","shipping":"0","discount":"0","amount":"0.24"}},
  {"name":"whole-cent tax","input":{"currencyCode":"USD","items":[{"name":"Item","itemCost":0.1,"quantity":3,"taxPercent":10,"itemTotal":0.3}]},"expected":{"unitTax":["0.01"],"itemTotal":"0.3","taxTotal":"0.03","shipping":"0","discount":"0","amount":"0.33"}},
  {"name":"ordinary price and percentage","input":{"currencyCode":"USD","items":[{"name":"Item","itemCost":19.99,"quantity":3,"taxPercent":8.25,"itemTotal":59.97}]},"expected":{"unitTax":["1.65"],"itemTotal":"59.97","taxTotal":"4.95","shipping":"0","discount":"0","amount":"64.92"}},
  {"name":"decimal rounding boundary","input":{"currencyCode":"USD","items":[{"name":"Item","itemCost":1.15,"quantity":3,"taxPercent":10,"itemTotal":3.45}]},"expected":{"unitTax":["0.12"],"itemTotal":"3.45","taxTotal":"0.36","shipping":"0","discount":"0","amount":"3.81"}},
  {"name":"multiple lines and quantities","input":{"currencyCode":"USD","items":[{"name":"A","itemCost":0.05,"quantity":3,"taxPercent":10,"itemTotal":0.15},{"name":"B","itemCost":0.04,"quantity":2,"taxPercent":10,"itemTotal":0.08},{"name":"C","itemCost":2.5,"quantity":2,"taxPercent":8,"itemTotal":5}]},"expected":{"unitTax":["0.01","0","0.2"],"itemTotal":"5.23","taxTotal":"0.43","shipping":"0","discount":"0","amount":"5.66"}},
  {"name":"shipping and discount with rounded tax","input":{"currencyCode":"USD","items":[{"name":"Small item","description":"Three items","itemCost":0.05,"quantity":3,"taxPercent":10,"itemTotal":0.15}],"shippingCost":0.1,"discount":0.02,"shippingAddress":{"address_line_1":"1 Example Street","admin_area_2":"Example","country_code":"US"},"returnUrl":"https://example.com/return","cancelUrl":"https://example.com/cancel"},"expected":{"unitTax":["0.01"],"itemTotal":"0.15","taxTotal":"0.03","shipping":"0.1","discount":"0.02","amount":"0.26"}},
  {"name":"untaxed output","input":{"currencyCode":"USD","items":[{"name":"Item","itemCost":12.34,"quantity":2,"taxPercent":0,"itemTotal":24.68}],"shippingCost":1.23,"discount":0.45},"expected":{"unitTax":["0"],"itemTotal":"24.68","taxTotal":"0","shipping":"1.23","discount":"0.45","amount":"25.46"}},
  {"name":"schema quantity and tax defaults","input":{"currencyCode":"USD","items":[{"name":"Item","itemCost":0.29,"itemTotal":0.29}]},"expected":{"unitTax":["0"],"itemTotal":"0.29","taxTotal":"0","shipping":"0","discount":"0","amount":"0.29"}},
  {"name":"explicit zero components and free line","input":{"currencyCode":"USD","items":[{"name":"Free item","itemCost":0,"quantity":2,"taxPercent":0,"itemTotal":0},{"name":"Paid item","itemCost":0.05,"quantity":3,"taxPercent":10,"itemTotal":0.15}],"shippingCost":0,"discount":0},"expected":{"unitTax":["0","0.01"],"itemTotal":"0.15","taxTotal":"0.03","shipping":"0","discount":"0","amount":"0.18"}}
];

const context = { sandbox: true, request_id: 'offline-contract-test' };
const toolkit = new PayPalMCPToolkit({
    accessToken: 'offline-placeholder',
    configuration: { actions: { orders: { create: true } }, context }
});
const schema = toolkit.getTools().find(tool => tool.method === 'create_order').parameters;
const api = toolkit.getPaypalAPIService();
const originalAdapter = axios.defaults.adapter;
let requests;

function cents(value) {
    expect(value).toMatch(/^\d+(?:\.\d{1,2})?$/);
    const [whole, fraction = ''] = value.split('.');
    return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}

beforeEach(() => {
    requests = [];
    // Intercept only transport; axios still serializes the real createOrder payload.
    axios.defaults.adapter = async config => {
        expect(config.method).toBe('post');
        expect(config.url).toBe('https://api.sandbox.paypal.com/v2/checkout/orders');
        expect(config.headers.get('PayPal-Request-Id')).toBe('offline-contract-test');
        expect(typeof config.data).toBe('string');
        requests.push(JSON.parse(config.data));
        return { data: { id: 'OFFLINE', status: 'CREATED' }, status: 201,
            statusText: 'Created', headers: {}, config };
    };
});
afterEach(() => { axios.defaults.adapter = originalAdapter; });

describe('create_order serialized amount contract', () => {
    test.each(cases)('$name', async ({ input, expected }) => {
        const parsed = schema.parse(input);
        expect(JSON.parse(await api.run('create_order', input))).toEqual({ id: 'OFFLINE', status: 'CREATED' });
        expect(requests).toHaveLength(1);
        const wire = requests[0];
        const unit = wire.purchase_units[0], b = unit.amount.breakdown;
        const money = (value) => ({ value, currency_code: 'USD' });
        expect(unit.amount).toEqual({ value: expected.amount, currency_code: 'USD', breakdown: {
            item_total: money(expected.itemTotal), shipping: money(expected.shipping),
            tax_total: money(expected.taxTotal), discount: money(expected.discount)
        } });
        expect(unit.items).toEqual(parsed.items.map((item, i) => ({
            name: item.name, ...(item.description === undefined ? {} : { description: item.description }),
            unit_amount: money(item.itemCost.toString()), quantity: item.quantity.toString(), tax: money(expected.unitTax[i])
        })));
        // PayPal's Orders errors: ITEM_TOTAL_MISMATCH, TAX_TOTAL_MISMATCH, AMOUNT_MISMATCH.
        // Integer cents check the strings actually sent, not approximate JS arithmetic.
        const itemSum = unit.items.reduce((sum, item) => sum + cents(item.unit_amount.value) * BigInt(item.quantity), 0n);
        const taxSum = unit.items.reduce((sum, item) => sum + cents(item.tax.value) * BigInt(item.quantity), 0n);
        expect(cents(b.item_total.value)).toBe(itemSum);
        expect(cents(b.tax_total.value)).toBe(taxSum);
        expect(cents(unit.amount.value)).toBe(cents(b.item_total.value) + cents(b.tax_total.value) + cents(b.shipping.value) - cents(b.discount.value));
        if (parsed.shippingAddress) expect(unit.shipping).toEqual({ address: parsed.shippingAddress });
        else expect(unit).not.toHaveProperty('shipping');
        expect(wire.payment_source).toEqual({ paypal: { experience_context: {
            return_url: parsed.returnUrl, cancel_url: parsed.cancelUrl
        } } });
    });

    test.each([
        { currencyCode: 'USD', items: [{ name: 'Item', itemCost: 0.05, quantity: 3, taxPercent: 10 }] },
        { ...cases[0].input, currencyCode: 'EUR' },
        { currencyCode: 'USD', items: [{ name: 'Item', itemCost: '0.05', itemTotal: 0.15 }] }
    ])('rejects existing invalid input before order transport: %j', async input => {
        expect(schema.safeParse(input).success).toBe(false);
        expect(JSON.parse(await api.run('create_order', input))).toHaveProperty('error');
        expect(requests).toHaveLength(0);
    });

    test('keeps caller unit prices unchanged rather than coercing excess precision', async () => {
        // The existing schema is permissive. This is a preservation check, not a supported PayPal amount.
        const parsed = schema.parse({ currencyCode: 'USD', items: [{ name: 'Item', itemCost: 0.051, quantity: 3, taxPercent: 0, itemTotal: 0.153 }] });
        await api.run('create_order', parsed);
        expect(requests).toHaveLength(1);
        expect(requests[0].purchase_units[0].items[0].unit_amount.value).toBe('0.051');
    });
});
