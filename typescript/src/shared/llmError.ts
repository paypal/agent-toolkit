
export class LlmError extends Error {
  readonly ok = false;        // always false for errors
  readonly status?: number;   // HTTP status if known
  readonly code: string;      // stable, machine-parseable
  override readonly message: string; // short, human-readable (safe, no secrets)

  constructor({
    code,
    message,
    status,
  }: {
    code: string;
    message: string;
    status?: number;
  }) {
    super(message);
    this.code = code;
    this.message = message;
    this.status = status;

    // Set prototype explicitly (needed for instanceof to work when transpiled)
    Object.setPrototypeOf(this, LlmError.prototype);
  }

  /** Helper to safely serialize into plain object for JSON */
  toJSON() {
    return {
      ok: this.ok,
      status: this.status,
      code: this.code,
      message: this.message,
    };
  }
}

/**
 * Factory to normalize any error into an LlmError.
 */
export function toLlmError(
  err: unknown,
  {
    code = "PAYPAL_TOOL_ERROR",
    status,
    maxDetailLen = 200,
  }: { code?: string; status?: number; maxDetailLen?: number } = {}
): LlmError {
  const raw =
    typeof err === "string"
      ? err
      : (err as any)?.message ||
        (err as any)?.error?.message ||
        (err as any)?.toString?.() ||
        "Unknown error";

  const message = String(raw).slice(0, maxDetailLen);

  // Try to infer HTTP status from Axios-style error if not provided
  const inferredStatus =
    status ??
    (typeof err === "object" && err !== null
      ? (err as any)?.response?.status
      : undefined);

  return new LlmError({ code, message, status: inferredStatus });
}
