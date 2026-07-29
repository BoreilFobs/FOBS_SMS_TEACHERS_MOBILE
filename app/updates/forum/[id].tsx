import React, { useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AuthWrapper from "@/components/AuthWrapper";
import {
  AppHeader,
  Card,
  EmptyState,
  LoadingState,
  Screen,
  SectionHeader,
  StatusChip,
} from "@/components/ui";
import { ForumPostCard } from "@/components/updates/Cards";
import { useUpdates } from "@/contexts/UpdatesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { radii, spacing, typography } from "@/constants/theme";
import { forumPermissions } from "@/services/mock/mockData";

export default function ForumPostDetailsRoute() {
  return (
    <AuthWrapper>
      <ForumPostDetails />
    </AuthWrapper>
  );
}

function ForumPostDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const {
    state,
    forumPosts,
    markForumPostRead,
    toggleBookmark,
  } = useUpdates();
  const post = forumPosts.find((item) => item.id === id);

  useEffect(() => {
    if (id && post && !post.isRead) void markForumPostRead(id);
  }, [id, post?.isRead]);

  if (state === "loading" || state === "idle") {
    return (
      <Screen bottomInset={false}>
        <LoadingState rows={5} />
      </Screen>
    );
  }

  if (!post) {
    return (
      <Screen bottomInset={false}>
        <AppHeader
          title={language === "fr" ? "Publication" : "Publication"}
          onBack={() => router.back()}
        />
        <EmptyState
          icon="file-text"
          title={language === "fr" ? "Publication introuvable" : "Post not found"}
          message={
            language === "fr"
              ? "Cette publication n’est plus disponible."
              : "This publication is no longer available."
          }
        />
      </Screen>
    );
  }

  const related = forumPosts.filter((item) =>
    post.relatedPostIds.includes(item.id),
  );
  const date = new Intl.DateTimeFormat(
    language === "fr" ? "fr-FR" : "en-GB",
    { dateStyle: "long" },
  ).format(new Date(post.publishedAt));

  return (
    <Screen scroll bottomInset={false}>
      <AppHeader
        title={language === "fr" ? "Forum académique" : "Academic forum"}
        onBack={() => router.back()}
        action={
          forumPermissions.canBookmarkLocally ? (
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
              onPress={() => void toggleBookmark(post.id)}
              style={[
                styles.headerAction,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <Feather
                name="bookmark"
                size={21}
                color={post.isBookmarked ? colors.primary : colors.text}
              />
            </Pressable>
          ) : null
        }
      />
      {post.coverImage ? (
        <Image
          source={{ uri: post.coverImage }}
          accessibilityLabel=""
          style={styles.cover}
        />
      ) : null}
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
      <Text style={[typography.display, { color: colors.text }]}>
        {post.title}
      </Text>
      <View style={styles.author}>
        <View
          style={[styles.avatar, { backgroundColor: colors.primarySoft }]}
        >
          <Text style={[typography.bodyStrong, { color: colors.primary }]}>
            {post.author.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.inline}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>
              {post.author.name}
            </Text>
            {post.author.verified ? (
              <Feather name="check-circle" size={15} color={colors.primary} />
            ) : null}
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {post.author.headline}
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {date} · {post.readingMinutes} min
          </Text>
        </View>
      </View>
      <View style={styles.article}>
        {post.content.map((paragraph, index) => (
          <Text
            key={index}
            style={[styles.paragraph, { color: colors.textSecondary }]}
          >
            {paragraph}
          </Text>
        ))}
      </View>
      {post.attachments.length > 0 ? (
        <>
          <SectionHeader
            title={language === "fr" ? "Ressources" : "Resources"}
          />
          {post.attachments.map((attachment) => (
            <Card key={attachment.id}>
              <View style={styles.attachment}>
                <View
                  style={[
                    styles.attachmentIcon,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Feather name="paperclip" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>
                    {attachment.title}
                  </Text>
                  <Text
                    style={[typography.caption, { color: colors.textSecondary }]}
                  >
                    {attachment.kind.toUpperCase()}
                    {attachment.size ? ` · ${attachment.size}` : ""}
                  </Text>
                </View>
                <StatusChip
                  label={language === "fr" ? "Aperçu" : "Preview"}
                  tone="info"
                />
              </View>
            </Card>
          ))}
        </>
      ) : null}
      {related.length > 0 ? (
        <>
          <SectionHeader
            title={language === "fr" ? "À lire ensuite" : "Read next"}
          />
          {related.map((item) => (
            <ForumPostCard
              key={item.id}
              post={item}
              onPress={() => router.push(`/updates/forum/${item.id}`)}
            />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cover: {
    width: "100%",
    height: 220,
    borderRadius: radii.lg,
    backgroundColor: "#CBD5E1",
  },
  inline: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  author: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  article: { gap: spacing.md },
  paragraph: { fontSize: 17, lineHeight: 27 },
  attachment: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  attachmentIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
});

