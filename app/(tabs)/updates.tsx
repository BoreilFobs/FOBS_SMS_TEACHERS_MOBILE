import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import {
  AppHeader,
  Button,
  EmptyState,
  ErrorState,
  FilterChips,
  LoadingState,
  SchoolSelector,
  Screen,
  SearchInput,
  SectionHeader,
} from "@/components/ui";
import {
  AnnouncementCard,
  ForumPostCard,
  NotificationItem,
} from "@/components/updates/Cards";
import { useUpdates } from "@/contexts/UpdatesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { radii, spacing, typography } from "@/constants/theme";
import useSchoolStore from "@/utils/stores/schoolStore";
import type {
  ForumCategory,
  NotificationCategory,
  TeacherNotification,
} from "@/models/updates";

type UpdatesTab = "forum" | "schools" | "notifications";

export default function UpdatesScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const initial =
    params.tab === "schools" || params.tab === "notifications"
      ? params.tab
      : "forum";
  const [tab, setTab] = useState<UpdatesTab>(initial);
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const updates = useUpdates();

  useEffect(() => {
    if (params.tab === "schools" || params.tab === "notifications") {
      setTab(params.tab);
    }
  }, [params.tab]);

  const labels =
    language === "fr"
      ? {
          title: "Actualités",
          subtitle: "Informations académiques et scolaires",
          forum: "Forum",
          schools: "Mes écoles",
          notifications: "Notifications",
        }
      : {
          title: "Updates",
          subtitle: "Academic and school information",
          forum: "Forum",
          schools: "My schools",
          notifications: "Notifications",
        };

  return (
    <Screen scroll>
      <AppHeader title={labels.title} subtitle={labels.subtitle} />
      <View
        accessibilityRole="tablist"
        style={[styles.tabs, { backgroundColor: colors.surfaceMuted }]}
      >
        {(
          [
            ["forum", labels.forum],
            ["schools", labels.schools],
            ["notifications", labels.notifications],
          ] as const
        ).map(([value, label]) => {
          const active = tab === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(value)}
              style={[
                styles.tab,
                { backgroundColor: active ? colors.surface : "transparent" },
              ]}
            >
              <Text
                style={[
                  typography.label,
                  { color: active ? colors.primary : colors.textSecondary },
                ]}
              >
                {label}
              </Text>
              {value === "notifications" && updates.unreadCount > 0 ? (
                <View
                  style={[styles.badge, { backgroundColor: colors.error }]}
                >
                  <Text style={styles.badgeText}>
                    {Math.min(updates.unreadCount, 99)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {updates.state === "loading" || updates.state === "idle" ? (
        <LoadingState rows={5} />
      ) : updates.state === "error" ? (
        <ErrorState
          message={updates.error ?? "Unable to load updates."}
          onRetry={updates.reload}
        />
      ) : tab === "forum" ? (
        <ForumFeed />
      ) : tab === "schools" ? (
        <AnnouncementsFeed />
      ) : (
        <NotificationsFeed />
      )}
    </Screen>
  );
}

function ForumFeed() {
  const router = useRouter();
  const { language } = useLanguage();
  const { forumPosts, toggleBookmark } = useUpdates();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | ForumCategory>("all");

  const categories = useMemo(
    () =>
      Array.from(new Set(forumPosts.map((post) => post.category))).map(
        (value) => ({ value, label: value }),
      ),
    [forumPosts],
  );
  const filtered = forumPosts.filter((post) => {
    const matchesCategory = category === "all" || post.category === category;
    const needle = query.trim().toLowerCase();
    const matchesSearch =
      !needle ||
      `${post.title} ${post.excerpt} ${post.author.name}`
        .toLowerCase()
        .includes(needle);
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder={
          language === "fr"
            ? "Rechercher une publication"
            : "Search academic publications"
        }
      />
      <FilterChips
        options={[
          { value: "all", label: language === "fr" ? "Toutes" : "All" },
          ...categories,
        ]}
        selected={category}
        onSelect={setCategory}
      />
      {filtered.length === 0 ? (
        <EmptyState
          icon="search"
          title={language === "fr" ? "Aucun résultat" : "No publications found"}
          message={
            language === "fr"
              ? "Essayez une autre recherche ou catégorie."
              : "Try a different search or category."
          }
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((post) => (
            <ForumPostCard
              key={post.id}
              post={post}
              onPress={() => router.push(`/updates/forum/${post.id}`)}
              onBookmark={() => void toggleBookmark(post.id)}
            />
          ))}
        </View>
      )}
    </>
  );
}

function AnnouncementsFeed() {
  const router = useRouter();
  const { language } = useLanguage();
  const { announcements } = useUpdates();
  const schools = useSchoolStore((store) => store.schools);
  const assignedSchools = schools.filter(
    (school) =>
      school.status === "active" && school.pivot?.is_approved !== false,
  );
  const [query, setQuery] = useState("");
  const [schoolId, setSchoolId] = useState("all");

  const filtered = announcements
    .filter(
      (announcement) =>
        schoolId === "all" || String(announcement.schoolId) === schoolId,
    )
    .filter((announcement) => {
      const needle = query.trim().toLowerCase();
      return (
        !needle ||
        `${announcement.title} ${announcement.excerpt} ${announcement.schoolName}`
          .toLowerCase()
          .includes(needle)
      );
    })
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        +new Date(b.publishedAt) - +new Date(a.publishedAt),
    );

  return (
    <>
      <SchoolSelector />
      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder={
          language === "fr"
            ? "Rechercher une annonce"
            : "Search school announcements"
        }
      />
      <FilterChips
        options={[
          {
            value: "all",
            label: language === "fr" ? "Toutes les écoles" : "All schools",
          },
          ...assignedSchools.map((school) => ({
            value: String(school.id),
            label: school.code || school.name,
          })),
        ]}
        selected={schoolId}
        onSelect={setSchoolId}
      />
      {filtered.length === 0 ? (
        <EmptyState
          icon="bell-off"
          title={language === "fr" ? "Aucune annonce" : "No announcements"}
          message={
            language === "fr"
              ? "Aucune annonce ne correspond à ce filtre."
              : "No school announcements match this filter."
          }
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onPress={() =>
                router.push(`/updates/announcements/${announcement.id}`)
              }
            />
          ))}
        </View>
      )}
    </>
  );
}

function NotificationsFeed() {
  const router = useRouter();
  const { language } = useLanguage();
  const {
    notifications,
    openNotification,
    markAllNotificationsRead,
    unreadCount,
  } = useUpdates();
  const [filter, setFilter] = useState<
    "all" | "unread" | NotificationCategory
  >("all");

  const filtered = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.isRead;
    return notification.category === filter;
  });
  const grouped = groupNotifications(filtered, language);

  const open = async (notification: TeacherNotification) => {
    const updated = await openNotification(notification.id);
    router.push((updated?.destination ?? notification.destination) as Href);
  };

  return (
    <>
      <View style={styles.between}>
        <SectionHeader
          title={
            language === "fr"
              ? `${unreadCount} non lue${unreadCount === 1 ? "" : "s"}`
              : `${unreadCount} unread`
          }
        />
        {unreadCount > 0 ? (
          <View style={styles.markAll}>
            <Button
              label={
                language === "fr" ? "Tout marquer lu" : "Mark all read"
              }
              variant="secondary"
              onPress={() => void markAllNotificationsRead()}
            />
          </View>
        ) : null}
      </View>
      <FilterChips
        options={[
          { value: "all", label: language === "fr" ? "Toutes" : "All" },
          {
            value: "unread",
            label: language === "fr" ? "Non lues" : "Unread",
          },
          {
            value: "announcement",
            label: language === "fr" ? "Écoles" : "Schools",
          },
          { value: "marks", label: language === "fr" ? "Notes" : "Marks" },
          {
            value: "attendance",
            label: language === "fr" ? "Présences" : "Attendance",
          },
          { value: "forum", label: "Forum" },
          { value: "profile", label: language === "fr" ? "Profil" : "Profile" },
        ]}
        selected={filter}
        onSelect={setFilter}
      />
      {filtered.length === 0 ? (
        <EmptyState
          icon="check-circle"
          title={
            language === "fr" ? "Vous êtes à jour" : "You’re all caught up"
          }
          message={
            language === "fr"
              ? "Aucune notification ne correspond à ce filtre."
              : "No notifications match this filter."
          }
        />
      ) : (
        Object.entries(grouped).map(([label, items]) => (
          <View key={label} style={styles.list}>
            <SectionHeader title={label} />
            {items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onPress={() => void open(notification)}
              />
            ))}
          </View>
        ))
      )}
    </>
  );
}

function groupNotifications(
  notifications: TeacherNotification[],
  language: "en" | "fr",
) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  return notifications.reduce<Record<string, TeacherNotification[]>>(
    (groups, notification) => {
      const date = new Date(notification.createdAt);
      const label =
        date >= startToday
          ? language === "fr"
            ? "Aujourd’hui"
            : "Today"
          : date >= startYesterday
            ? language === "fr"
              ? "Hier"
              : "Yesterday"
            : language === "fr"
              ? "Plus tôt"
              : "Earlier";
      (groups[label] ??= []).push(notification);
      return groups;
    },
    {},
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    borderRadius: radii.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  list: { gap: spacing.sm },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  markAll: { maxWidth: 164, flex: 1 },
});
