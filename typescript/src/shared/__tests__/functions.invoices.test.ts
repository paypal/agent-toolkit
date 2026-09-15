import axios from "axios";
import {
  createInvoice,
  createRecurringSeries,
  activateRecurringSeries,
  getRecurringSeries,
  cancelRecurringSeries,
  updateInvoicing,
  deleteRecurringSeries,
  listInvoices,
  getInvoice,
  sendInvoice,
  sendInvoiceReminder,
  setupInvoiceAutoReminder,
  updateInvoiceAutoReminder,
  searchInvoicing,
  cancelInvoiceAutoReminder,
  cancelSentInvoice,
  deleteInvoice,
  generateInvoiceQrCode,
  generateInvoiceNumber,
  recordPaymentForInvoice,
  recordRefundForInvoice,
  createConditionalRulesForInvoice,
} from "../functions";
import { LlmError } from "../llmError";
import { makeMockClient, makeContext, makeAxiosResponse, makeAxiosResponseError } from "./testUtils";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
  jest.clearAllMocks();
});

const BASE_URL = "https://api-m.sandbox.paypal.com";

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

describe("createInvoice", () => {
  it("posts the built payload to the invoices endpoint and returns response.data", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse({ id: "INV-1" }, 201));

    const result = await createInvoice(client, makeContext(), minimalInvoiceParams());

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${BASE_URL}/v2/invoicing/invoices`,
      { detail: { currency_code: "USD" }, primary_recipients: [{}], items: minimalInvoiceParams().items },
      { headers: { Authorization: "Bearer test-token" } }
    );
    expect(result).toEqual({ id: "INV-1" });
  });

  it("throws an LlmError when the API call fails", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockRejectedValueOnce(makeAxiosResponseError({ status: 400 }));

    await expect(createInvoice(client, makeContext(), minimalInvoiceParams())).rejects.toBeInstanceOf(LlmError);
  });
});

describe("createRecurringSeries", () => {
  it("posts the built payload to the recurring-invoices endpoint", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse({ id: "RS-1" }, 201));

    const result = await createRecurringSeries(client, makeContext(), minimalRecurringParams());

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${BASE_URL}/v2/invoicing/recurring-invoices`,
      expect.objectContaining({ plan_detail: expect.any(Object), recurring_info: expect.any(Object) }),
      { headers: { Authorization: "Bearer test-token" } }
    );
    expect(result).toEqual({ id: "RS-1" });
  });

  it("throws an LlmError when the API call fails", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockRejectedValueOnce(makeAxiosResponseError());

    await expect(createRecurringSeries(client, makeContext(), minimalRecurringParams())).rejects.toBeInstanceOf(
      LlmError
    );
  });
});

describe("activateRecurringSeries", () => {
  it("posts to the activate endpoint and returns {recurring_series_id, status}, ignoring response.data", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse({ id: "should-be-ignored" }, 200));

    const result = await activateRecurringSeries(client, makeContext(), { recurring_series_id: "RS-1" } as any);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${BASE_URL}/v2/invoicing/recurring-invoices/RS-1/activate`,
      {},
      { headers: { Authorization: "Bearer test-token" } }
    );
    expect(result).toEqual({ recurring_series_id: "RS-1", status: 200 });
  });

  it("throws an LlmError when the API call fails", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockRejectedValueOnce(makeAxiosResponseError());

    await expect(
      activateRecurringSeries(client, makeContext(), { recurring_series_id: "RS-1" } as any)
    ).rejects.toBeInstanceOf(LlmError);
  });
});

describe("getRecurringSeries", () => {
  it("gets the recurring series by id", async () => {
    const client = makeMockClient();
    mockedAxios.get.mockResolvedValueOnce(makeAxiosResponse({ id: "RS-1" }));

    const result = await getRecurringSeries(client, makeContext(), { recurring_series_id: "RS-1" } as any);

    expect(mockedAxios.get).toHaveBeenCalledWith(`${BASE_URL}/v2/invoicing/recurring-invoices/RS-1`, {
      headers: { Authorization: "Bearer test-token" },
    });
    expect(result).toEqual({ id: "RS-1" });
  });

  it("throws an LlmError when the API call fails", async () => {
    const client = makeMockClient();
    mockedAxios.get.mockRejectedValueOnce(makeAxiosResponseError({ status: 404 }));

    await expect(
      getRecurringSeries(client, makeContext(), { recurring_series_id: "RS-1" } as any)
    ).rejects.toBeInstanceOf(LlmError);
  });
});

describe("cancelRecurringSeries", () => {
  it("posts to the cancel endpoint and returns {recurring_series_id, status}", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse({ id: "should-be-ignored" }, 200));

    const result = await cancelRecurringSeries(client, makeContext(), { recurring_series_id: "RS-1" } as any);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${BASE_URL}/v2/invoicing/recurring-invoices/RS-1/cancel`,
      {},
      { headers: { Authorization: "Bearer test-token" } }
    );
    expect(result).toEqual({ recurring_series_id: "RS-1", status: 200 });
  });

  it("throws an LlmError when the API call fails", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockRejectedValueOnce(makeAxiosResponseError());

    await expect(
      cancelRecurringSeries(client, makeContext(), { recurring_series_id: "RS-1" } as any)
    ).rejects.toBeInstanceOf(LlmError);
  });
});

describe("deleteRecurringSeries", () => {
  it("deletes the recurring series and returns {recurring_series_id, status}", async () => {
    const client = makeMockClient();
    mockedAxios.delete.mockResolvedValueOnce(makeAxiosResponse({ id: "should-be-ignored" }, 204));

    const result = await deleteRecurringSeries(client, makeContext(), { recurring_series_id: "RS-1" } as any);

    expect(mockedAxios.delete).toHaveBeenCalledWith(`${BASE_URL}/v2/invoicing/recurring-invoices/RS-1`, {
      headers: { Authorization: "Bearer test-token" },
    });
    expect(result).toEqual({ recurring_series_id: "RS-1", status: 204 });
  });

  it("throws an LlmError when the API call fails", async () => {
    const client = makeMockClient();
    mockedAxios.delete.mockRejectedValueOnce(makeAxiosResponseError());

    await expect(
      deleteRecurringSeries(client, makeContext(), { recurring_series_id: "RS-1" } as any)
    ).rejects.toBeInstanceOf(LlmError);
  });
});

describe("updateInvoicing dispatcher", () => {
  it("routes resource_type 'invoice' to a PUT on /v2/invoicing/invoices/:id with the Prefer header and send flags as query params", async () => {
    const client = makeMockClient();
    mockedAxios.put.mockResolvedValueOnce(makeAxiosResponse({ id: "INV-1" }, 200));

    const result = await updateInvoicing(client, makeContext(), {
      resource_type: "invoice",
      invoice_update: minimalInvoiceParams({ invoice_id: "INV-1", send_to_recipient: true, send_to_invoicer: false }),
    } as any);

    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${BASE_URL}/v2/invoicing/invoices/INV-1`,
      expect.any(Object),
      {
        headers: { Authorization: "Bearer test-token", Prefer: "return=representation" },
        params: { send_to_recipient: true, send_to_invoicer: false },
      }
    );
    expect(result).toEqual({ id: "INV-1" });
  });

  it("routes resource_type 'recurring_series' to a PUT on /v2/invoicing/recurring-invoices/:id", async () => {
    const client = makeMockClient();
    mockedAxios.put.mockResolvedValueOnce(makeAxiosResponse({ id: "RS-1" }, 200));

    const result = await updateInvoicing(client, makeContext(), {
      resource_type: "recurring_series",
      recurring_series_update: minimalRecurringParams({ recurring_series_id: "RS-1" }),
    } as any);

    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${BASE_URL}/v2/invoicing/recurring-invoices/RS-1`,
      expect.any(Object),
      { headers: { Authorization: "Bearer test-token", Prefer: "return=representation" } }
    );
    expect(result).toEqual({ id: "RS-1" });
  });

  it("rejects recurring_series_update set alongside resource_type 'invoice' without calling the API", async () => {
    const client = makeMockClient();

    await expect(
      updateInvoicing(client, makeContext(), {
        resource_type: "invoice",
        invoice_update: minimalInvoiceParams({ invoice_id: "INV-1" }),
        recurring_series_update: minimalRecurringParams({ recurring_series_id: "RS-1" }),
      } as any)
    ).rejects.toThrow(/recurring_series_update cannot be set/);
    expect(mockedAxios.put).not.toHaveBeenCalled();
  });

  it("rejects a missing invoice_update for resource_type 'invoice'", async () => {
    const client = makeMockClient();

    await expect(
      updateInvoicing(client, makeContext(), { resource_type: "invoice" } as any)
    ).rejects.toThrow(/invoice_update is required/);
    expect(mockedAxios.put).not.toHaveBeenCalled();
  });

  it("rejects a missing invoice_update.invoice_id for resource_type 'invoice'", async () => {
    const client = makeMockClient();

    await expect(
      updateInvoicing(client, makeContext(), {
        resource_type: "invoice",
        invoice_update: minimalInvoiceParams(),
      } as any)
    ).rejects.toThrow(/invoice_update.invoice_id is required/);
    expect(mockedAxios.put).not.toHaveBeenCalled();
  });

  it("rejects invoice_update set alongside resource_type 'recurring_series' without calling the API", async () => {
    const client = makeMockClient();

    await expect(
      updateInvoicing(client, makeContext(), {
        resource_type: "recurring_series",
        recurring_series_update: minimalRecurringParams({ recurring_series_id: "RS-1" }),
        invoice_update: minimalInvoiceParams({ invoice_id: "INV-1" }),
      } as any)
    ).rejects.toThrow(/invoice_update cannot be set/);
    expect(mockedAxios.put).not.toHaveBeenCalled();
  });

  it("rejects a missing recurring_series_update.recurring_series_id for resource_type 'recurring_series'", async () => {
    const client = makeMockClient();

    await expect(
      updateInvoicing(client, makeContext(), {
        resource_type: "recurring_series",
        recurring_series_update: minimalRecurringParams(),
      } as any)
    ).rejects.toThrow(/recurring_series_update.recurring_series_id is required/);
    expect(mockedAxios.put).not.toHaveBeenCalled();
  });

  it("rejects a missing recurring_series_update for resource_type 'recurring_series'", async () => {
    const client = makeMockClient();

    await expect(
      updateInvoicing(client, makeContext(), { resource_type: "recurring_series" } as any)
    ).rejects.toThrow(/recurring_series_update is required/);
    expect(mockedAxios.put).not.toHaveBeenCalled();
  });

  it("treats a non-string/array/object leaf value as non-empty (isEmptyFilters boolean branch)", async () => {
    const client = makeMockClient();

    await expect(
      updateInvoicing(client, makeContext(), {
        resource_type: "recurring_series",
        recurring_series_update: minimalRecurringParams({ recurring_series_id: "RS-1" }),
        invoice_update: { send_to_recipient: true },
      } as any)
    ).rejects.toThrow(/invoice_update cannot be set/);
    expect(mockedAxios.put).not.toHaveBeenCalled();
  });

  it("propagates an LlmError when the invoice PUT call fails", async () => {
    const client = makeMockClient();
    mockedAxios.put.mockRejectedValueOnce(makeAxiosResponseError());

    await expect(
      updateInvoicing(client, makeContext(), {
        resource_type: "invoice",
        invoice_update: minimalInvoiceParams({ invoice_id: "INV-1" }),
      } as any)
    ).rejects.toBeInstanceOf(LlmError);
  });

  it("propagates an LlmError when the recurring series PUT call fails", async () => {
    const client = makeMockClient();
    mockedAxios.put.mockRejectedValueOnce(makeAxiosResponseError());

    await expect(
      updateInvoicing(client, makeContext(), {
        resource_type: "recurring_series",
        recurring_series_update: minimalRecurringParams({ recurring_series_id: "RS-1" }),
      } as any)
    ).rejects.toBeInstanceOf(LlmError);
  });
});

describe("listInvoices", () => {
  it("gets the invoices list, passing params through", async () => {
    const client = makeMockClient();
    mockedAxios.get.mockResolvedValueOnce(makeAxiosResponse({ items: [] }));

    const params = { page: 2, page_size: 10, total_required: true };
    const result = await listInvoices(client, makeContext(), params as any);

    expect(mockedAxios.get).toHaveBeenCalledWith(`${BASE_URL}/v2/invoicing/invoices`, {
      headers: { Authorization: "Bearer test-token" },
      params,
    });
    expect(result).toEqual({ items: [] });
  });

  it("throws an LlmError when the API call fails", async () => {
    const client = makeMockClient();
    mockedAxios.get.mockRejectedValueOnce(makeAxiosResponseError());

    await expect(listInvoices(client, makeContext(), {} as any)).rejects.toBeInstanceOf(LlmError);
  });
});

describe("getInvoice", () => {
  it("gets a single invoice by id", async () => {
    const client = makeMockClient();
    mockedAxios.get.mockResolvedValueOnce(makeAxiosResponse({ id: "INV-1" }));

    const result = await getInvoice(client, makeContext(), { invoice_id: "INV-1" } as any);

    expect(mockedAxios.get).toHaveBeenCalledWith(`${BASE_URL}/v2/invoicing/invoices/INV-1`, {
      headers: { Authorization: "Bearer test-token" },
    });
    expect(result).toEqual({ id: "INV-1" });
  });

  it("throws an LlmError when the API call fails", async () => {
    const client = makeMockClient();
    mockedAxios.get.mockRejectedValueOnce(makeAxiosResponseError({ status: 404 }));

    await expect(getInvoice(client, makeContext(), { invoice_id: "INV-1" } as any)).rejects.toBeInstanceOf(LlmError);
  });
});

describe("sendInvoice", () => {
  it("posts params to the send endpoint", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse({ id: "INV-1" }));

    const params = { invoice_id: "INV-1", send_to_recipient: true };
    const result = await sendInvoice(client, makeContext(), params as any);

    expect(mockedAxios.post).toHaveBeenCalledWith(`${BASE_URL}/v2/invoicing/invoices/INV-1/send`, params, {
      headers: { Authorization: "Bearer test-token" },
    });
    expect(result).toEqual({ id: "INV-1" });
  });

  it("throws an LlmError when the API call fails", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockRejectedValueOnce(makeAxiosResponseError());

    await expect(sendInvoice(client, makeContext(), { invoice_id: "INV-1" } as any)).rejects.toBeInstanceOf(LlmError);
  });
});

describe("sendInvoiceReminder", () => {
  it("posts params to the remind endpoint", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse({ id: "INV-1" }));

    const params = { invoice_id: "INV-1", subject: "Reminder" };
    const result = await sendInvoiceReminder(client, makeContext(), params as any);

    expect(mockedAxios.post).toHaveBeenCalledWith(`${BASE_URL}/v2/invoicing/invoices/INV-1/remind`, params, {
      headers: { Authorization: "Bearer test-token" },
    });
    expect(result).toEqual({ id: "INV-1" });
  });

  it("throws an LlmError when the API call fails", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockRejectedValueOnce(makeAxiosResponseError());

    await expect(
      sendInvoiceReminder(client, makeContext(), { invoice_id: "INV-1" } as any)
    ).rejects.toBeInstanceOf(LlmError);
  });
});

describe("setupInvoiceAutoReminder", () => {
  it("posts params to the setup-reminders endpoint", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse({ id: "REM-1" }));

    const params = { type: "BEFORE_DUE_DATE" };
    const result = await setupInvoiceAutoReminder(client, makeContext(), params as any);

    expect(mockedAxios.post).toHaveBeenCalledWith(`${BASE_URL}/v2/invoicing/setup-reminders`, params, {
      headers: { Authorization: "Bearer test-token" },
    });
    expect(result).toEqual({ id: "REM-1" });
  });

  it("throws an LlmError when the API call fails", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockRejectedValueOnce(makeAxiosResponseError());

    await expect(setupInvoiceAutoReminder(client, makeContext(), {} as any)).rejects.toBeInstanceOf(LlmError);
  });
});

describe("updateInvoiceAutoReminder", () => {
  it("builds the reminder body, dropping a NONE status and an absent notification", async () => {
    const client = makeMockClient();
    mockedAxios.put.mockResolvedValueOnce(makeAxiosResponse({ id: "REM-1" }));

    const result = await updateInvoiceAutoReminder(client, makeContext(), {
      reminder_configuration_id: "REM-1",
      type: "BEFORE_DUE_DATE",
      status: "NONE",
      interval: { value: 3 },
      repetition: "ONCE",
    } as any);

    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${BASE_URL}/v2/invoicing/reminders/REM-1`,
      { type: "BEFORE_DUE_DATE", interval: { unit: "DAY", value: 3 }, repetition: "ONCE" },
      { headers: { Authorization: "Bearer test-token", Prefer: "return=representation" } }
    );
    expect(result).toEqual({ id: "REM-1" });
  });

  it("includes status and notification when both are set", async () => {
    const client = makeMockClient();
    mockedAxios.put.mockResolvedValueOnce(makeAxiosResponse({ id: "REM-1" }));

    await updateInvoiceAutoReminder(client, makeContext(), {
      reminder_configuration_id: "REM-1",
      type: "BEFORE_DUE_DATE",
      status: "ACTIVE",
      interval: { value: 3 },
      repetition: "ONCE",
      notification: { email: true },
    } as any);

    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${BASE_URL}/v2/invoicing/reminders/REM-1`,
      {
        type: "BEFORE_DUE_DATE",
        interval: { unit: "DAY", value: 3 },
        repetition: "ONCE",
        status: "ACTIVE",
        notification: { email: true },
      },
      { headers: { Authorization: "Bearer test-token", Prefer: "return=representation" } }
    );
  });

  it("throws an LlmError when the API call fails", async () => {
    const client = makeMockClient();
    mockedAxios.put.mockRejectedValueOnce(makeAxiosResponseError());

    await expect(
      updateInvoiceAutoReminder(client, makeContext(), {
        reminder_configuration_id: "REM-1",
        type: "BEFORE_DUE_DATE",
        interval: { value: 3 },
        repetition: "ONCE",
      } as any)
    ).rejects.toBeInstanceOf(LlmError);
  });
});

describe("searchInvoicing dispatcher", () => {
  it("routes resource_type 'invoice' to /v2/invoicing/search-invoices with page params", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse({ items: [] }));

    const result = await searchInvoicing(client, makeContext(), {
      resource_type: "invoice",
      page: 1,
      page_size: 20,
      total_required: true,
      invoice_filters: { recipient_email: "a@b.com" },
    } as any);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${BASE_URL}/v2/invoicing/search-invoices`,
      { recipient_email: "a@b.com" },
      { headers: { Authorization: "Bearer test-token" }, params: { page: 1, page_size: 20, total_required: true } }
    );
    expect(result).toEqual({ items: [] });
  });

  it("defaults the invoice search body to {} when invoice_filters is absent", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse({ items: [] }));

    await searchInvoicing(client, makeContext(), { resource_type: "invoice" } as any);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${BASE_URL}/v2/invoicing/search-invoices`,
      {},
      expect.any(Object)
    );
  });

  it("routes resource_type 'recurring_series' to /v2/invoicing/search-recurring-invoices without total_required", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse({ items: [] }));

    const result = await searchInvoicing(client, makeContext(), {
      resource_type: "recurring_series",
      page: 1,
      page_size: 20,
      recurring_series_filters: { search_text: "abc" },
    } as any);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${BASE_URL}/v2/invoicing/search-recurring-invoices`,
      { search_text: "abc" },
      { headers: { Authorization: "Bearer test-token" }, params: { page: 1, page_size: 20 } }
    );
    expect(result).toEqual({ items: [] });
  });

  it("rejects recurring_series_filters set alongside resource_type 'invoice' without calling the API", async () => {
    const client = makeMockClient();

    await expect(
      searchInvoicing(client, makeContext(), {
        resource_type: "invoice",
        recurring_series_filters: { search_text: "abc" },
      } as any)
    ).rejects.toThrow(/recurring_series_filters cannot be set/);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("rejects invoice_filters set alongside resource_type 'recurring_series' without calling the API", async () => {
    const client = makeMockClient();

    await expect(
      searchInvoicing(client, makeContext(), {
        resource_type: "recurring_series",
        invoice_filters: { recipient_email: "a@b.com" },
      } as any)
    ).rejects.toThrow(/invoice_filters cannot be set/);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("propagates an LlmError when the invoice search POST call fails", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockRejectedValueOnce(makeAxiosResponseError());

    await expect(
      searchInvoicing(client, makeContext(), { resource_type: "invoice" } as any)
    ).rejects.toBeInstanceOf(LlmError);
  });

  it("propagates an LlmError when the recurring series search POST call fails", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockRejectedValueOnce(makeAxiosResponseError());

    await expect(
      searchInvoicing(client, makeContext(), { resource_type: "recurring_series" } as any)
    ).rejects.toBeInstanceOf(LlmError);
  });
});

describe("204-vs-data response handling", () => {
  const cases: Array<{
    name: string;
    fn: (client: any, ctx: any, params: any) => Promise<any>;
    params: any;
    verb: "post" | "delete";
    url: string;
  }> = [
    {
      name: "cancelInvoiceAutoReminder",
      fn: cancelInvoiceAutoReminder,
      params: { invoice_id: "INV-1" },
      verb: "post",
      url: `${BASE_URL}/v2/invoicing/invoices/INV-1/cancel-reminders`,
    },
    {
      name: "cancelSentInvoice",
      fn: cancelSentInvoice,
      params: { invoice_id: "INV-1" },
      verb: "post",
      url: `${BASE_URL}/v2/invoicing/invoices/INV-1/cancel`,
    },
    {
      name: "deleteInvoice",
      fn: deleteInvoice,
      params: { invoice_id: "INV-1" },
      verb: "delete",
      url: `${BASE_URL}/v2/invoicing/invoices/INV-1`,
    },
    {
      name: "generateInvoiceQrCode",
      fn: generateInvoiceQrCode,
      params: { invoice_id: "INV-1" },
      verb: "post",
      url: `${BASE_URL}/v2/invoicing/invoices/INV-1/generate-qr-code`,
    },
    {
      name: "recordPaymentForInvoice",
      fn: recordPaymentForInvoice,
      params: { invoice_id: "INV-1", method: "CASH" },
      verb: "post",
      url: `${BASE_URL}/v2/invoicing/invoices/INV-1/payments`,
    },
    {
      name: "recordRefundForInvoice",
      fn: recordRefundForInvoice,
      params: { invoice_id: "INV-1", method: "CASH" },
      verb: "post",
      url: `${BASE_URL}/v2/invoicing/invoices/INV-1/refunds`,
    },
    {
      name: "createConditionalRulesForInvoice",
      fn: createConditionalRulesForInvoice,
      params: { invoice_id: "INV-1", rules: [{ conditional_rule_type: "AUTO_CANCEL" }] },
      verb: "post",
      url: `${BASE_URL}/v2/invoicing/invoices/INV-1/conditional-rules`,
    },
  ];

  it.each(cases)("$name returns {success: true, invoice_id} on a 204 response", async ({ fn, params, verb, url }) => {
    const client = makeMockClient();
    (mockedAxios[verb] as jest.Mock).mockResolvedValueOnce(makeAxiosResponse(undefined, 204));

    const result = await fn(client, makeContext(), params as any);

    expect(mockedAxios[verb]).toHaveBeenCalledWith(
      url,
      ...(verb === "delete" ? [{ headers: { Authorization: "Bearer test-token" } }] : [expect.any(Object), { headers: { Authorization: "Bearer test-token" } }])
    );
    expect(result).toEqual({ success: true, invoice_id: "INV-1" });
  });

  it.each(cases)("$name returns response.data on a non-204 response", async ({ fn, params, verb }) => {
    const client = makeMockClient();
    (mockedAxios[verb] as jest.Mock).mockResolvedValueOnce(makeAxiosResponse({ id: "INV-1", extra: true }, 200));

    const result = await fn(client, makeContext(), params as any);

    expect(result).toEqual({ id: "INV-1", extra: true });
  });

  it.each(cases)("$name throws an LlmError when the API call fails", async ({ fn, params, verb }) => {
    const client = makeMockClient();
    (mockedAxios[verb] as jest.Mock).mockRejectedValueOnce(makeAxiosResponseError());

    await expect(fn(client, makeContext(), params as any)).rejects.toBeInstanceOf(LlmError);
  });
});

describe("generateInvoiceNumber", () => {
  it("posts fetch_id: false to the generate-next-invoice-number endpoint", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse({ invoice_number: "0001" }));

    const result = await generateInvoiceNumber(client, makeContext(), {} as any);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${BASE_URL}/v2/invoicing/generate-next-invoice-number`,
      { fetch_id: false },
      { headers: { Authorization: "Bearer test-token" } }
    );
    expect(result).toEqual({ invoice_number: "0001" });
  });

  it("throws an LlmError when the API call fails", async () => {
    const client = makeMockClient();
    mockedAxios.post.mockRejectedValueOnce(makeAxiosResponseError());

    await expect(generateInvoiceNumber(client, makeContext(), {} as any)).rejects.toBeInstanceOf(LlmError);
  });
});
