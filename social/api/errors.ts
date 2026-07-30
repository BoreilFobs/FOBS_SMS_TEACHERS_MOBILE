/**
 * Error type for every social API call.
 *
 * The Laravel backend answers failures with a stable envelope:
 *   { "message": "Human readable", "code": "STABLE_CODE", "errors": { field: [..] } }
 *
 * `code` is what the UI switches on — it is stable across locales, whereas
 * `message` is already translated server-side using the account's locale.
 * Screens should prefer `message` for display and `code` for branching.
 */
export type SocialErrorKind =
  | "offline"
  | "timeout"
  | "unauthenticated"
  | "forbidden"
  | "not-found"
  | "conflict"
  | "validation"
  | "rate-limited"
  | "server"
  | "unknown";

export class SocialApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly kind: SocialErrorKind;
  readonly fieldErrors: Record<string, string[]>;

  constructor(params: {
    message: string;
    code: string;
    status: number;
    kind: SocialErrorKind;
    fieldErrors?: Record<string, string[]>;
  }) {
    super(params.message);
    this.name = "SocialApiError";
    this.code = params.code;
    this.status = params.status;
    this.kind = params.kind;
    this.fieldErrors = params.fieldErrors ?? {};
  }

  /** The device could not reach the API at all. */
  static offline(): SocialApiError {
    return new SocialApiError({
      message: "You appear to be offline.",
      code: "OFFLINE",
      status: 0,
      kind: "offline",
    });
  }

  static timeout(): SocialApiError {
    return new SocialApiError({
      message: "The request took too long. Please try again.",
      code: "TIMEOUT",
      status: 0,
      kind: "timeout",
    });
  }

  /** First message for `field`, for inline form errors. */
  fieldError(field: string): string | undefined {
    return this.fieldErrors[field]?.[0];
  }

  /** True when retrying the same request could plausibly succeed. */
  get retryable(): boolean {
    return (
      this.kind === "offline" ||
      this.kind === "timeout" ||
      this.kind === "rate-limited" ||
      this.kind === "server"
    );
  }
}

export function kindForStatus(status: number): SocialErrorKind {
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 404) return "not-found";
  if (status === 409) return "conflict";
  if (status === 422) return "validation";
  if (status === 429) return "rate-limited";
  if (status >= 500) return "server";
  return "unknown";
}

/**
 * Narrowing helper so screens can branch on a backend rule without importing the
 * class everywhere.
 */
export function isSocialErrorCode(error: unknown, ...codes: string[]): boolean {
  return error instanceof SocialApiError && codes.includes(error.code);
}
