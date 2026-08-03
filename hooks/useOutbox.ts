import { useCallback, useEffect, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { outbox, OutboxEntry } from "@/utils/offline/outbox";

export function usePendingWrites(kind?: OutboxEntry["kind"]) {
  const entries = useSyncExternalStore(
    outbox.subscribe,
    outbox.getSnapshot,
    outbox.getSnapshot,
  );
  return kind ? entries.filter((entry) => entry.kind === kind) : entries;
}

/**
 * Drains the offline outbox.
 *
 * There is no connectivity library in this project, so rather than polling a
 * network flag we simply retry: on mount, whenever the app returns to the
 * foreground, and on a slow timer. A flush that is still offline fails fast on
 * the first request and leaves the queue untouched.
 */
export function useOutboxSync(intervalMs = 30_000) {
  const flush = useCallback(() => {
    void outbox.flush();
  }, []);

  useEffect(() => {
    void outbox.hydrate().then(flush);

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") flush();
    });
    const timer = setInterval(flush, intervalMs);

    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [flush, intervalMs]);

  return flush;
}
