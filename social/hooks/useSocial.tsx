import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { socialRepositories } from "@/social/services/repositories";
import { onSocialUnauthorized } from "@/social/api/client";
import { SOCIAL_POLLING } from "@/social/constants/network";
import { useForegroundRefresh } from "@/social/hooks/usePolling";
import { handleSessionExpired } from "@/utils/auth";
import useUserStore from "@/utils/stores/userStore";
import { cacheKeys, readCache, writeCache } from "@/utils/offline/cache";

type SocialContextValue = {
  repository: typeof socialRepositories;
  snapshot: ReturnType<typeof socialRepositories.getSnapshot>;
  unreadMessages: number;
  unreadNotifications: number;
  /** Per-category unread counts straight from the server. */
  unreadByCategory: { social: number; jobs: number; school: number };
  refreshUnreadCounts: () => Promise<void>;
};

const SocialContext = createContext<SocialContextValue | null>(null);

interface UnreadCounts {
  social: number;
  jobs: number;
  school: number;
  messages: number;
  total: number;
}

const emptyCounts: UnreadCounts = { social: 0, jobs: 0, school: 0, messages: 0, total: 0 };

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const user = useUserStore((state) => state.user);
  const snapshot = useSyncExternalStore(
    socialRepositories.subscribe,
    socialRepositories.getSnapshot,
    socialRepositories.getSnapshot,
  );

  /**
   * Badge counts come from `/notifications/unread-counts` rather than being
   * derived from the cached snapshot. The snapshot only holds the pages that have
   * been fetched, so counting it would under-report; the server knows the totals.
   */
  const [counts, setCounts] = useState(emptyCounts);
  // False until the server (or the cache of a previous server reply) has given
  // us real totals. Until then the badges fall back to what is locally known.
  const [hasServerCounts, setHasServerCounts] = useState(false);

  // Restore the last known totals before the network answers, so a cold start
  // — or a start with no connection — shows real numbers instead of zeros.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const cached = await readCache<UnreadCounts>(cacheKeys.unreadCounts(user.id));
      if (cancelled || !cached) return;
      setCounts((current) => (current === emptyCounts ? cached : current));
      setHasServerCounts(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const refreshUnreadCounts = useCallback(async () => {
    if (!user) return;

    try {
      const next = await socialRepositories.getUnreadCounts();
      const resolved = {
        social: Number(next.social ?? 0),
        jobs: Number(next.jobs ?? 0),
        school: Number(next.school ?? 0),
        messages: Number(next.messages ?? 0),
        total: Number(next.total ?? 0),
      };
      setCounts(resolved);
      setHasServerCounts(true);
      void writeCache(cacheKeys.unreadCounts(user.id), resolved);
    } catch {
      // Offline or the endpoint is unreachable. The badges keep whatever was
      // last known rather than dropping to zero, and the fallback below covers
      // a first run that never reached the server at all.
    }
  }, [user]);

  // A 401 on any social call means the session is gone. Reuse the app's existing
  // sign-out path rather than inventing a second one.
  useEffect(() => {
    onSocialUnauthorized(() => {
      socialRepositories.reset();
      void handleSessionExpired();
    });

    return () => onSocialUnauthorized(null);
  }, []);

  // Resolve the session identity once signed in, and clear it on sign-out.
  useEffect(() => {
    if (!user) {
      socialRepositories.reset();
      setCounts(emptyCounts);
      setHasServerCounts(false);
      return;
    }

    void socialRepositories.ensureIdentity().catch(() => undefined);
    void refreshUnreadCounts();
  }, [refreshUnreadCounts, user]);

  // Badges refresh on a long interval while foregrounded, and on foreground.
  useEffect(() => {
    if (!user) return undefined;

    const timer = setInterval(() => void refreshUnreadCounts(), SOCIAL_POLLING.notificationsMs);
    return () => clearInterval(timer);
  }, [refreshUnreadCounts, user]);

  useForegroundRefresh(refreshUnreadCounts);

  /**
   * What is provably unread from the data already on the device.
   *
   * Only a floor — the snapshot holds the pages that have been fetched, so it
   * under-reports — but it is real, which beats showing nothing when the server
   * has never been reachable.
   */
  const derived = useMemo(() => {
    const unread = snapshot.notifications.filter((item) => !item.read);
    return {
      social: unread.filter((item) => item.category === "social").length,
      jobs: unread.filter((item) => item.category === "jobs").length,
      school: unread.filter((item) => item.category === "school").length,
      messages: snapshot.conversations.reduce(
        (total, conversation) => total + conversation.unreadCount,
        0,
      ),
    };
  }, [snapshot.conversations, snapshot.notifications]);

  const effective = hasServerCounts ? counts : derived;

  const value = useMemo(
    () => ({
      repository: socialRepositories,
      snapshot,
      unreadMessages: effective.messages,
      unreadNotifications: effective.social + effective.jobs + effective.school,
      unreadByCategory: {
        social: effective.social,
        jobs: effective.jobs,
        school: effective.school,
      },
      refreshUnreadCounts,
    }),
    [effective, refreshUnreadCounts, snapshot],
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (!context) throw new Error("useSocial must be used within SocialProvider");
  return context;
}
