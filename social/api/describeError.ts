import { SocialApiError } from "@/social/api/errors";

/**
 * The message to show a teacher for a failed social action.
 *
 * The backend already localises its messages using the account's locale and
 * states the actual rule that was broken — "You have already applied to this
 * opportunity", "You and this teacher must follow each other before messaging" —
 * so that text is far more useful than a generic client-side string. This helper
 * prefers it, and only falls back when there is nothing usable.
 *
 * Section 3 of the migration brief: surface real validation and business-rule
 * errors, not generic failure messages.
 */
export function describeSocialError(cause: unknown, fallback: string): string {
  if (!(cause instanceof SocialApiError)) {
    return cause instanceof Error && cause.message ? cause.message : fallback;
  }

  // Field-level validation reads better as the specific field complaint.
  const firstField = Object.keys(cause.fieldErrors)[0];
  if (cause.kind === "validation" && firstField) {
    const detail = cause.fieldError(firstField);
    if (detail) return detail;
  }

  return cause.message || fallback;
}

/** True when the action can sensibly be offered again as-is. */
export function isRetryableSocialError(cause: unknown): boolean {
  return cause instanceof SocialApiError && cause.retryable;
}
