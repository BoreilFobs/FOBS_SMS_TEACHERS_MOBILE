import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PressableScale,
  Segmented,
} from "@/components/ui";
import { NotificationCategory } from "@/social/models";
import { useSocial } from "@/social/hooks/useSocial";
import { SOCIAL_POLLING } from "@/social/constants/network";
import { usePolling } from "@/social/hooks/usePolling";
import { useSocialResource } from "@/social/hooks/useSocialResource";
import { SocialScreenHeader } from "@/social/components/ScreenHeader";
import { formatDate, formatRelativeTime } from "@/social/utils/format";
import { layout, radii, spacing, typography } from "@/constants/theme";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  destination: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { language, t } = useLanguage();
  const { repository, snapshot, unreadByCategory, refreshUnreadCounts } = useSocial();
  const [category, setCategory] = useState<NotificationCategory>("social");

  // All three categories come from the same endpoint. The backend serves `school`
  // by projecting the existing `activities` table read-only, so there is no
  // client-side school-notification logic left here.
  const { loading, refreshing, error, refresh, retry } = useSocialResource(
    () => repository.getNotifications(category),
  );

  // Badge counts are server-owned; refresh them whenever the list changes.
  useEffect(() => {
    void refreshUnreadCounts();
  }, [refreshUnreadCounts, snapshot.notifications.length]);

  usePolling(
    async () => {
      await repository.getNotifications(category);
      await refreshUnreadCounts();
    },
    SOCIAL_POLLING.notificationsMs,
    { immediate: false },
  );

  const items = useMemo<NotificationItem[]>(
    () =>
      snapshot.notifications
        .filter((item) => item.category === category)
        .map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          createdAt: item.createdAt,
          read: item.read,
          destination: item.destination,
        })),
    [category, snapshot.notifications],
  );

  // Totals come from /notifications/unread-counts rather than the cached page, so
  // the tab badges are right even before a category has been opened.
  const counts = unreadByCategory;

  const markAll = () => {
    void repository.markCategoryRead(category).then(refreshUnreadCounts);
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.feedBackground, paddingTop: insets.top },
      ]}
    >
      <SocialScreenHeader
        title={t("notifications")}
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("mark_all_read")}
            onPress={markAll}
            hitSlop={8}
            style={({ pressed }) => [styles.markAll, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="check-circle" size={20} color={colors.primary} />
          </Pressable>
        }
      />
      <View style={styles.tabs}>
        <Segmented
          selected={category}
          onSelect={setCategory}
          options={[
            { value: "social", label: t("social"), badge: counts.social },
            { value: "jobs", label: t("jobs"), badge: counts.jobs },
            { value: "school", label: t("school"), badge: counts.school },
          ]}
        />
      </View>
      {loading && items.length === 0 ? (
        <View style={styles.tabs}>
          <LoadingState rows={5} />
        </View>
      ) : error && items.length === 0 ? (
        <ErrorState message={error.message} onRetry={() => void retry()} />
      ) : (
        <FlatList
          data={[...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))}
          keyExtractor={(item) => `${category}-${item.id}`}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          renderItem={({ item, index }) => {
            const previous = index ? [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[index - 1] : undefined;
            const showDate = !previous || formatDate(previous.createdAt, language) !== formatDate(item.createdAt, language);
            return (
              <>
                {showDate ? (
                  <Text style={[styles.date, typography.label, { color: colors.textSecondary }]}>
                    {formatDate(item.createdAt, language)}
                  </Text>
                ) : null}
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  onPress={() => {
                    // Server-side read state for every category, including the
                    // projected school ones (their ids are source-prefixed so the
                    // API routes the call to the right store).
                    void repository.markRead(item.id).then(refreshUnreadCounts);
                    // `destination` was mapped from the server's typed destination,
                    // never from a server-supplied URL.
                    router.push(item.destination as never);
                  }}
                  style={[
                    styles.item,
                    {
                      backgroundColor: item.read ? colors.surface : colors.infoSoft,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {/* Unread items carry a left accent instead of a heavy border. */}
                  {!item.read ? (
                    <View style={[styles.accent, { backgroundColor: colors.primary }]} />
                  ) : null}
                  <View
                    style={[
                      styles.icon,
                      { backgroundColor: item.read ? colors.surfaceMuted : colors.surface },
                    ]}
                  >
                    <Feather
                      name={category === "social" ? "users" : category === "jobs" ? "briefcase" : "home"}
                      size={18}
                      color={item.read ? colors.textMuted : colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[typography.bodyStrong, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {item.body}
                    </Text>
                    <Text style={[typography.micro, { color: colors.textMuted }]}>
                      {formatRelativeTime(item.createdAt, language)}
                    </Text>
                  </View>
                  {!item.read ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
                </PressableScale>
              </>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
          ListEmptyComponent={<EmptyState icon="bell" title={t("no_notifications")} message={t("notifications")} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  markAll: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  tabs: { paddingHorizontal: layout.gutter, paddingVertical: spacing.xs },
  list: { paddingHorizontal: layout.gutter, paddingBottom: spacing.xxl },
  date: { paddingTop: spacing.sm, paddingBottom: spacing.xs },
  item: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    padding: spacing.sm,
    paddingLeft: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    overflow: "hidden",
  },
  accent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
