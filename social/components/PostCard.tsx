import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CURRENT_TEACHER_ID,
  ReactionType,
  SocialPost,
} from "@/social/models";
import { useSocial } from "@/social/hooks/useSocial";
import { Avatar } from "@/social/components/Avatar";
import { formatRelativeTime } from "@/social/utils/format";
import { radii, spacing, typography } from "@/constants/theme";

const reactionIcons: Record<
  ReactionType,
  React.ComponentProps<typeof Ionicons>["name"]
> = {
  like: "thumbs-up",
  love: "heart",
  support: "hand-left",
  insightful: "bulb",
  celebrate: "sparkles",
};

const reactionColors: Record<ReactionType, string> = {
  like: "#2563EB",
  love: "#DB2777",
  support: "#0E7490",
  insightful: "#B45309",
  celebrate: "#7C3AED",
};

type Sheet = "reactions" | "share" | "menu" | "report" | null;

export const PostCard = React.memo(function PostCard({
  post,
  detail = false,
}: {
  post: SocialPost;
  detail?: boolean;
}) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { language, t } = useLanguage();
  const { repository, snapshot } = useSocial();
  const [sheet, setSheet] = useState<Sheet>(null);
  const author = snapshot.teachers.find((teacher) => teacher.id === post.authorId);
  const original =
    post.type === "reshare" || post.type === "quote"
      ? snapshot.posts.find((candidate) => candidate.id === post.originalPostId)
      : undefined;
  const originalAuthor = original
    ? snapshot.teachers.find((teacher) => teacher.id === original.authorId)
    : undefined;
  const isOwn = post.authorId === CURRENT_TEACHER_ID;
  const reaction = post.currentUserReaction;
  const reactionLabel = reaction ? t(`reaction_${reaction}`) : t("react");

  const taggedNames = useMemo(
    () =>
      post.taggedTeacherIds
        .map((id) => snapshot.teachers.find((teacher) => teacher.id === id)?.name)
        .filter(Boolean),
    [post.taggedTeacherIds, snapshot.teachers],
  );

  if (!author) return null;

  const selectPollOption = (optionId: string) => {
    if (post.type !== "poll") return;
    const previous = post.poll.currentUserOptionIds;
    const next = post.poll.multiple
      ? previous.includes(optionId)
        ? previous.filter((id) => id !== optionId)
        : [...previous, optionId]
      : [optionId];
    if (next.length) void repository.vote(post.id, next);
  };

  const confirmDelete = () =>
    Alert.alert(t("delete"), t("delete_post_confirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: () => void repository.deletePost(post.id),
      },
    ]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {post.recommendedReason ? (
        <View style={styles.recommended}>
          <Feather name="compass" size={13} color={colors.primary} />
          <Text style={[typography.caption, { color: colors.primary }]}>
            {t("recommended")} · {post.recommendedReason}
          </Text>
        </View>
      ) : null}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t("professional_profile")}: ${author.name}`}
          onPress={() => router.push(`/social/profile/${author.id}`)}
          style={styles.authorPress}
        >
          <Avatar name={author.name} uri={author.photoUrl} />
          <View style={styles.authorText}>
            <View style={styles.nameRow}>
              <Text numberOfLines={1} style={[typography.bodyStrong, { color: colors.text }]}>
                {author.name}
              </Text>
              {author.verified ? (
                <Feather name="check-circle" size={14} color={colors.primary} />
              ) : null}
            </View>
            <Text numberOfLines={1} style={[typography.caption, { color: colors.textSecondary }]}>
              {author.headline}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {formatRelativeTime(post.createdAt, language)}
              </Text>
              {post.editedAt ? (
                <Text style={[typography.caption, { color: colors.textMuted }]}>· {t("edited")}</Text>
              ) : null}
              {post.schoolAffiliation ? (
                <Text numberOfLines={1} style={[typography.caption, { color: colors.textMuted, flexShrink: 1 }]}>
                  · {post.schoolAffiliation}
                </Text>
              ) : null}
            </View>
          </View>
        </Pressable>
        {!isOwn && !author.followedByCurrentUser ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("follow")}
            onPress={() => void repository.follow(author.id)}
            style={styles.follow}
          >
            <Text style={[typography.label, { color: colors.primary }]}>{t("follow")}</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("settings")}
          onPress={() => setSheet("menu")}
          style={styles.iconButton}
        >
          <Feather name="more-horizontal" size={22} color={colors.textMuted} />
        </Pressable>
      </View>

      <Pressable
        accessibilityRole={detail ? undefined : "button"}
        onPress={detail ? undefined : () => router.push(`/social/post/${post.id}`)}
      >
        <View style={styles.body}>
          {post.type === "question" ? (
            <View style={[styles.questionLabel, { backgroundColor: colors.infoSoft }]}>
              <Feather name="help-circle" size={13} color={colors.info} />
              <Text style={[typography.caption, { color: colors.info }]}>
                {t("professional_question")}
              </Text>
            </View>
          ) : null}
          {post.type === "question" ? (
            <Text style={[typography.heading, { color: colors.text }]}>{post.questionTitle}</Text>
          ) : null}
          {post.text ? (
            <Text
              selectable={detail}
              style={[typography.body, { color: colors.text }]}
              numberOfLines={detail ? undefined : 9}
            >
              {post.text}
            </Text>
          ) : null}
          {post.category || post.location ? (
            <View style={styles.metadata}>
              {post.category ? (
                <Text style={[styles.category, { color: colors.primary, backgroundColor: colors.primarySoft }]}>
                  {post.category}
                </Text>
              ) : null}
              {post.location ? (
                <View style={styles.metaRow}>
                  <Feather name="map-pin" size={13} color={colors.textMuted} />
                  <Text style={[typography.caption, { color: colors.textMuted }]}>{post.location}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          {taggedNames.length ? (
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {t("tag_teachers")}: {taggedNames.join(", ")}
            </Text>
          ) : null}
          {post.hashtags.length ? (
            <Text style={[typography.bodyStrong, { color: colors.primary }]}>
              {post.hashtags.map((tag) => `#${tag}`).join(" ")}
            </Text>
          ) : null}
        </View>
        {post.images.length ? (
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.images}
          >
            {post.images.map((uri, index) => (
              <Image
                key={`${uri}-${index}`}
                source={{ uri }}
                accessibilityLabel={post.imageDescriptions[index] || `${t("image_post")} ${index + 1}`}
                style={[
                  styles.image,
                  {
                    backgroundColor: colors.surfaceMuted,
                    width: post.images.length === 1 ? 330 : 260,
                  },
                ]}
              />
            ))}
          </ScrollView>
        ) : null}
        {post.type === "poll" ? (
          <PollContent post={post} onSelect={selectPollOption} />
        ) : null}
        {post.type === "reshare" || post.type === "quote" ? (
          <View style={[styles.original, { borderColor: colors.border }]}>
            {original && originalAuthor ? (
              <>
                <View style={styles.originalAuthor}>
                  <Avatar name={originalAuthor.name} uri={originalAuthor.photoUrl} size={32} />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.label, { color: colors.text }]}>{originalAuthor.name}</Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>
                      {formatRelativeTime(original.createdAt, language)}
                    </Text>
                  </View>
                </View>
                {original.type === "question" ? (
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>{original.questionTitle}</Text>
                ) : null}
                <Text numberOfLines={5} style={[typography.body, { color: colors.textSecondary }]}>
                  {original.text}
                </Text>
              </>
            ) : (
              <Text style={[typography.body, { color: colors.textMuted }]}>{t("original_unavailable")}</Text>
            )}
          </View>
        ) : null}
      </Pressable>

      <View style={[styles.summary, { borderBottomColor: colors.divider }]}>
        <Pressable accessibilityRole="button" onPress={() => setSheet("reactions")}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {post.reactions.total} {t("react")}
          </Text>
        </Pressable>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {post.commentCount} {t("comments")} · {post.reshareCount} {t("reshare")}
        </Text>
      </View>
      <View style={styles.actions}>
        <PostAction
          icon={reaction ? reactionIcons[reaction] : "thumbs-up-outline"}
          label={reactionLabel}
          color={reaction ? reactionColors[reaction] : colors.textSecondary}
          onPress={() => void repository.react(post.id, "like")}
          onLongPress={() => setSheet("reactions")}
        />
        <PostAction
          icon="chatbubble-outline"
          label={t("comment")}
          color={colors.textSecondary}
          onPress={() => router.push(`/social/post/${post.id}`)}
        />
        <PostAction
          icon="repeat-outline"
          label={t("share")}
          color={colors.textSecondary}
          onPress={() => setSheet("share")}
        />
        <PostAction
          icon={post.saved ? "bookmark" : "bookmark-outline"}
          label={post.saved ? t("saved") : t("save_post")}
          color={post.saved ? colors.primary : colors.textSecondary}
          onPress={() => void repository.savePost(post.id)}
        />
      </View>

      <ActionSheet visible={sheet !== null} onClose={() => setSheet(null)}>
        {sheet === "reactions" ? (
          <View style={styles.reactionPicker}>
            {(["like", "love", "support", "insightful", "celebrate"] as ReactionType[]).map(
              (item) => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityLabel={t(`reaction_${item}`)}
                  onPress={() => {
                    setSheet(null);
                    void repository.react(post.id, item);
                  }}
                  style={styles.reactionChoice}
                >
                  <Ionicons name={reactionIcons[item]} size={28} color={reactionColors[item]} />
                  <Text style={[typography.caption, { color: colors.text }]}>{t(`reaction_${item}`)}</Text>
                </Pressable>
              ),
            )}
          </View>
        ) : null}
        {sheet === "share" ? (
          <View style={styles.sheetList}>
            <SheetButton
              icon="repeat"
              label={t("reshare_now")}
              onPress={() => {
                setSheet(null);
                void repository.reshare(post.id);
              }}
            />
            <SheetButton
              icon="edit-3"
              label={t("quote_post")}
              onPress={() => {
                setSheet(null);
                router.push({ pathname: "/social/compose", params: { quote: post.id } });
              }}
            />
            <SheetButton
              icon="send"
              label={t("internal_share")}
              onPress={() => {
                setSheet(null);
                router.push({ pathname: "/social/share", params: { kind: "post", id: post.id } });
              }}
            />
          </View>
        ) : null}
        {sheet === "menu" ? (
          <View style={styles.sheetList}>
            {isOwn ? (
              <>
                <SheetButton
                  icon="edit-2"
                  label={t("edit")}
                  onPress={() => {
                    setSheet(null);
                    router.push({ pathname: "/social/compose", params: { edit: post.id } });
                  }}
                />
                <SheetButton
                  icon="trash-2"
                  label={t("delete")}
                  destructive
                  onPress={() => {
                    setSheet(null);
                    confirmDelete();
                  }}
                />
              </>
            ) : (
              <SheetButton
                icon="flag"
                label={post.reported ? t("reported") : t("report_post")}
                disabled={post.reported}
                onPress={() => setSheet("report")}
              />
            )}
          </View>
        ) : null}
        {sheet === "report" ? (
          <View style={styles.sheetList}>
            <Text style={[typography.heading, { color: colors.text }]}>{t("report_post")}</Text>
            {["spam", "misleading", "harassment", "inappropriate", "impersonation", "other"].map(
              (reason) => (
                <SheetButton
                  key={reason}
                  icon="flag"
                  label={t(`report_${reason}`)}
                  onPress={() => {
                    setSheet(null);
                    void repository
                      .reportPost(post.id, reason)
                      .then(() => Alert.alert(t("success"), t("report_confirmed")));
                  }}
                />
              ),
            )}
          </View>
        ) : null}
      </ActionSheet>
    </View>
  );
});

function PollContent({
  post,
  onSelect,
}: {
  post: Extract<SocialPost, { type: "poll" }>;
  onSelect: (id: string) => void;
}) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const total = post.poll.options.reduce((sum, option) => sum + option.votes, 0);
  return (
    <View style={styles.poll}>
      <Text style={[typography.bodyStrong, { color: colors.text }]}>{post.poll.question}</Text>
      {post.poll.options.map((option) => {
        const selected = post.poll.currentUserOptionIds.includes(option.id);
        const percent = total ? Math.round((option.votes / total) * 100) : 0;
        return (
          <Pressable
            key={option.id}
            accessibilityRole={post.poll.multiple ? "checkbox" : "radio"}
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${option.text}, ${percent}%`}
            onPress={() => onSelect(option.id)}
            style={[styles.pollOption, { borderColor: selected ? colors.primary : colors.border }]}
          >
            <View
              style={[
                styles.pollFill,
                {
                  backgroundColor: colors.primarySoft,
                  width: `${percent}%`,
                },
              ]}
            />
            <View style={styles.pollText}>
              <Ionicons
                name={
                  post.poll.multiple
                    ? selected
                      ? "checkbox"
                      : "square-outline"
                    : selected
                      ? "radio-button-on"
                      : "radio-button-off"
                }
                size={18}
                color={selected ? colors.primary : colors.textMuted}
              />
              <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{option.text}</Text>
              <Text style={[typography.label, { color: colors.textSecondary }]}>{percent}%</Text>
            </View>
          </Pressable>
        );
      })}
      <Text style={[typography.caption, { color: colors.textMuted }]}>
        {total} {t("votes")} · {post.poll.multiple ? t("multiple_choice") : t("vote")}
      </Text>
    </View>
  );
}

function PostAction({
  icon,
  label,
  color,
  onPress,
  onLongPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  color: string;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={280}
      style={({ pressed }) => [styles.action, { opacity: pressed ? 0.55 : 1 }]}
    >
      <Ionicons name={icon} size={19} color={color} />
      <Text numberOfLines={1} style={[typography.caption, { color }]}>{label}</Text>
    </Pressable>
  );
}

function ActionSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[styles.sheet, { backgroundColor: colors.surfaceElevated }]}
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SheetButton({
  icon,
  label,
  onPress,
  destructive,
  disabled,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const { colors } = useAppTheme();
  const color = disabled ? colors.disabledText : destructive ? colors.error : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.sheetButton}
    >
      <Feather name={icon} size={20} color={color} />
      <Text style={[typography.bodyStrong, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
  },
  recommended: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: spacing.md, marginBottom: spacing.xs },
  header: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: spacing.md, gap: spacing.xs },
  authorPress: { flex: 1, flexDirection: "row", gap: spacing.sm },
  authorText: { flex: 1, gap: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  follow: { minHeight: 42, justifyContent: "center", paddingHorizontal: 4 },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", marginTop: -5, marginRight: -8 },
  body: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.xs },
  questionLabel: { alignSelf: "flex-start", flexDirection: "row", gap: 5, alignItems: "center", paddingHorizontal: 9, paddingVertical: 4, borderRadius: radii.pill },
  metadata: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
  category: { ...typography.caption, borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 4 },
  images: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.xs },
  image: { height: 225, borderRadius: radii.md },
  poll: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.xs },
  pollOption: { minHeight: 48, borderWidth: 1, borderRadius: radii.md, overflow: "hidden", justifyContent: "center" },
  pollFill: { position: "absolute", left: 0, top: 0, bottom: 0 },
  pollText: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.sm },
  original: { borderWidth: 1, borderRadius: radii.md, marginHorizontal: spacing.md, marginTop: spacing.sm, padding: spacing.sm, gap: spacing.xs },
  originalAuthor: { flexDirection: "row", gap: spacing.xs, alignItems: "center" },
  summary: { marginHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", gap: spacing.xs },
  actions: { minHeight: 48, flexDirection: "row", paddingHorizontal: spacing.xs },
  action: { flex: 1, minHeight: 46, flexDirection: "row", gap: 5, alignItems: "center", justifyContent: "center" },
  overlay: { flex: 1, justifyContent: "flex-end", padding: spacing.md },
  sheet: { borderRadius: radii.xl, padding: spacing.md, maxHeight: "78%" },
  sheetList: { gap: spacing.xs },
  sheetButton: { minHeight: 50, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.xs },
  reactionPicker: { flexDirection: "row", justifyContent: "space-around", gap: 5, paddingVertical: spacing.sm },
  reactionChoice: { minWidth: 53, minHeight: 64, alignItems: "center", justifyContent: "center", gap: 3 },
});
