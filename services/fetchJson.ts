import { authFetch } from "@/services/authFetch";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Authenticated GET/POST returning a parsed JSON payload.
 *
 * Screens previously called `response.json()` directly, which throws a raw
 * SyntaxError whenever the server answers with something that is not JSON —
 * a 404 HTML page, a PHP fatal, or an unreachable dev server. That surfaced as
 * an unhandled error instead of an in-screen message, so the parse is guarded
 * here and every failure becomes an ApiError with a readable reason.
 */
export async function fetchJson<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await authFetch(url, init);
  } catch {
    // fetch only rejects for transport-level problems: server down, DNS,
    // offline, or a blocked cross-origin request.
    throw new ApiError("Cannot reach the server. Check your connection.");
  }

  const body = await response.text();
  let payload: (T & { success?: boolean; message?: string }) | undefined;

  if (body) {
    try {
      payload = JSON.parse(body);
    } catch {
      throw new ApiError(
        response.ok
          ? "The server returned an unexpected response."
          : `Request failed (${response.status}).`,
        response.status,
      );
    }
  }

  if (!response.ok || payload?.success === false) {
    throw new ApiError(
      payload?.message ?? `Request failed (${response.status}).`,
      response.status,
    );
  }

  return payload as T;
}
