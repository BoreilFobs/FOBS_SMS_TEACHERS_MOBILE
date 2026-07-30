import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { SocialApiError } from "@/social/api/errors";

/**
 * Loads one social resource and tracks its loading, error and retry state.
 *
 * The mock repository populated everything in memory at construction, so phase 1
 * screens read the snapshot without ever fetching. With a real API each screen has
 * to ask for its own data, and this hook is the shared way to do that: fetch on
 * mount, refetch on focus, expose a retry, and never throw into the render tree.
 *
 * Screens keep reading `snapshot.*` for the data itself — this only drives the
 * request and the surrounding states.
 */
export interface SocialResourceState {
  loading: boolean;
  refreshing: boolean;
  error?: SocialApiError;
  /** True when the failure was connectivity rather than a rejected request. */
  offline: boolean;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
}

export function useSocialResource(
  load: () => Promise<unknown>,
  options: { refetchOnFocus?: boolean; enabled?: boolean } = {},
): SocialResourceState {
  const { refetchOnFocus = true, enabled = true } = options;

  const loadRef = useRef(load);
  loadRef.current = load;

  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<SocialApiError>();

  // Guards against a state update after the screen has gone away.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!enabled) return;

      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);

      try {
        await loadRef.current();
        if (mountedRef.current) setError(undefined);
      } catch (cause) {
        if (!mountedRef.current) return;

        setError(
          cause instanceof SocialApiError
            ? cause
            : new SocialApiError({
                message: cause instanceof Error ? cause.message : "Something went wrong.",
                code: "UNKNOWN",
                status: 0,
                kind: "unknown",
              }),
        );
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [enabled],
  );

  const refresh = useCallback(() => run("refresh"), [run]);
  const retry = useCallback(() => run("initial"), [run]);

  useEffect(() => {
    if (enabled) void run("initial");
  }, [enabled, run]);

  // Coming back to a screen should show current data, not what it held minutes ago.
  const firstFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (!refetchOnFocus || !enabled) return undefined;

      // The mount effect already covers the first focus.
      if (firstFocusRef.current) {
        firstFocusRef.current = false;
        return undefined;
      }

      void run("refresh");
      return undefined;
    }, [enabled, refetchOnFocus, run]),
  );

  return {
    loading,
    refreshing,
    error,
    offline: error?.kind === "offline",
    refresh,
    retry,
  };
}
