import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import type {
  ForumPost,
  SchoolAnnouncement,
  TeacherNotification,
} from "@/models/updates";
import { Card, StatusChip } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { radii, spacing, typography } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";

function formattedDate(value: string, language: "en" | "fr") {
  return new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export function ForumPostCard({
  post,
  onPress,
  onBookmark,
}: {
  post: ForumPost;
  onPress: () => void;
  onBookmark?: () => void;
}) {
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  return (
    <Card onPress={onPress} accessibilityLabel={post.title}>
      <View style={styles.cardColumn}>
        {post.coverImage && post.featured ? (
          <Image
            accessibilityLabel=""
            source={{ uri: post.coverImage }}
            style={styles.cover}
          />
        ) : null}
        <View style={styles.between}>
          <View style={styles.inline}>
            {post.pinned ? (
              <StatusChip
                label={language === "fr" ? "À la une" : "Featured"}
                tone="info"
                icon="bookmark"
              />
            ) : null}
            <StatusChip label={post.category} />
          </View>
          {onBookmark ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                post.isBookmarked
                  ? language === "fr"
                    ? "Retirer le signet"
                    : "Remove bookmark"
                  : language === "fr"
                    ? "Ajouter un signet"
                    : "Bookmark"
              }
              onPress={(event) => {
                event.stopPropagation();
                onBookmark();
              }}
              style={styles.smallButton}
            >
              <Feather
                name="bookmark"
                size={19}
                color={post.isBookmarked ? colors.primary : colors.textMuted}
              />
            </Pressable>
          ) : null}
        </View>
        <Text style={[typography.heading, { color: colors.text }]}>
          {post.title}
        </Text>
        <Text
          numberOfLines={3}
          style={[typography.body, { color: colors.textSecondary }]}
        >
          {post.excerpt}
        </Text>
        <View style={styles.between}>
          <View style={styles.inline}>
            {!post.isRead ? (
              <View
                accessibilityLabel={language === "fr" ? "Non lu" : "Unread"}
                style={[styles.unreadDot, { backgroundColor: colors.primary }]}
              />
            ) : null}
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {post.author.name}
            </Text>
          </View>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {formattedDate(post.publishedAt, language)} · {post.readingMinutes}{" "}
            min
          </Text>
        </View>
      </View>
    </Card>
  );
}

export function AnnouncementCard({
  announcement,
  onPress,
}: {
  announcement: SchoolAnnouncement;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const tone =
    announcement.priority === "urgent"
      ? "error"
      : announcement.priority === "important"
        ? "warning"
        : "neutral";
  const label =
    announcement.priority === "urgent"
      ? language === "fr"
        ? "Urgent"
        : "Urgent"
      : announcement.priority === "important"
        ? language === "fr"
          ? "Important"
          : "Important"
        : language === "fr"
          ? "Information"
          : "Information";
  return (
    <Card onPress={onPress} accessibilityLabel={announcement.title}>
      <View style={styles.cardColumn}>
        <View style={styles.between}>
          <View style={styles.inline}>
            {!announcement.isRead ? (
              <View
                accessibilityLabel={language === "fr" ? "Non lu" : "Unread"}
                style={[styles.unreadDot, { backgroundColor: colors.primary }]}
              />
            ) : null}
            <Text style={[typography.label, { color: colors.primary }]}>
              {announcement.schoolAcronym}
            </Text>
            {announcement.pinned ? (
              <Feather name="bookmark" size={14} color={colors.textMuted} />
            ) : null}
          </View>
          <StatusChip label={label} tone={tone} />
        </View>
        <Text style={[typography.heading, { color: colors.text }]}>
          {announcement.title}
        </Text>
        <Text
          numberOfLines={2}
          style={[typography.body, { color: colors.textSecondary }]}
        >
          {announcement.excerpt}
        </Text>
        <View style={styles.between}>
          <Text
            numberOfLines={1}
            style={[
              typography.caption,
              { color: colors.textSecondary, flex: 1 },
            ]}
          >
            {announcement.schoolName} · {announcement.publisher}
          </Text>
          <View style={styles.inline}>
            {announcement.attachments.length ? (
              <Feather name="paperclip" size={14} color={colors.textMuted} />
            ) : null}
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {formattedDate(announcement.publishedAt, language)}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const notificationIcons: Record<
  TeacherNotification["category"],
  React.ComponentProps<typeof Ionicons>["name"]
> = {
  announcement: "megaphone-outline",
  marks: "create-outline",
  attendance: "checkmark-circle-outline",
  assignment: "school-outline",
  profile: "person-circle-outline",
  forum: "newspaper-outline",
};

export function NotificationItem({
  notification,
  onPress,
}: {
  notification: TeacherNotification;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${notification.isRead ? "" : "Unread. "}${notification.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.notification,
        {
          backgroundColor: notification.isRead
            ? colors.surface
            : colors.primarySoft,
          borderColor: notification.isRead ? colors.border : colors.primary,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <View
        style={[styles.notificationIcon, { backgroundColor: colors.surface }]}
      >
        <Ionicons
          name={notificationIcons[notification.category]}
          size={21}
          color={colors.primary}
        />
      </View>
      <View style={styles.notificationBody}>
        <View style={styles.between}>
          <Text
            numberOfLines={1}
            style={[
              notification.isRead ? typography.bodyStrong : typography.bodyStrong,
              { color: colors.text, flex: 1 },
            ]}
          >
            {notification.title}
          </Text>
          {!notification.isRead ? (
            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          ) : null}
        </View>
        <Text
          numberOfLines={2}
          style={[typography.body, { color: colors.textSecondary }]}
        >
          {notification.body}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {formattedDate(notification.createdAt, language)}
          {notification.schoolName ? ` · ${notification.schoolName}` : ""}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardColumn: { gap: spacing.sm },
  cover: {
    width: "100%",
    height: 154,
    borderRadius: radii.md,
    backgroundColor: "#CBD5E1",
  },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  inline: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  smallButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  notification: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.sm,
  },
  notificationIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBody: { flex: 1, gap: 2 },
});

