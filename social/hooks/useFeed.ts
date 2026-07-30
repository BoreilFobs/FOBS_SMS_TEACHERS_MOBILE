import { useCallback, useEffect, useState } from "react";
import { SocialPost } from "@/social/models";
import { useSocial } from "@/social/hooks/useSocial";

export function useFeed() {
  const { repository, snapshot } = useSocial();
  const [items, setItems] = useState<SocialPost[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(undefined);
    try {
      const page = await repository.refreshFeed();
      setItems(page.items);
      setCursor(page.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "SOCIAL_MOCK_UNAVAILABLE");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [repository]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!loading && !refreshing) {
      const currentIds = new Set(snapshot.posts.map((post) => post.id));
      if (items.some((post) => !currentIds.has(post.id))) {
        void refresh();
      } else {
        setItems((current) =>
          current.map(
            (post) => snapshot.posts.find((candidate) => candidate.id === post.id) ?? post,
          ),
        );
      }
    }
  }, [items, loading, refresh, refreshing, snapshot.posts]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await repository.getFeed(cursor);
      setItems((current) => [
        ...current,
        ...page.items.filter(
          (post) => !current.some((existing) => existing.id === post.id),
        ),
      ]);
      setCursor(page.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "SOCIAL_MOCK_UNAVAILABLE");
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, repository]);

  return {
    items,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore: Boolean(cursor),
    refresh,
    loadMore,
  };
}
