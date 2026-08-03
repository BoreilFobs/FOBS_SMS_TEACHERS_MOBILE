import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { PressableScale } from "@/components/ui";
import { confirmAction, notify } from "@/utils/dialog";
import {
  elevation,
  layout,
  motion,
  radii,
  reactionPalette,
  spacing,
  typography,
} from "@/constants/theme";

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

const reactionOrder: ReactionType[] = [
  "like",
  "love",
  "support",
  "insightful",
  "celebrate",
];

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
  const reactionTint = reaction ? reactionPalette[reaction] : colors.textSecondary;

  const taggedNames = useMemo(
    () =>
      post.taggedTeacherIds
        .map((id) => snapshot.teachers.find((teacher) => teacher.id === id)?.name)
        .filter(Boolean),
    [post.taggedTeacherIds, snapshot.teachers],
  );

  // Which reaction bubbles to show in the summary row, most used first.
  const topReactions = useMemo(
    () =>
      reactionOrder
        .map((type) => ({ type, count: post.reactions.breakdown[type] ?? 0 }))
        .filter((entry) => entry.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3),
    [post.reactions],
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
    confirmAction({
      title: t("delete"),
      message: t("delete_post_confirm"),
      confirmLabel: t("delete"),
      cancelLabel: t("cancel"),
      destructive: true,
      onConfirm: () => {
        void repository
          .deletePost(post.id)
          .catch((cause: unknown) =>
            notify(
              t("error"),
              cause instanceof Error ? cause.message : t("operation_failed"),
            ),
          );
      },
    });

  return (
    <View
      style={[
        styles.card,
        detail && styles.cardDetail,
        {
          backgroundColor: colors.feedCard,
          borderColor: colors.border,
        },
        !detail && elevation.raised,
      ]}
    >
      {post.recommendedReason ? (
        <View style={[styles.recommended, { borderBottomColor: colors.divider }]}>
          <Feather name="compass" size={13} color={colors.primary} />
          <Text
            numberOfLines={1}
            style={[typography.micro, { color: colors.primary, flex: 1 }]}
          >
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
          <View style={[styles.avatarRing, { borderColor: colors.ring }]}>
            <Avatar name={author.name} uri={author.photoUrl} size={44} />
          </View>
          <View style={styles.authorText}>
            <View style={styles.nameRow}>
              <Text
                numberOfLines={1}
                style={[typography.bodyStrong, { color: colors.text, flexShrink: 1 }]}
              >
                {author.name}
              </Text>
              {author.verified ? (
                <Feather name="check-circle" size={14} color={colors.primary} />
              ) : null}
            </View>
            <Text
              numberOfLines={1}
              style={[typography.caption, { color: colors.textSecondary }]}
            >
              {author.headline}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[typography.micro, { color: colors.textMuted }]}>
                {formatRelativeTime(post.createdAt, language)}
              </Text>
              {post.editedAt ? (
                <Text style={[typography.micro, { color: colors.textMuted }]}>
                  · {t("edited")}
                </Text>
              ) : null}
              {post.schoolAffiliation ? (
                <Text
                  numberOfLines={1}
                  style={[typography.micro, { color: colors.textMuted, flexShrink: 1 }]}
                >
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
            hitSlop={6}
            style={({ pressed }) => [styles.follow, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="plus" size={14} color={colors.primary} />
            <Text style={[typography.label, { color: colors.primary }]}>
              {t("follow")}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("settings")}
          onPress={() => setSheet("menu")}
          hitSlop={6}
          style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Feather name="more-horizontal" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <Pressable
        accessibilityRole={detail ? undefined : "button"}
        onPress={detail ? undefined : () => router.push(`/social/post/${post.id}`)}
      >
        <View style={styles.body}>
          {post.type === "question" ? (
            <View style={[styles.questionLabel, { backgroundColor: colors.infoSoft }]}>
              <Feather name="help-circle" size={12} color={colors.info} />
              <Text style={[typography.micro, { color: colors.info }]}>
                {t("professional_question")}
              </Text>
            </View>
          ) : null}
          {post.type === "question" ? (
            <Text style={[typography.subheading, { color: colors.text }]}>
              {post.questionTitle}
            </Text>
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
          {post.hashtags.length ? (
            <Text style={[typography.bodyStrong, { color: colors.primary }]}>
              {post.hashtags.map((tag) => `#${tag}`).join(" ")}
            </Text>
          ) : null}
          {post.category || post.location ? (
            <View style={styles.metadata}>
              {post.category ? (
                <View style={[styles.softChip, { backgroundColor: colors.primarySoft }]}>
                  <Feather name="bookmark" size={11} color={colors.primary} />
                  <Text style={[typography.micro, { color: colors.primary }]}>
                    {post.category}
                  </Text>
                </View>
              ) : null}
              {post.location ? (
                <View style={[styles.softChip, { backgroundColor: colors.surfaceMuted }]}>
                  <Feather name="map-pin" size={11} color={colors.textMuted} />
                  <Text style={[typography.micro, { color: colors.textMuted }]}>
                    {post.location}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
          {taggedNames.length ? (
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {t("tag_teachers")}: {taggedNames.join(", ")}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {/*
        Media and polls sit OUTSIDE the open-post pressable. Nesting them meant
        both handlers fired on web: tapping an image opened the viewer and
        pushed the detail screen over it, and voting in a poll navigated away.
      */}
      {post.images.length ? (
        <MediaGrid
          images={post.images}
          descriptions={post.imageDescriptions}
          fallbackLabel={t("image_post")}
          onOpen={(position) =>
            router.push(`/social/gallery/${post.id}?index=${position}`)
          }
        />
      ) : null}

      {post.type === "poll" ? (
        <PollContent post={post} onSelect={selectPollOption} />
      ) : null}

      {post.type === "reshare" || post.type === "quote" ? (
        <Pressable
          accessibilityRole={detail ? undefined : "button"}
          onPress={detail ? undefined : () => router.push(`/social/post/${post.id}`)}
        >
          <View
            style={[
              styles.original,
              { borderColor: colors.border, backgroundColor: colors.surfaceMuted },
            ]}
          >
            <View style={[styles.originalAccent, { backgroundColor: colors.primary }]} />
            {original && originalAuthor ? (
              <View style={styles.originalBody}>
                <View style={styles.originalAuthor}>
                  <Avatar name={originalAuthor.name} uri={originalAuthor.photoUrl} size={30} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={[typography.label, { color: colors.text }]}>
                      {originalAuthor.name}
                    </Text>
                    <Text style={[typography.micro, { color: colors.textMuted }]}>
                      {formatRelativeTime(original.createdAt, language)}
                    </Text>
                  </View>
                </View>
                {original.type === "question" ? (
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>
                    {original.questionTitle}
                  </Text>
                ) : null}
                <Text
                  numberOfLines={5}
                  style={[typography.body, { color: colors.textSecondary }]}
                >
                  {original.text}
                </Text>
              </View>
            ) : (
              <View style={styles.originalBody}>
                <Text style={[typography.body, { color: colors.textMuted }]}>
                  {t("original_unavailable")}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      ) : null}

      {/* Always rendered: reacting to a post with no prior reactions would
          otherwise make this row appear and shove the action bar down. */}
      <View style={[styles.summary, { borderBottomColor: colors.divider }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${post.reactions.total} ${t("react")}`}
          onPress={() => setSheet("reactions")}
          hitSlop={6}
          disabled={!post.reactions.total}
          style={styles.summaryLeft}
        >
          {topReactions.length ? (
            <View style={styles.bubbleStack}>
              {topReactions.map((entry, index) => (
                  <View
                    key={entry.type}
                    style={[
                      styles.bubble,
                      {
                        backgroundColor: reactionPalette[entry.type],
                        borderColor: colors.feedCard,
                        marginLeft: index === 0 ? 0 : -7,
                        zIndex: topReactions.length - index,
                      },
                    ]}
                  >
                    <Ionicons name={reactionIcons[entry.type]} size={10} color="#FFFFFF" />
                  </View>
                ))}
              </View>
            ) : null}
          {post.reactions.total ? (
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {post.reactions.total}
            </Text>
          ) : null}
        </Pressable>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {post.commentCount ? `${post.commentCount} ${t("comments")}` : ""}
          {post.commentCount && post.reshareCount ? " · " : ""}
          {post.reshareCount ? `${post.reshareCount} ${t("reshare")}` : ""}
        </Text>
      </View>

      <View style={styles.actions}>
        <PostAction
          icon={reaction ? reactionIcons[reaction] : "thumbs-up-outline"}
          label={reactionLabel}
          color={reactionTint}
          active={Boolean(reaction)}
          onPress={() => void repository.react(post.id, reaction ?? "like")}
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
          active={post.saved}
          onPress={() => void repository.savePost(post.id)}
        />
      </View>

      <ActionSheet visible={sheet !== null} onClose={() => setSheet(null)}>
        {sheet === "reactions" ? (
          <View style={styles.reactionPicker}>
            {reactionOrder.map((item) => (
              <PressableScale
                key={item}
                accessibilityRole="button"
                accessibilityLabel={t(`reaction_${item}`)}
                onPress={() => {
                  setSheet(null);
                  void repository.react(post.id, item);
                }}
                scaleTo={0.88}
                style={styles.reactionChoice}
              >
                <View
                  style={[styles.reactionOrb, { backgroundColor: reactionPalette[item] }]}
                >
                  <Ionicons name={reactionIcons[item]} size={22} color="#FFFFFF" />
                </View>
                <Text style={[typography.micro, { color: colors.textSecondary }]}>
                  {t(`reaction_${item}`)}
                </Text>
              </PressableScale>
            ))}
          </View>
        ) : null}
        {sheet === "share" ? (
          <View style={styles.sheetList}>
            <SheetTitle label={t("share")} />
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
            <SheetTitle label={t("report_post")} />
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
                      .then(() => notify(t("success"), t("report_confirmed")))
                      .catch(() => notify(t("error"), t("operation_failed")));
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

/**
 * Facebook-style media collage. Tiles bleed to the card edges and the layout
 * changes shape with the image count, so a single photo reads large and a set
 * stays scannable without horizontal scrolling.
 */
function MediaGrid({
  images,
  descriptions,
  fallbackLabel,
  onOpen,
}: {
  images: string[];
  descriptions: string[];
  fallbackLabel: string;
  /** Opens the full-screen viewer at the tapped image. */
  onOpen: (index: number) => void;
}) {
  const { colors } = useAppTheme();
  const label = (index: number) => descriptions[index] || `${fallbackLabel} ${index + 1}`;
  const tile = { backgroundColor: colors.surfaceMuted };

  // A tile handles its own press so it wins over the card's open-post handler.
  const Tile = ({
    uri,
    index,
    style,
    children,
  }: {
    uri: string;
    index: number;
    style: StyleProp<ViewStyle>;
    children?: React.ReactNode;
  }) => (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel={label(index)}
      onPress={(event) => {
        // On web the press would otherwise bubble to the card and also open
        // the post detail screen behind the viewer.
        event.stopPropagation?.();
        onOpen(index);
      }}
      style={({ pressed }) => [style, { opacity: pressed ? 0.85 : 1 }]}
    >
      <Image source={{ uri }} style={[StyleSheet.absoluteFill, tile]} resizeMode="cover" />
      {children}
    </Pressable>
  );

  if (images.length === 1) {
    return (
      <View style={styles.media}>
        <Tile uri={images[0]} index={0} style={styles.mediaSingle} />
      </View>
    );
  }

  if (images.length === 2) {
    return (
      <View style={[styles.media, styles.mediaRow]}>
        {images.map((uri, index) => (
          <Tile key={`${uri}-${index}`} uri={uri} index={index} style={styles.mediaHalf} />
        ))}
      </View>
    );
  }

  if (images.length === 3) {
    return (
      <View style={[styles.media, styles.mediaRow]}>
        <Tile uri={images[0]} index={0} style={styles.mediaLead} />
        <View style={styles.mediaColumn}>
          {images.slice(1, 3).map((uri, index) => (
            <Tile
              key={`${uri}-${index}`}
              uri={uri}
              index={index + 1}
              style={styles.mediaStacked}
            />
          ))}
        </View>
      </View>
    );
  }

  const visible = images.slice(0, 4);
  const overflow = images.length - visible.length;
  return (
    <View style={[styles.media, styles.mediaGrid]}>
      {visible.map((uri, index) => (
        <Tile key={`${uri}-${index}`} uri={uri} index={index} style={styles.mediaQuarter}>
          {index === 3 && overflow > 0 ? (
            <View style={[styles.mediaOverflow, { backgroundColor: colors.overlay }]}>
              <Text style={styles.mediaOverflowText}>+{overflow}</Text>
            </View>
          ) : null}
        </Tile>
      ))}
    </View>
  );
}

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
      <Text style={[typography.bodyStrong, { color: colors.text }]}>
        {post.poll.question}
      </Text>
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
            style={[
              styles.pollOption,
              {
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <PollFill percent={percent} color={colors.primarySoft} />
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
                size={17}
                color={selected ? colors.primary : colors.textMuted}
              />
              <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
                {option.text}
              </Text>
              <Text
                style={[
                  typography.label,
                  { color: selected ? colors.primary : colors.textSecondary },
                ]}
              >
                {percent}%
              </Text>
            </View>
          </Pressable>
        );
      })}
      <Text style={[typography.micro, { color: colors.textMuted }]}>
        {total} {t("votes")} · {post.poll.multiple ? t("multiple_choice") : t("vote")}
      </Text>
    </View>
  );
}

/** Animates the result bar so a vote visibly moves the poll. */
function PollFill({ percent, color }: { percent: number; color: string }) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, {
      toValue: percent,
      duration: motion.slow,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent, width]);
  return (
    <Animated.View
      style={[
        styles.pollFill,
        {
          backgroundColor: color,
          width: width.interpolate({
            inputRange: [0, 100],
            outputRange: ["0%", "100%"],
          }),
        },
      ]}
    />
  );
}

function PostAction({
  icon,
  label,
  color,
  active,
  onPress,
  onLongPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  color: string;
  active?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={260}
      scaleTo={0.93}
      style={styles.action}
    >
      <View style={[styles.actionInner, active && { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={18} color={color} />
        <Text numberOfLines={1} style={[typography.micro, { color }]}>
          {label}
        </Text>
      </View>
    </PressableScale>
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
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: motion.normal,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [slide, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
      >
        {/*
          `alignSelf: stretch` keeps the sheet full width, and the max height is
          a pixel value rather than a percentage: this wrapper has no definite
          height of its own, so a percentage never resolved and the taller
          sheets clipped their last row.
        */}
        <Animated.View
          style={{
            alignSelf: "stretch",
            maxHeight: height * 0.7,
            transform: [
              {
                translateY: slide.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
            ],
          }}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.sheet,
              { backgroundColor: colors.surfaceElevated },
              elevation.overlay,
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            {/* Scrollable so a long sheet (six report reasons) can never clip,
                while a short one still hugs its content. */}
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.md + insets.bottom }}
            >
              {children}
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function SheetTitle({ label }: { label: string }) {
  const { colors } = useAppTheme();
  return (
    <Text style={[typography.heading, { color: colors.text, marginBottom: spacing.xxs }]}>
      {label}
    </Text>
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
      style={({ pressed }) => [
        styles.sheetButton,
        { backgroundColor: pressed ? colors.surfaceMuted : "transparent" },
      ]}
    >
      <View
        style={[
          styles.sheetIcon,
          { backgroundColor: destructive ? colors.errorSoft : colors.surfaceMuted },
        ]}
      >
        <Feather name={icon} size={17} color={color} />
      </View>
      <Text style={[typography.bodyStrong, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: layout.gutter,
    marginBottom: layout.cardGap,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.xxs,
    overflow: "hidden",
  },
  // In detail view the card is the whole screen, so it drops its float.
  cardDetail: {
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 0,
    borderWidth: 0,
  },
  recommended: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  authorPress: { flex: 1, flexDirection: "row", gap: spacing.sm },
  avatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  authorText: { flex: 1, gap: 1, paddingTop: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  follow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -6,
  },
  body: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.xs },
  questionLabel: {
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  metadata: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  softChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  media: { marginTop: spacing.sm },
  mediaRow: { flexDirection: "row", gap: 2 },
  mediaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 2 },
  mediaSingle: { width: "100%", aspectRatio: 4 / 3 },
  mediaHalf: { flex: 1, height: 210 },
  mediaLead: { flex: 1.4, height: 232 },
  mediaColumn: { flex: 1, gap: 2 },
  mediaStacked: { flex: 1, width: "100%" },
  mediaQuarter: { width: "49.7%", height: 138, overflow: "hidden" },
  mediaOverflow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaOverflowText: { color: "#FFFFFF", fontSize: 24, fontWeight: "800" },
  poll: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: 6 },
  pollOption: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: radii.md,
    overflow: "hidden",
    justifyContent: "center",
  },
  pollFill: { position: "absolute", left: 0, top: 0, bottom: 0 },
  pollText: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  original: {
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  originalAccent: { width: 3 },
  originalBody: { flex: 1, padding: spacing.sm, gap: spacing.xs },
  originalAuthor: { flexDirection: "row", gap: spacing.xs, alignItems: "center" },
  summary: {
    marginHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
    minHeight: 32,
  },
  summaryLeft: { flexDirection: "row", alignItems: "center", gap: 5 },
  bubbleStack: { flexDirection: "row", alignItems: "center" },
  bubble: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { minHeight: 46, flexDirection: "row", paddingHorizontal: spacing.xs },
  action: { flex: 1 },
  actionInner: {
    minHeight: 42,
    margin: 3,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: { flex: 1, justifyContent: "flex-end", padding: spacing.sm },
  sheet: {
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  sheetList: { gap: 2 },
  sheetButton: {
    minHeight: 52,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sheetIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  reactionPicker: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 4,
    paddingVertical: spacing.sm,
  },
  reactionChoice: { minWidth: 56, alignItems: "center", justifyContent: "center", gap: 5 },
  reactionOrb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
});
