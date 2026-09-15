import { LlmError, toLlmError } from "../llmError";
import { handleAxiosError } from "../functions";
import {
  makeAxiosResponseError,
  makeAxiosNoResponseError,
  makeAxiosSetupError,
} from "./testUtils";

describe("LlmError", () => {
  it("carries code, message, and status, and serializes via toJSON", () => {
    const err = new LlmError({ code: "SOME_CODE", message: "Something broke", status: 404 });

    expect(err.ok).toBe(false);
    expect(err.code).toBe("SOME_CODE");
    expect(err.message).toBe("Something broke");
    expect(err.status).toBe(404);
    expect(err.toJSON()).toEqual({ ok: false, status: 404, code: "SOME_CODE", message: "Something broke" });
    expect(err).toBeInstanceOf(LlmError);
    expect(err).toBeInstanceOf(Error);
  });
});

describe("toLlmError", () => {
  it("extracts message from a plain Error", () => {
    const err = toLlmError(new Error("boom"));
    expect(err.message).toBe("boom");
    expect(err.code).toBe("PAYPAL_TOOL_ERROR");
  });

  it("extracts message from a string", () => {
    const err = toLlmError("plain string error");
    expect(err.message).toBe("plain string error");
  });

  it("extracts message from an error-like nested error.message shape", () => {
    const err = toLlmError({ error: { message: "nested message" } });
    expect(err.message).toBe("nested message");
  });

  it("falls back to the object's stringified form when it has no message field", () => {
    // {} has a default toString() (-> "[object Object]"), so the "Unknown error"
    // fallback is only reached when even toString() is unavailable.
    const err = toLlmError({});
    expect(err.message).toBe("[object Object]");
  });

  it("falls back to 'Unknown error' when the value has no message and no toString", () => {
    const err = toLlmError(Object.create(null));
    expect(err.message).toBe("Unknown error");
  });

  it("truncates the message to maxDetailLen", () => {
    const err = toLlmError("x".repeat(300), { maxDetailLen: 10 });
    expect(err.message).toHaveLength(10);
  });

  it("infers status from an axios-style response error when not explicitly provided", () => {
    const err = toLlmError({ response: { status: 503 } });
    expect(err.status).toBe(503);
  });

  it("prefers an explicitly provided status over an inferred one", () => {
    const err = toLlmError({ response: { status: 503 } }, { status: 200 });
    expect(err.status).toBe(200);
  });
});

describe("handleAxiosError", () => {
  it("maps a response error to PAYPAL_API_HTTP_ERROR with the response status", () => {
    const axiosErr = makeAxiosResponseError({ status: 422, data: { message: "Invalid invoice_id" } });

    expect(() => handleAxiosError(axiosErr)).toThrow(LlmError);
    try {
      handleAxiosError(axiosErr);
    } catch (e) {
      const err = e as LlmError;
      expect(err.code).toBe("PAYPAL_API_HTTP_ERROR");
      expect(err.status).toBe(422);
      expect(err.message).toBe("Invalid invoice_id");
    }
  });

  it("appends detail descriptions to the base message when present", () => {
    const axiosErr = makeAxiosResponseError({
      status: 400,
      data: {
        message: "Validation error",
        details: [{ description: "field X is required" }, { issue: "field Y invalid" }],
      },
    });

    try {
      handleAxiosError(axiosErr);
      fail("expected handleAxiosError to throw");
    } catch (e) {
      const err = e as LlmError;
      expect(err.message).toBe("Validation error: field X is required; field Y invalid");
    }
  });

  it("falls back to error_description/name when no message is present", () => {
    const axiosErr = makeAxiosResponseError({ status: 401, data: { error_description: "Unauthorized" } });

    try {
      handleAxiosError(axiosErr);
      fail("expected handleAxiosError to throw");
    } catch (e) {
      expect((e as LlmError).message).toBe("Unauthorized");
    }
  });

  it("maps a no-response error to PAYPAL_API_NO_RESPONSE", () => {
    const axiosErr = makeAxiosNoResponseError();

    try {
      handleAxiosError(axiosErr);
      fail("expected handleAxiosError to throw");
    } catch (e) {
      const err = e as LlmError;
      expect(err.code).toBe("PAYPAL_API_NO_RESPONSE");
      expect(err.status).toBeUndefined();
    }
  });

  it("maps a request-setup error to PAYPAL_API_SETUP_ERROR", () => {
    const axiosErr = makeAxiosSetupError("Invalid base URL");

    try {
      handleAxiosError(axiosErr);
      fail("expected handleAxiosError to throw");
    } catch (e) {
      const err = e as LlmError;
      expect(err.code).toBe("PAYPAL_API_SETUP_ERROR");
      expect(err.message).toBe("Invalid base URL");
    }
  });
});
