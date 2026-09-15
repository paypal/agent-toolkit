import type { Context } from "../configuration";
import type PayPalClient from "../client";

export function makeMockClient(): jest.Mocked<PayPalClient> {
  return {
    getBaseUrl: jest.fn().mockReturnValue("https://api-m.sandbox.paypal.com"),
    getHeaders: jest.fn().mockResolvedValue({ Authorization: "Bearer test-token" }),
  } as unknown as jest.Mocked<PayPalClient>;
}

export function makeContext(overrides: Partial<Context> = {}): Context {
  return { sandbox: true, merchant_id: "MERCHANT-1", ...overrides };
}

export function makeAxiosResponse<T>(data: T, status = 200) {
  return { data, status, statusText: "OK", headers: {}, config: {} as any };
}

export function makeAxiosResponseError({
  status = 400,
  data = { message: "Bad Request" },
}: { status?: number; data?: any } = {}) {
  return {
    isAxiosError: true,
    message: "Request failed",
    response: { status, data, headers: {} },
  };
}

export function makeAxiosNoResponseError() {
  return {
    isAxiosError: true,
    message: "No response received",
    request: {},
  };
}

export function makeAxiosSetupError(message = "Invalid config") {
  return {
    isAxiosError: true,
    message,
  };
}
