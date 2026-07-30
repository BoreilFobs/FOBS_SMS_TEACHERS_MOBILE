/**
 * Hermetic tests for the API client's failure classification.
 *
 * These matter because the classification is what the UI branches on: `offline`
 * shows the offline state, `timeout` offers a retry, `validation` shows field
 * errors, and `conflict` shows a business-rule message. Getting the mapping wrong
 * silently degrades every social screen's error handling.
 *
 * `global.fetch` is stubbed with the exact error shapes the real runtimes throw,
 * which is more precise than pointing a request at a dead port.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { SocialApiError } from "@/social/api/errors";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.0.0", extra: { apiBaseUrl: "https://example.test/api" } } },
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: { getItem: async () => "token-123" },
}));

const jsonResponse = (status: number, body: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  }) as unknown as Response;

/** Typed stub for `global.fetch`, so the assignments below type-check. */
type FetchStub = jest.Mock<typeof globalThis.fetch>;

const stubFetch = (impl: () => Promise<Response>): FetchStub => {
  const stub = jest.fn(impl) as unknown as FetchStub;
  global.fetch = stub as unknown as typeof globalThis.fetch;
  return stub;
};

const rejectFetch = (error: unknown): FetchStub =>
  stubFetch(() => Promise.reject(error));

const resolveFetch = (response: Response): FetchStub =>
  stubFetch(() => Promise.resolve(response));

describe("socialApi failure classification", () => {
  let socialApi: typeof import("@/social/api/client").socialApi;

  beforeEach(() => {
    // `require` rather than dynamic import: this jest config runs without
    // --experimental-vm-modules, so `import()` is unavailable inside tests.
    jest.resetModules();
    ({ socialApi } = require("@/social/api/client"));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reports a React Native transport failure as offline", async () => {
    // What the RN fetch polyfill throws with no connectivity.
    rejectFetch(new TypeError("Network request failed"));

    await expect(socialApi.get("/social/feed", { retry: false })).rejects.toMatchObject({
      kind: "offline",
      code: "OFFLINE",
    });
  });

  it("reports a Node/undici transport failure as offline, including its nested cause", async () => {
    // What Node throws for a refused connection. `instanceof TypeError` is
    // unreliable across VM realms, so the message and cause must also be matched.
    const error = new TypeError("fetch failed");
    (error as { cause?: unknown }).cause = Object.assign(
      new Error("connect ECONNREFUSED 127.0.0.1:9187"),
      { code: "ECONNREFUSED" },
    );
    rejectFetch(error);

    await expect(socialApi.get("/social/feed", { retry: false })).rejects.toMatchObject({
      kind: "offline",
    });
  });

  it("reports an aborted request as a timeout", async () => {
    const abort = new Error("Aborted");
    abort.name = "AbortError";
    rejectFetch(abort);

    await expect(socialApi.get("/social/feed", { retry: false })).rejects.toMatchObject({
      kind: "timeout",
      code: "TIMEOUT",
    });
  });

  it("preserves the server's message, stable code and field errors on a 422", async () => {
    resolveFetch(jsonResponse(422, {
        message: "Add some text or an image before publishing.",
        code: "VALIDATION_FAILED",
        errors: { text: ["Add some text or an image before publishing."] },
      }),);

    try {
      await socialApi.post("/social/posts", { body: {} });
      throw new Error("expected a rejection");
    } catch (cause) {
      const error = cause as SocialApiError;
      expect(error.kind).toBe("validation");
      expect(error.code).toBe("VALIDATION_FAILED");
      // The screen shows this; it must be the localised sentence, not the code.
      expect(error.fieldError("text")).toBe("Add some text or an image before publishing.");
    }
  });

  it("maps a 409 to a conflict carrying the business-rule code", async () => {
    resolveFetch(jsonResponse(409, {
        message: "You have already applied to this opportunity.",
        code: "ALREADY_APPLIED",
        errors: [],
      }),);

    await expect(socialApi.post("/jobs/1/applications", { body: {} })).rejects.toMatchObject({
      kind: "conflict",
      code: "ALREADY_APPLIED",
      message: "You have already applied to this opportunity.",
    });
  });

  it("treats Laravel's empty `errors: []` as no field errors", async () => {
    resolveFetch(jsonResponse(403, { message: "Nope.", code: "BLOCK_CONFLICT", errors: [] }));

    try {
      await socialApi.put("/social/teachers/2/follow");
      throw new Error("expected a rejection");
    } catch (cause) {
      const error = cause as SocialApiError;
      // An array would break `fieldError`, so the client normalises it away.
      expect(error.fieldErrors).toEqual({});
      expect(error.fieldError("anything")).toBeUndefined();
    }
  });

  it("notifies the unauthorized handler on a 401 so the app can sign out once", async () => {
    const { onSocialUnauthorized } = require("@/social/api/client");
    const handler = jest.fn();
    onSocialUnauthorized(handler);

    resolveFetch(jsonResponse(401, { message: "Unauthenticated.", code: "UNAUTHENTICATED" }));

    await expect(socialApi.get("/social/feed", { retry: false })).rejects.toMatchObject({
      kind: "unauthenticated",
    });
    expect(handler).toHaveBeenCalledTimes(1);

    onSocialUnauthorized(null);
  });

  it("retries a 500 on a GET but never retries a write", async () => {
    const failing = resolveFetch(jsonResponse(500, { message: "Server error.", code: "HTTP_500" }));

    await expect(socialApi.get("/social/feed")).rejects.toMatchObject({ kind: "server" });
    // maxRetries = 2, so three attempts in total.
    expect(failing).toHaveBeenCalledTimes(3);

    failing.mockClear();
    await expect(socialApi.post("/social/posts", { body: {} })).rejects.toMatchObject({
      kind: "server",
    });
    // A write must be attempted exactly once — retrying could double-publish.
    expect(failing).toHaveBeenCalledTimes(1);
  }, 15_000);

  it("does not retry a 422", async () => {
    const failing = resolveFetch(jsonResponse(422, { message: "Invalid.", code: "VALIDATION_FAILED" }));

    await expect(socialApi.get("/social/feed")).rejects.toMatchObject({ kind: "validation" });
    expect(failing).toHaveBeenCalledTimes(1);
  });

  it("returns the unwrapped `data` payload on success", async () => {
    resolveFetch(jsonResponse(200, { data: { id: "7" } }));

    await expect(socialApi.get<{ id: string }>("/social/posts/7")).resolves.toEqual({ id: "7" });
  });

  it("returns an empty page rather than throwing when a list response has no body", async () => {
    resolveFetch({
      ok: true,
      status: 204,
      text: async () => "",
      json: async () => undefined,
    } as unknown as Response);

    await expect(socialApi.getPage("/social/feed")).resolves.toEqual({
      data: [],
      meta: { next_cursor: null, has_more: false },
    });
  });
});
