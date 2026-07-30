import Config from "@/constants/Config";
import { authFetch } from "@/services/authFetch";
import { SOCIAL_NETWORK } from "@/social/constants/network";
import { kindForStatus, SocialApiError } from "@/social/api/errors";

/**
 * HTTP client for the professional-network endpoints.
 *
 * Deliberately built on the app's existing `authFetch` wrapper rather than a new
 * axios instance, so token attachment stays in exactly one place. The behaviour
 * this adds on top of `authFetch` is the part every social screen needs and no
 * existing screen had: timeouts, the typed `{message, code, errors}` envelope,
 * offline classification, bounded retry for reads, and 401 handling.
 */

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  /** Retry on transport failure. Enabled for GET, never for writes. */
  retry?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/** Envelope for a single resource. */
interface DataEnvelope<T> {
  data: T;
}

/** Envelope for a cursor-paginated collection. */
export interface PageEnvelope<T> {
  data: T[];
  meta: {
    next_cursor: string | null;
    has_more: boolean;
    [key: string]: unknown;
  };
}

/** Called when the API reports the session is no longer valid. */
type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

/**
 * Registered once by the social provider. Kept as a hook rather than importing
 * the logout helper directly so this module has no dependency on navigation.
 */
export function onSocialUnauthorized(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

function buildUrl(path: string, query?: Query): string {
  const base = `${Config.apiBaseUrl}${path}`;

  if (!query) return base;

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.append(key, String(value));
  });

  const search = params.toString();
  return search ? `${base}?${search}` : base;
}

function isAbort(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.message.includes("Aborted"))
  );
}

/**
 * Whether a thrown error means "the app could not reach the server".
 *
 * React Native surfaces every transport failure — no route to host, DNS failure,
 * refused connection — as a TypeError from fetch, and they all mean the same thing
 * to a teacher. NetInfo is not a dependency of this project, so a transport
 * failure IS the offline signal.
 *
 * Detection is deliberately message-based as well as type-based:
 *   - `instanceof TypeError` fails across VM realms (it does not match under Jest),
 *     so it cannot be the only check;
 *   - the wording differs by runtime — React Native's polyfill says
 *     "Network request failed", Node/undici says "fetch failed" — so both are
 *     matched, along with the underlying `cause` a runtime may attach.
 */
const TRANSPORT_FAILURE_PATTERN =
  /network request failed|failed to fetch|fetch failed|network error|econnrefused|enotfound|econnreset|ehostunreach|etimedout|socket hang up/i;

function isTransportFailure(error: unknown): boolean {
  if (error instanceof TypeError) return true;

  if (!(error instanceof Error)) return false;

  if (error.name === "TypeError") return true;
  if (TRANSPORT_FAILURE_PATTERN.test(error.message)) return true;

  // undici nests the real reason (ECONNREFUSED and friends) under `cause`.
  const cause = (error as { cause?: unknown }).cause;
  if (cause instanceof Error) {
    return (
      cause.name === "TypeError" ||
      TRANSPORT_FAILURE_PATTERN.test(cause.message) ||
      TRANSPORT_FAILURE_PATTERN.test(String((cause as { code?: unknown }).code ?? ""))
    );
  }

  return false;
}

async function parseError(response: Response): Promise<SocialApiError> {
  let message = `Request failed with status ${response.status}.`;
  let code = `HTTP_${response.status}`;
  let fieldErrors: Record<string, string[]> = {};

  try {
    const payload = await response.json();
    if (payload && typeof payload === "object") {
      if (typeof payload.message === "string" && payload.message) {
        message = payload.message;
      }
      if (typeof payload.code === "string" && payload.code) {
        code = payload.code;
      }
      // Laravel sends `errors: []` when there are none, so guard the shape.
      if (payload.errors && !Array.isArray(payload.errors)) {
        fieldErrors = payload.errors as Record<string, string[]>;
      }
    }
  } catch {
    // Non-JSON error body (HTML error page, empty 502). Defaults stand.
  }

  return new SocialApiError({
    message,
    code,
    status: response.status,
    kind: kindForStatus(response.status),
    fieldErrors,
  });
}

async function execute(
  method: string,
  path: string,
  options: RequestOptions,
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? SOCIAL_NETWORK.requestTimeoutMs;
  const attempts = options.retry ? SOCIAL_NETWORK.maxRetries + 1 : 1;

  let lastError: SocialApiError | null = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // A caller-supplied signal (screen unmount) must still cancel the request.
    const abortFromCaller = () => controller.abort();
    options.signal?.addEventListener("abort", abortFromCaller);

    try {
      const response = await authFetch(buildUrl(path, options.query), {
        method,
        signal: controller.signal,
        body:
          options.body instanceof FormData
            ? options.body
            : options.body === undefined
              ? undefined
              : JSON.stringify(options.body),
      });

      if (response.ok) return response;

      const error = await parseError(response);

      if (error.kind === "unauthenticated") {
        unauthorizedHandler?.();
        throw error;
      }

      // Only transient server-side failures are worth another attempt; a 409 or
      // 422 will fail identically every time.
      if (attempt < attempts - 1 && (error.kind === "server" || error.kind === "rate-limited")) {
        lastError = error;
        await new Promise((resolve) =>
          setTimeout(resolve, SOCIAL_NETWORK.retryBackoffMs * (attempt + 1)),
        );
        continue;
      }

      throw error;
    } catch (cause) {
      if (cause instanceof SocialApiError) {
        if (cause === lastError) continue;
        throw cause;
      }

      // Caller-initiated cancellation must not be reported as a failure.
      if (options.signal?.aborted) throw cause;

      const error = isAbort(cause)
        ? SocialApiError.timeout()
        : isTransportFailure(cause)
          ? SocialApiError.offline()
          : new SocialApiError({
              message: cause instanceof Error ? cause.message : "Unexpected error.",
              code: "UNKNOWN",
              status: 0,
              kind: "unknown",
            });

      if (attempt < attempts - 1 && error.retryable) {
        lastError = error;
        await new Promise((resolve) =>
          setTimeout(resolve, SOCIAL_NETWORK.retryBackoffMs * (attempt + 1)),
        );
        continue;
      }

      throw error;
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abortFromCaller);
    }
  }

  throw lastError ?? SocialApiError.offline();
}

async function readJson<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
}

export const socialApi = {
  /** GET returning a single `{data}` envelope. */
  async get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await execute("GET", path, { ...options, retry: options.retry ?? true });
    const payload = await readJson<DataEnvelope<T>>(response);
    return payload?.data as T;
  },

  /** GET returning a `{data, meta}` page. */
  async getPage<T>(path: string, options: RequestOptions = {}): Promise<PageEnvelope<T>> {
    const response = await execute("GET", path, { ...options, retry: options.retry ?? true });
    const payload = await readJson<PageEnvelope<T>>(response);
    return payload ?? { data: [], meta: { next_cursor: null, has_more: false } };
  },

  /** GET returning the raw envelope, for endpoints with a non-list `data`. */
  async getRaw<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await execute("GET", path, { ...options, retry: options.retry ?? true });
    return readJson<T>(response);
  },

  async post<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await execute("POST", path, { ...options, retry: false });
    const payload = await readJson<DataEnvelope<T>>(response);
    return payload?.data as T;
  },

  async put<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await execute("PUT", path, { ...options, retry: false });
    const payload = await readJson<DataEnvelope<T>>(response);
    return payload?.data as T;
  },

  async patch<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await execute("PATCH", path, { ...options, retry: false });
    const payload = await readJson<DataEnvelope<T>>(response);
    return payload?.data as T;
  },

  async delete<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await execute("DELETE", path, { ...options, retry: false });
    const payload = await readJson<DataEnvelope<T>>(response);
    return payload?.data as T;
  },

  /** Multipart upload with progress, used for post images and profile photos. */
  async upload<T>(
    path: string,
    form: FormData,
    options: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {},
  ): Promise<T> {
    const { onProgress, signal } = options;

    // XMLHttpRequest rather than fetch: React Native's fetch cannot report
    // upload progress, and section 6 requires showing it.
    if (onProgress) {
      return uploadWithProgress<T>(path, form, onProgress, signal);
    }

    const response = await execute("POST", path, {
      body: form,
      retry: false,
      timeoutMs: SOCIAL_NETWORK.uploadTimeoutMs,
      signal,
    });
    const payload = await readJson<DataEnvelope<T>>(response);
    return payload?.data as T;
  },
};

async function uploadWithProgress<T>(
  path: string,
  form: FormData,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<T> {
  const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
  const token = await AsyncStorage.getItem("auth_token");

  return new Promise<T>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", buildUrl(path));
    request.timeout = SOCIAL_NETWORK.uploadTimeoutMs;
    request.setRequestHeader("Accept", "application/json");
    if (token) request.setRequestHeader("Authorization", `Bearer ${token}`);
    // Content-Type is intentionally unset: the runtime must add the multipart
    // boundary itself.

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(1, event.loaded / event.total));
      }
    };

    request.onload = () => {
      let payload: unknown;
      try {
        payload = request.responseText ? JSON.parse(request.responseText) : undefined;
      } catch {
        payload = undefined;
      }

      if (request.status >= 200 && request.status < 300) {
        onProgress(1);
        resolve((payload as DataEnvelope<T>)?.data as T);
        return;
      }

      const body = (payload ?? {}) as {
        message?: string;
        code?: string;
        errors?: Record<string, string[]>;
      };

      if (request.status === 401) unauthorizedHandler?.();

      reject(
        new SocialApiError({
          message: body.message ?? `Upload failed with status ${request.status}.`,
          code: body.code ?? `HTTP_${request.status}`,
          status: request.status,
          kind: kindForStatus(request.status),
          fieldErrors: Array.isArray(body.errors) ? {} : (body.errors ?? {}),
        }),
      );
    };

    request.onerror = () => reject(SocialApiError.offline());
    request.ontimeout = () => reject(SocialApiError.timeout());
    request.onabort = () =>
      reject(
        new SocialApiError({
          message: "Upload cancelled.",
          code: "UPLOAD_CANCELLED",
          status: 0,
          kind: "unknown",
        }),
      );

    signal?.addEventListener("abort", () => request.abort());

    request.send(form as unknown as Document);
  });
}
