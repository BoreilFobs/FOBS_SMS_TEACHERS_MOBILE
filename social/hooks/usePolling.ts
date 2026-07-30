import { useCallback, useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useFocusEffect } from "expo-router";

/**
 * Interval polling that respects screen focus and app state.
 *
 * The backend has no broadcasting layer yet, so polling is how the client learns
 * about new messages and notifications. Every timer here:
 *   - runs only while the screen is focused,
 *   - pauses when the app goes to the background,
 *   - fires once immediately on focus/foreground so a returning user is not
 *     looking at stale content for a full interval,
 *   - and is cleared on blur and unmount.
 *
 * Intervals come from `social/constants/network.ts`. Nothing here holds a
 * magic number.
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  options: { enabled?: boolean; immediate?: boolean } = {},
): void {
  const { enabled = true, immediate = true } = options;

  // Keeps the latest callback without restarting the timer on every render.
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);

  /** Skips a tick if the previous request has not settled, so a slow network cannot queue up requests. */
  const run = useCallback(async () => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    try {
      await callbackRef.current();
    } catch {
      // A failed poll is not an error the user needs to see — the next tick
      // retries, and the screen's own fetch surfaces real failures.
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    if (!enabled || intervalMs <= 0) return;

    if (immediate) void run();
    timerRef.current = setInterval(() => void run(), intervalMs);
  }, [enabled, immediate, intervalMs, run, stop]);

  // Focus/blur drives the timer for the screen this hook is mounted in.
  useFocusEffect(
    useCallback(() => {
      start();
      return stop;
    }, [start, stop]),
  );

  // Background/foreground drives it for the app as a whole.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        start();
      } else {
        stop();
      }
    });

    return () => {
      subscription.remove();
      stop();
    };
  }, [start, stop]);
}

/**
 * Runs a callback when the screen regains focus, no more often than
 * `throttleMs`. Used for the feed, which is refreshed on focus and pull-to-refresh
 * but deliberately not polled while it is being scrolled.
 */
export function useThrottledFocusRefresh(
  callback: () => void | Promise<void>,
  throttleMs: number,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const lastRunRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();

      if (now - lastRunRef.current >= throttleMs) {
        lastRunRef.current = now;
        void callbackRef.current();
      }

      return undefined;
    }, [throttleMs]),
  );
}

/** Fires when the app returns to the foreground. For badge counts. */
export function useForegroundRefresh(callback: () => void | Promise<void>): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") void callbackRef.current();
    });

    return () => subscription.remove();
  }, []);
}
