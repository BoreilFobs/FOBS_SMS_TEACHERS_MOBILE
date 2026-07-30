/**
 * Every network and polling timing for the professional network lives here.
 *
 * Real-time push is not available yet — the backend is REST-only (no
 * broadcasting configured). These intervals are the client-side stand-in.
 * When Reverb/Pusher lands, the polling hooks that read these values are the
 * only things that need to change; see docs/SOCIAL_API_MIGRATION.md.
 */
export const SOCIAL_NETWORK = {
  /** Per-request timeout. Matches the tolerance of the existing screens. */
  requestTimeoutMs: 15_000,

  /** Multipart uploads need a longer ceiling than JSON calls. */
  uploadTimeoutMs: 60_000,

  /** Retries apply to idempotent GETs only, never to writes. */
  maxRetries: 2,
  retryBackoffMs: 600,

  /** Default page size for cursor-paginated lists. Server caps at 50. */
  pageSize: 20,
} as const;

export const SOCIAL_POLLING = {
  /**
   * Open conversation: short interval, focused-only. Paused on blur and when the
   * app is backgrounded.
   */
  openConversationMs: 7_000,

  /** Conversation list and its unread badge. Also refreshes on focus. */
  conversationListMs: 45_000,

  /** Notification list and badge. Also refreshes on app foreground. */
  notificationsMs: 45_000,

  /**
   * The feed is deliberately NOT polled while scrolling — it refreshes on
   * pull-to-refresh and on screen focus, with this as a floor between
   * focus-triggered refreshes so tab-switching cannot hammer the API.
   */
  feedFocusThrottleMs: 30_000,
} as const;
