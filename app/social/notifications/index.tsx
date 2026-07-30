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
import { useUpdates } from "@/contexts/UpdatesContext";
import { EmptyState, FilterChips } from "@/components/ui";
import { NotificationCategory } from "@/social/models";
import { useSocial } from "@/social/hooks/useSocial";
import { SocialScreenHeader } from "@/social/components/ScreenHeader";
import { formatDate, formatRelativeTime } from "@/social/utils/format";
import { radii, spacing, typography } from "@/constants/theme";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  destination: string;
  schoolSource?: boolean;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { language, t } = useLanguage();
  const { repository, snapshot } = useSocial();
  const schoolUpdates = useUpdates();
  const [category, setCategory] = useState<NotificationCategory>("social");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (category === "school") {
      if (schoolUpdates.state === "idle") void schoolUpdates.reload();
      setLoading(schoolUpdates.state === "idle" || schoolUpdates.state === "loading");
    } else {
      void repository.getNotifications(category).finally(() => setLoading(false));
    }
  }, [category, repository, schoolUpdates]);

  const items = useMemo<NotificationItem[]>(
    () =>
      category === "school"
        ? schoolUpdates.notifications.map((item) => ({
            id: item.id,
            title: item.title,
            body: item.body,
            createdAt: item.createdAt,
            read: item.isRead,
            destination: item.destination,
            schoolSource: true,
          }))
        : snapshot.notifications
            .filter((item) => item.category === category)
            .map((item) => ({
              id: item.id,
              title: item.title,
              body: item.body,
              createdAt: item.createdAt,
              read: item.read,
              destination: item.destination,
            })),
    [category, schoolUpdates.notifications, snapshot.notifications],
  );

  const counts = {
    social: snapshot.notifications.filter((item) => item.category === "social" && !item.read).length,
    jobs: snapshot.notifications.filter((item) => item.category === "jobs" && !item.read).length,
    school: schoolUpdates.notifications.filter((item) => !item.isRead).length,
  };
  const markAll = () =>
    category === "school"
      ? void schoolUpdates.markAllNotificationsRead()
      : void repository.markCategoryRead(category);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <SocialScreenHeader
        title={t("notifications")}
        action={
          <Pressable accessibilityRole="button" accessibilityLabel={t("mark_all_read")} onPress={markAll} style={styles.markAll}>
            <Text style={[typography.label, { color: colors.primary }]}>{t("mark_all_read")}</Text>
          </Pressable>
        }
      />
      <View style={styles.tabs}>
        <FilterChips
          selected={category}
          onSelect={setCategory}
          options={[
            { value: "social", label: `${t("social")} ${counts.social ? `(${counts.social})` : ""}` },
            { value: "jobs", label: `${t("jobs")} ${counts.jobs ? `(${counts.jobs})` : ""}` },
            { value: "school", label: `${t("school")} ${counts.school ? `(${counts.school})` : ""}` },
          ]}
        />
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : category === "school" && schoolUpdates.state === "error" ? (
        <EmptyState icon="alert-circle" title={t("operation_failed")} message={t("retry")} />
      ) : (
        <FlatList
          data={[...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))}
          keyExtractor={(item) => `${category}-${item.id}`}
          contentContainerStyle={styles.list}
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
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    if (item.schoolSource) void schoolUpdates.openNotification(item.id);
                    else void repository.markRead(item.id);
                    router.push(item.destination as never);
                  }}
                  style={[
                    styles.item,
                    {
                      backgroundColor: item.read ? colors.surface : colors.infoSoft,
                      borderColor: item.read ? colors.border : colors.primary,
                    },
                  ]}
                >
                  <View style={[styles.icon, { backgroundColor: item.read ? colors.surfaceMuted : colors.surface }]}>
                    <Feather
                      name={category === "social" ? "users" : category === "jobs" ? "briefcase" : "home"}
                      size={19}
                      color={item.read ? colors.textMuted : colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[item.read ? typography.bodyStrong : typography.heading, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[typography.body, { color: colors.textSecondary }]}>{item.body}</Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>
                      {formatRelativeTime(item.createdAt, language)}
                    </Text>
                  </View>
                  {!item.read ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
                </Pressable>
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
  markAll: { minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.xs },
  tabs: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  date: { paddingTop: spacing.sm, paddingBottom: spacing.xs },
  item: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.sm, flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 6 },
});
