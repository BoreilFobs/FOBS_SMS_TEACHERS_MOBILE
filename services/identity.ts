import AsyncStorage from "@react-native-async-storage/async-storage";
import Config from "@/constants/Config";

/**
 * Client for the shared email-identity API.
 *
 * Every call here hits the SAME backend endpoints the web panel uses, so the
 * two platforms cannot drift apart on expiry, cooldown, attempt limits, or the
 * duplicate-matching algorithm. There is no mobile-specific verification logic.
 *
 * Replaces the previous WhatsApp/phone OTP flow entirely — no phone number is
 * involved in verification or password recovery any more.
 */

/** Mirrors the backend's VerificationCodeService constants. */
export const IDENTITY_POLICY = {
  codeLength: 6,
  expiryMinutes: 15,
  resendCooldownSeconds: 60,
  maxAttempts: 5,
} as const;

export interface SimilarAccount {
  id: number;
  masked_email: string;
  school_count: number;
  class_count: number;
  subject_count: number;
}

export interface IdentityError extends Error {
  status: number;
  reason?: string;
  retryAfter?: number;
  fieldErrors: Record<string, string[]>;
}

function toIdentityError(status: number, body: any, fallback: string): IdentityError {
  const error = new Error(body?.message ?? fallback) as IdentityError;
  error.status = status;
  error.reason = body?.reason;
  error.retryAfter = body?.retry_after;
  // Laravel sends `errors: []` when there are none; guard the shape.
  error.fieldErrors = body?.errors && !Array.isArray(body.errors) ? body.errors : {};
  return error;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${Config.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch {
    const offline = new Error("Unable to reach FobsSMS. Check your connection.") as IdentityError;
    offline.status = 0;
    offline.reason = "offline";
    offline.fieldErrors = {};
    throw offline;
  }

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw toIdentityError(response.status, body, "Something went wrong. Please try again.");
  }

  return body as T;
}

// ---------------------------------------------------------------- verification

export interface VerificationSession {
  token: string;
  user: { id: number; name: string; email: string };
}

/** Completes registration verification and returns a signed-in session. */
export async function verifyEmailCode(email: string, code: string): Promise<VerificationSession> {
  return request<VerificationSession>("/auth/email/verify", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
  });
}

/** Sends a fresh verification email. Server enforces the 60-second cooldown. */
export async function resendVerification(email: string): Promise<{ cooldown_seconds: number }> {
  return request("/auth/email/resend", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

/** Lets a returning user resume an interrupted signup. */
export async function emailStatus(email: string): Promise<{ verified: boolean | null; cooldown_seconds: number }> {
  const query = encodeURIComponent(email.trim().toLowerCase());
  return request(`/auth/email/status?email=${query}`);
}

// -------------------------------------------------------------- password reset

/**
 * Requests a reset. Always resolves, whether or not the address exists — the
 * backend deliberately does not confirm account existence here.
 */
export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  return request("/auth/password/forgot", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

/** Completes a reset with the typed code, returning a fresh session. */
export async function resetPassword(
  email: string,
  code: string,
  password: string,
): Promise<VerificationSession> {
  return request("/auth/password/reset", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      code,
      password,
      password_confirmation: password,
    }),
  });
}

// ------------------------------------------------------------- disambiguation

export interface SimilarAccountsResponse {
  exact_match: boolean;
  has_similar: boolean;
  candidates: SimilarAccount[];
}

/**
 * Close matches for an address.
 *
 * Heavily throttled server-side (10/min per IP) because it is the one endpoint
 * that discloses anything about accounts the caller has not authenticated as —
 * and even then only a masked address and three counts.
 */
export async function findSimilarAccounts(
  email: string,
  context: "registration" | "login" | "password_reset",
): Promise<SimilarAccountsResponse> {
  return request("/auth/accounts/similar", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase(), context }),
  });
}

// --------------------------------------------------------------- consolidation

export interface ConsolidationStart {
  email_verification_required: boolean;
  surviving_user_id: number;
  deletion_count: number;
  candidate_ids: number[];
  grace_days: number;
  masked_email?: string;
  message?: string;
}

/**
 * Step 1 — choose the surviving account.
 *
 * Deletes nothing. If a corrected address was supplied, this only sends an
 * ownership code to it.
 */
export async function startConsolidation(params: {
  survivingUserId: number;
  candidateIds: number[];
  searchedEmail: string;
  newEmail?: string;
  triggeredBy: "registration" | "login" | "password_reset";
}): Promise<ConsolidationStart> {
  return request("/auth/consolidation/start", {
    method: "POST",
    body: JSON.stringify({
      surviving_user_id: params.survivingUserId,
      candidate_ids: params.candidateIds,
      searched_email: params.searchedEmail.trim().toLowerCase(),
      new_email: params.newEmail?.trim().toLowerCase(),
      triggered_by: params.triggeredBy,
    }),
  });
}

export interface OwnershipConfirmation {
  verified_email: string;
  surviving_user_id: number;
  conflict: boolean;
  conflict_masked_email: string | null;
}

/** Step 2 — prove the claimed address is reachable. Still deletes nothing. */
export async function confirmEmailOwnership(
  email: string,
  code: string,
): Promise<OwnershipConfirmation> {
  return request("/auth/consolidation/confirm-email", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
  });
}

/**
 * Step 3 — perform the deletions and the email reassignment.
 *
 * Only ever called after the user has confirmed, in a dedicated dialog, exactly
 * how many accounts will be deleted. The server independently re-checks that a
 * consumed ownership code exists before touching anything.
 */
export async function completeConsolidation(params: {
  survivingUserId: number;
  candidateIds: number[];
  newEmail?: string;
  confirmConflictDeletion?: boolean;
  triggeredBy: "registration" | "login" | "password_reset";
}): Promise<VerificationSession & { deleted_count: number; message: string; grace_notice: string }> {
  return request("/auth/consolidation/complete", {
    method: "POST",
    body: JSON.stringify({
      surviving_user_id: params.survivingUserId,
      candidate_ids: params.candidateIds,
      new_email: params.newEmail?.trim().toLowerCase(),
      confirm_deletion: true,
      confirm_conflict_deletion: params.confirmConflictDeletion ?? false,
      triggered_by: params.triggeredBy,
    }),
  });
}

// ---------------------------------------------------------------------- session

/** Stores a session returned by any identity endpoint. */
export async function persistSession(session: VerificationSession): Promise<void> {
  await AsyncStorage.multiSet([
    ["auth_token", String(session.token)],
    ["user", JSON.stringify(session.user)],
    ["user_id", String(session.user.id)],
  ]);
}
