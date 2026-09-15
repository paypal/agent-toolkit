import {
  createInvoiceParameters,
  createRecurringSeriesParameters,
  updateInvoicingParameters,
  searchInvoicingParameters,
  recordPaymentForInvoiceParameters,
  recordRefundForInvoiceParameters,
  createConditionalRulesForInvoiceParameters,
} from "../parameters";
import { makeContext } from "./testUtils";

const ctx = makeContext();

function minimalInvoiceInput(overrides: Record<string, any> = {}) {
  return {
    currency_code: "USD",
    primary_recipients: [{}],
    items: [{ name: "Widget", quantity: "1", unit_amount: { currency_code: "USD", value: "10.00" } }],
    ...overrides,
  };
}

function minimalRecurringInput(overrides: Record<string, any> = {}) {
  return {
    interval_unit: "MONTH",
    interval_count: 1,
    start_series_date: "2024-01-01",
    currency_code: "USD",
    primary_recipients: [{}],
    ...overrides,
  };
}

describe("createInvoiceParameters", () => {
  it("accepts minimal valid input", () => {
    const result = createInvoiceParameters(ctx).safeParse(minimalInvoiceInput());
    expect(result.success).toBe(true);
  });

  it("rejects an invalid theme_color", () => {
    const result = createInvoiceParameters(ctx).safeParse(
      minimalInvoiceInput({ theme_color: "not-a-color" })
    );
    expect(result.success).toBe(false);
  });

  it("accepts a valid hex theme_color", () => {
    const result = createInvoiceParameters(ctx).safeParse(
      minimalInvoiceInput({ theme_color: "#FF0000" })
    );
    expect(result.success).toBe(true);
  });

  it("rejects an invalid invoicer_country_code", () => {
    const result = createInvoiceParameters(ctx).safeParse(
      minimalInvoiceInput({ invoicer_country_code: "USA" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric shipping_cost", () => {
    const result = createInvoiceParameters(ctx).safeParse(
      minimalInvoiceInput({ shipping_cost: "abc" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects an item discount with both percent and amount set", () => {
    const result = createInvoiceParameters(ctx).safeParse(
      minimalInvoiceInput({
        items: [
          {
            name: "Widget",
            quantity: "1",
            unit_amount: { currency_code: "USD", value: "10.00" },
            discount: { percent: "10", amount: { currency_code: "USD", value: "5.00" } },
          },
        ],
      })
    );
    expect(result.success).toBe(false);
  });

  it("accepts an item discount with only percent set", () => {
    const result = createInvoiceParameters(ctx).safeParse(
      minimalInvoiceInput({
        items: [
          {
            name: "Widget",
            quantity: "1",
            unit_amount: { currency_code: "USD", value: "10.00" },
            discount: { percent: "10" },
          },
        ],
      })
    );
    expect(result.success).toBe(true);
  });
});

describe("createRecurringSeriesParameters", () => {
  it("accepts minimal valid input", () => {
    const result = createRecurringSeriesParameters(ctx).safeParse(minimalRecurringInput());
    expect(result.success).toBe(true);
  });

  it("rejects an invalid start_series_date format", () => {
    const result = createRecurringSeriesParameters(ctx).safeParse(
      minimalRecurringInput({ start_series_date: "01-01-2024" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects more than one primary_recipient", () => {
    const result = createRecurringSeriesParameters(ctx).safeParse(
      minimalRecurringInput({ primary_recipients: [{}, {}] })
    );
    expect(result.success).toBe(false);
  });

  it("rejects interval_count above the max", () => {
    const result = createRecurringSeriesParameters(ctx).safeParse(
      minimalRecurringInput({ interval_count: 53 })
    );
    expect(result.success).toBe(false);
  });
});

describe("updateInvoicingParameters", () => {
  it("accepts invoice_update with an optional invoice_id (enforced at runtime, not schema level)", () => {
    const result = updateInvoicingParameters(ctx).safeParse({
      resource_type: "invoice",
      invoice_update: minimalInvoiceInput(),
    });
    expect(result.success).toBe(true);
  });

  it("accepts resource_type alone with nothing else set", () => {
    const result = updateInvoicingParameters(ctx).safeParse({ resource_type: "invoice" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid recurring_series_id format inside recurring_series_update", () => {
    const result = updateInvoicingParameters(ctx).safeParse({
      resource_type: "recurring_series",
      recurring_series_update: minimalRecurringInput({ recurring_series_id: "not-valid" }),
    });
    expect(result.success).toBe(false);
  });
});

describe("searchInvoicingParameters", () => {
  it("leaves page/page_size/total_required undefined when omitted (default() is unreachable behind optional())", () => {
    // .default(1).optional() -- ZodOptional short-circuits on `undefined` input before the
    // inner ZodDefault ever runs, so an omitted field stays undefined rather than defaulting.
    // Defaults only take effect if a caller down the line applies them explicitly.
    const result = searchInvoicingParameters(ctx).safeParse({ resource_type: "invoice" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBeUndefined();
      expect(result.data.page_size).toBeUndefined();
      expect(result.data.total_required).toBeUndefined();
    }
  });

  it("does not itself enforce resource_type/filters pairing (enforced at runtime in searchInvoicing)", () => {
    // The schema deliberately can't use .refine() (Tool.parameters requires a plain
    // ZodObject) -- both filters may validate together even though the dispatcher rejects it.
    const result = searchInvoicingParameters(ctx).safeParse({
      resource_type: "invoice",
      recurring_series_filters: { search_text: "abc", search_fields: ["ALL"] },
    });
    expect(result.success).toBe(true);
  });

  it("drops a blank recipient_email in invoice_filters", () => {
    const result = searchInvoicingParameters(ctx).safeParse({
      resource_type: "invoice",
      invoice_filters: { recipient_email: "   " },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.invoice_filters?.recipient_email).toBeUndefined();
    }
  });

  it("drops an empty status array in invoice_filters", () => {
    const result = searchInvoicingParameters(ctx).safeParse({
      resource_type: "invoice",
      invoice_filters: { status: [] },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.invoice_filters?.status).toBeUndefined();
    }
  });

  it("rejects duplicate status values in recurring_series_filters.search_filters", () => {
    const result = searchInvoicingParameters(ctx).safeParse({
      resource_type: "recurring_series",
      recurring_series_filters: { search_filters: { status: ["ACTIVE", "ACTIVE"] } },
    });
    expect(result.success).toBe(false);
  });

  it("rejects mutually exclusive date ranges in recurring_series_filters.search_filters", () => {
    const result = searchInvoicingParameters(ctx).safeParse({
      resource_type: "recurring_series",
      recurring_series_filters: {
        search_filters: {
          creation_date_range: { start: "2024-01-01T00:00:00Z", end: "2024-01-02T00:00:00Z" },
          next_occurrence_date_range: { start: "2024-01-01", end: "2024-01-02" },
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it("drops a blank date range with only one bound set", () => {
    const result = searchInvoicingParameters(ctx).safeParse({
      resource_type: "invoice",
      invoice_filters: { invoice_date_range: { start: "2024-01-01", end: "" } },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.invoice_filters?.invoice_date_range).toBeUndefined();
    }
  });

  it("expands a bare date to a full ISO8601 datetime boundary", () => {
    const result = searchInvoicingParameters(ctx).safeParse({
      resource_type: "invoice",
      invoice_filters: {
        creation_date_range: { start: "2024-01-01", end: "2024-01-02T10:00:00Z" },
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.invoice_filters?.creation_date_range?.start).toBe("2024-01-01T00:00:00Z");
    }
  });

  it("drops blank amount range when one bound value is empty", () => {
    const result = searchInvoicingParameters(ctx).safeParse({
      resource_type: "invoice",
      invoice_filters: {
        total_amount_range: {
          lower_amount: { currency_code: "USD", value: "" },
          upper_amount: { currency_code: "USD", value: "10.00" },
        },
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.invoice_filters?.total_amount_range).toBeUndefined();
    }
  });

  it("rejects duplicate search_fields in recurring series text search", () => {
    const result = searchInvoicingParameters(ctx).safeParse({
      resource_type: "recurring_series",
      recurring_series_filters: { search_text: "abc", search_fields: ["ALL", "ALL"] },
    });
    expect(result.success).toBe(false);
  });
});

describe("recordPaymentForInvoiceParameters", () => {
  it("coerces empty-string optional fields to undefined", () => {
    const result = recordPaymentForInvoiceParameters(ctx).safeParse({
      invoice_id: "INV-1",
      method: "CASH",
      payment_id: "",
      payment_date: "",
      payment_date_time: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.payment_id).toBeUndefined();
      expect(result.data.payment_date).toBeUndefined();
      expect(result.data.payment_date_time).toBeUndefined();
    }
  });

  it("rejects an invalid invoice_id", () => {
    const result = recordPaymentForInvoiceParameters(ctx).safeParse({
      invoice_id: "has spaces",
      method: "CASH",
    });
    expect(result.success).toBe(false);
  });
});

describe("recordRefundForInvoiceParameters", () => {
  it("coerces an empty-string refund_date to undefined", () => {
    const result = recordRefundForInvoiceParameters(ctx).safeParse({
      invoice_id: "INV-1",
      method: "CASH",
      refund_date: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.refund_date).toBeUndefined();
    }
  });
});

describe("createConditionalRulesForInvoiceParameters", () => {
  const expiry = {
    rule_expiry_condition: "SPECIFIC_DATE",
    condition_rule_end_date: "2024-12-31",
  };

  it("requires conditional_rule_value_type and conditional_rule_value for EARLY_PAYMENT_DISCOUNT", () => {
    const result = createConditionalRulesForInvoiceParameters(ctx).safeParse({
      invoice_id: "INV-1",
      rules: [{ conditional_rule_type: "EARLY_PAYMENT_DISCOUNT", rule_expiry_terms: expiry }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a PERCENT value within range", () => {
    const result = createConditionalRulesForInvoiceParameters(ctx).safeParse({
      invoice_id: "INV-1",
      rules: [
        {
          conditional_rule_type: "EARLY_PAYMENT_DISCOUNT",
          conditional_rule_value_type: "PERCENT",
          conditional_rule_value: "50",
          rule_expiry_terms: expiry,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it.each(["0", "101", "-5"])("rejects an out-of-range PERCENT value %s", (value) => {
    const result = createConditionalRulesForInvoiceParameters(ctx).safeParse({
      invoice_id: "INV-1",
      rules: [
        {
          conditional_rule_type: "EARLY_PAYMENT_DISCOUNT",
          conditional_rule_value_type: "PERCENT",
          conditional_rule_value: value,
          rule_expiry_terms: expiry,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("does not bound an AMOUNT-type value", () => {
    const result = createConditionalRulesForInvoiceParameters(ctx).safeParse({
      invoice_id: "INV-1",
      rules: [
        {
          conditional_rule_type: "EARLY_PAYMENT_DISCOUNT",
          conditional_rule_value_type: "AMOUNT",
          conditional_rule_value: "500",
          rule_expiry_terms: expiry,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("does not require value fields for AUTO_CANCEL", () => {
    const result = createConditionalRulesForInvoiceParameters(ctx).safeParse({
      invoice_id: "INV-1",
      rules: [{ conditional_rule_type: "AUTO_CANCEL", rule_expiry_terms: expiry }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty rules array", () => {
    const result = createConditionalRulesForInvoiceParameters(ctx).safeParse({
      invoice_id: "INV-1",
      rules: [],
    });
    expect(result.success).toBe(false);
  });
});
