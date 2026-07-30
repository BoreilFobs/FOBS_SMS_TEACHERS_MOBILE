import { useCallback, useEffect, useMemo, useState } from "react";
import { SocialPost } from "@/social/models";
import { useSocial } from "@/social/hooks/useSocial";
import { SOCIAL_POLLING } from "@/social/constants/network";
import { useThrottledFocusRefresh } from "@/social/hooks/usePolling";
import { SocialApiError } from "@/social/api/errors";

/**
 * The feed: first page, cursor pagination, pull-to-refresh, focus refresh.
 *
 * Ordering is the server's — it ranks by followed authors, subject match, recency
 * and engagement — so this hook keeps the ids in the order they arrived and reads
 * the post bodies out of the store. That way a reaction or comment made elsewhere
 * in the app updates the card in place without reshuffling the feed under the
 * reader's thumb.
 *
 * The feed is deliberately not polled: it refreshes on pull-to-refresh and on
 * screen focus (throttled), because re-ordering a list someone is scrolling is
 * hostile.
 */
export function useFeed() {
  const { repository, snapshot } = useSocial();
  const [order, setOrder] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<SocialApiError>();

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);

      try {
        const page = await repository.refreshFeed();
        setOrder(page.items.map((post) => post.id));
        setCursor(page.nextCursor);
        setError(undefined);
      } catch (cause) {
        setError(
          cause instanceof SocialApiError
            ? cause
            : new SocialApiError({
                message: cause instanceof Error ? cause.message : "The feed could not be loaded.",
                code: "UNKNOWN",
                status: 0,
                kind: "unknown",
              }),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [repository],
  );

  const refresh = useCallback(() => load("refresh"), [load]);

  useEffect(() => {
    void load("initial");
  }, [load]);

  useThrottledFocusRefresh(refresh, SOCIAL_POLLING.feedFocusThrottleMs);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const page = await repository.getFeed(cursor);
      setOrder((current) => [
        ...current,
        ...page.items.map((post) => post.id).filter((id) => !current.includes(id)),
      ]);
      setCursor(page.nextCursor);
      setError(undefined);
    } catch (cause) {
      if (cause instanceof SocialApiError) setError(cause);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, repository]);

  /**
   * Server order, current bodies. A post the server dropped (deleted, or its author
   * blocked) disappears because the store no longer holds it.
   */
  const items = useMemo<SocialPost[]>(() => {
    const byId = new Map(snapshot.posts.map((post) => [post.id, post]));
    return order
      .map((id) => byId.get(id))
      .filter((post): post is SocialPost => Boolean(post));
  }, [order, snapshot.posts]);

  return {
    items,
    loading,
    refreshing,
    loadingMore,
    // Screens render this as text, so expose the server's already-localised message.
    error: error?.message,
    offline: error?.kind === "offline",
    hasMore: Boolean(cursor),
    refresh,
    loadMore,
  };
}
