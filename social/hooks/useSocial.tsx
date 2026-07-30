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

const emptyCounts = { social: 0, jobs: 0, school: 0, messages: 0, total: 0 };

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

  const refreshUnreadCounts = useCallback(async () => {
    if (!user) return;

    try {
      const next = await socialRepositories.getUnreadCounts();
      setCounts({
        social: Number(next.social ?? 0),
        jobs: Number(next.jobs ?? 0),
        school: Number(next.school ?? 0),
        messages: Number(next.messages ?? 0),
        total: Number(next.total ?? 0),
      });
    } catch {
      // Badges are decoration: a failed count must never break a screen.
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

  const value = useMemo(
    () => ({
      repository: socialRepositories,
      snapshot,
      unreadMessages: counts.messages,
      unreadNotifications: counts.social + counts.jobs + counts.school,
      unreadByCategory: {
        social: counts.social,
        jobs: counts.jobs,
        school: counts.school,
      },
      refreshUnreadCounts,
    }),
    [counts, refreshUnreadCounts, snapshot],
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (!context) throw new Error("useSocial must be used within SocialProvider");
  return context;
}
