import {
  buildCreateInvoicePayload,
  buildCreateRecurringSeriesPayload,
} from "../payloadUtils";

function minimalInvoiceParams(overrides: Record<string, any> = {}) {
  return {
    currency_code: "USD",
    primary_recipients: [{}],
    items: [
      { name: "Widget", quantity: "1", unit_amount: { currency_code: "USD", value: "10.00" } },
    ],
    ...overrides,
  } as any;
}

function minimalRecurringParams(overrides: Record<string, any> = {}) {
  return {
    interval_unit: "MONTH",
    interval_count: 1,
    start_series_date: "2024-01-01",
    currency_code: "USD",
    primary_recipients: [{}],
    ...overrides,
  } as any;
}

describe("buildCreateInvoicePayload", () => {
  it("produces the compact minimal shape", () => {
    const payload = buildCreateInvoicePayload(minimalInvoiceParams());

    expect(payload).toEqual({
      detail: { currency_code: "USD" },
      primary_recipients: [{}],
      items: [{ name: "Widget", quantity: "1", unit_amount: { currency_code: "USD", value: "10.00" } }],
    });
    expect(payload).not.toHaveProperty("invoicer");
    expect(payload).not.toHaveProperty("configuration");
    expect(payload).not.toHaveProperty("amount");
  });

  it("nests invoicer fields", () => {
    const payload = buildCreateInvoicePayload(
      minimalInvoiceParams({
        invoicer_business_name: "Acme Co",
        invoicer_given_name: "Ada",
        invoicer_surname: "Lovelace",
        invoicer_email_address: "ada@example.com",
        invoicer_tax_id: "TAX123",
        invoicer_address_line_1: "123 Main St",
        invoicer_city: "Springfield",
        invoicer_country_code: "US",
      })
    );

    expect((payload as any).invoicer).toEqual({
      business_name: "Acme Co",
      name: { given_name: "Ada", surname: "Lovelace" },
      address: { address_line_1: "123 Main St", admin_area_2: "Springfield", country_code: "US" },
      email_address: "ada@example.com",
      tax_id: "TAX123",
    });
  });

  it("puts reference/invoice_number/invoice_date/note under detail", () => {
    const payload = buildCreateInvoicePayload(
      minimalInvoiceParams({
        reference: "PO-1",
        invoice_number: "INV-1",
        invoice_date: "2024-01-01",
        note: "thanks",
      })
    );

    expect((payload as any).detail).toEqual({
      reference: "PO-1",
      invoice_number: "INV-1",
      invoice_date: "2024-01-01",
      currency_code: "USD",
      note: "thanks",
    });
  });

  it("omits configuration when pay-by-bank is disabled even with threshold flag set", () => {
    const payload = buildCreateInvoicePayload(
      minimalInvoiceParams({ pay_by_bank_exclusive_above_threshold: true })
    );

    expect(payload).not.toHaveProperty("configuration");
  });

  it("enables pay-by-bank without a threshold rule", () => {
    const payload = buildCreateInvoicePayload(minimalInvoiceParams({ enable_pay_by_bank: true }));

    expect((payload as any).configuration).toEqual({
      payment_method_overrides: [{ payment_method_type: "PAY_BY_BANK", enabled: true }],
    });
  });

  it("enables pay-by-bank with a threshold rule", () => {
    const payload = buildCreateInvoicePayload(
      minimalInvoiceParams({ enable_pay_by_bank: true, pay_by_bank_exclusive_above_threshold: true })
    );

    expect((payload as any).configuration.payment_method_overrides).toEqual([
      {
        payment_method_type: "PAY_BY_BANK",
        enabled: true,
        rules: [{ rule_type: "EXCLUSIVE_ABOVE_AMOUNT_THRESHOLD", rule_value: "true" }],
      },
    ]);
  });

  it("allows partial payment without a minimum amount", () => {
    const payload = buildCreateInvoicePayload(minimalInvoiceParams({ allow_partial_payment: true }));

    expect((payload as any).configuration).toEqual({ partial_payment: { allow_partial_payment: true } });
  });

  it("allows partial payment with a minimum amount", () => {
    const payload = buildCreateInvoicePayload(
      minimalInvoiceParams({ allow_partial_payment: true, minimum_partial_payment_amount: "5.00" })
    );

    expect((payload as any).configuration.partial_payment).toEqual({
      allow_partial_payment: true,
      minimum_amount_due: { currency_code: "USD", value: "5.00" },
    });
  });

  it("keeps allow_partial_payment: false explicitly", () => {
    const payload = buildCreateInvoicePayload(minimalInvoiceParams({ allow_partial_payment: false }));

    expect((payload as any).configuration).toEqual({ partial_payment: { allow_partial_payment: false } });
  });

  it("sets allow_tip and theme_color", () => {
    const payload = buildCreateInvoicePayload(
      minimalInvoiceParams({ allow_tip: true, theme_color: "#FF0000" })
    );

    expect((payload as any).configuration).toEqual({
      allow_tip: true,
      theme: { primary_color: "#FF0000" },
    });
  });

  it("builds the shipping cost amount breakdown", () => {
    const payload = buildCreateInvoicePayload(minimalInvoiceParams({ shipping_cost: "2.50" }));

    expect((payload as any).amount).toEqual({
      breakdown: { shipping: { amount: { currency_code: "USD", value: "2.50" } } },
    });
  });

  it("passes through multiple items and recipients", () => {
    const payload = buildCreateInvoicePayload(
      minimalInvoiceParams({
        primary_recipients: [{ billing_info: { business_name: "A" } }, {}],
        items: [
          { name: "A", quantity: "1", unit_amount: { currency_code: "USD", value: "1.00" } },
          { name: "B", quantity: "2", unit_amount: { currency_code: "USD", value: "2.00" } },
        ],
      })
    );

    expect((payload as any).primary_recipients).toHaveLength(2);
    expect((payload as any).items).toHaveLength(2);
  });
});

describe("buildCreateRecurringSeriesPayload", () => {
  it("produces the compact minimal shape", () => {
    const payload = buildCreateRecurringSeriesPayload(minimalRecurringParams());

    expect(payload).toEqual({
      plan_detail: {
        frequency: { interval_unit: "MONTH", interval_count: 1 },
        start_series_date: "2024-01-01",
      },
      recurring_info: {
        detail: { currency_code: "USD" },
        primary_recipients: [{}],
      },
    });
  });

  it("always includes plan_detail and recurring_info top-level keys", () => {
    const payload = buildCreateRecurringSeriesPayload(minimalRecurringParams());

    expect(payload).toHaveProperty("plan_detail");
    expect(payload).toHaveProperty("recurring_info");
  });

  it("includes total_cycles when present", () => {
    const payload = buildCreateRecurringSeriesPayload(minimalRecurringParams({ total_cycles: 12 }));

    expect(payload.plan_detail).toHaveProperty("total_cycles", 12);
  });

  it("passes through items when present", () => {
    const payload = buildCreateRecurringSeriesPayload(
      minimalRecurringParams({
        items: [{ name: "Widget", quantity: "1", unit_amount: { currency_code: "USD", value: "1.00" } }],
      })
    );

    expect((payload.recurring_info as any).items).toEqual([
      { name: "Widget", quantity: "1", unit_amount: { currency_code: "USD", value: "1.00" } },
    ]);
  });

  it("omits items when absent", () => {
    const payload = buildCreateRecurringSeriesPayload(minimalRecurringParams());

    expect(payload.recurring_info).not.toHaveProperty("items");
  });

  it("builds shipping cost and partial payment", () => {
    const payload = buildCreateRecurringSeriesPayload(
      minimalRecurringParams({
        shipping_cost: "3.00",
        allow_partial_payment: true,
        minimum_partial_payment_amount: "1.00",
      })
    );

    expect((payload.recurring_info as any).amount).toEqual({
      breakdown: { shipping: { amount: { currency_code: "USD", value: "3.00" } } },
    });
    expect((payload.recurring_info as any).configuration.partial_payment).toEqual({
      allow_partial_payment: true,
      minimum_amount_due: { currency_code: "USD", value: "1.00" },
    });
  });

  it("has no theme_color or pay-by-bank support, unlike the invoice builder", () => {
    const params = minimalRecurringParams({ theme_color: "#000000", enable_pay_by_bank: true });
    const payload = buildCreateRecurringSeriesPayload(params);

    expect(JSON.stringify((payload.recurring_info as any).configuration ?? {})).not.toContain(
      "payment_method_overrides"
    );
  });
});
