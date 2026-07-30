import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { EmptyState, LoadingState } from "@/components/ui";
import { Comment, CURRENT_TEACHER_ID } from "@/social/models";
import { useSocial } from "@/social/hooks/useSocial";
import { describeSocialError } from "@/social/api/describeError";
import { PostCard } from "@/social/components/PostCard";
import { Avatar } from "@/social/components/Avatar";
import { formatRelativeTime } from "@/social/utils/format";
import { radii, spacing, typography } from "@/constants/theme";

export default function PostDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { repository, snapshot } = useSocial();
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Comment>();
  const [sending, setSending] = useState(false);
  const post = snapshot.posts.find((candidate) => candidate.id === id);

  // The mock held every post in memory, so this screen only needed comments.
  // Now the post itself may not be cached — deep link, notification tap, cold
  // start — so both are fetched.
  useEffect(() => {
    setLoading(true);
    void Promise.all([
      repository.getPost(id).catch(() => undefined),
      repository.getComments(id).catch(() => undefined),
    ]).finally(() => setLoading(false));
  }, [id, repository]);

  const roots = useMemo(
    () =>
      snapshot.comments
        .filter((comment) => comment.postId === id && !comment.parentId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [id, snapshot.comments],
  );

  const submit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await repository.addComment(id, text, replyTo?.id);
      setText("");
      setReplyTo(undefined);
    } catch (cause) {
      Alert.alert(t("error"), describeSocialError(cause, t("operation_failed")));
    } finally {
      setSending(false);
    }
  };

  if (!post) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Header title={t("post")} onBack={() => router.back()} />
        <EmptyState icon="file-text" title={t("original_unavailable")} message={t("back")} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <Header title={t("post")} onBack={() => router.back()} />
      {loading ? (
        <View style={{ padding: spacing.md }}>
          <LoadingState rows={6} />
        </View>
      ) : (
        <FlatList
          data={roots}
          keyExtractor={(comment) => comment.id}
          renderItem={({ item }) => (
            <CommentThread
              comment={item}
              replies={snapshot.comments.filter((candidate) => candidate.parentId === item.id)}
              onReply={setReplyTo}
            />
          )}
          ListHeaderComponent={
            <>
              <PostCard post={post} detail />
              <Text style={[styles.commentsTitle, typography.heading, { color: colors.text }]}>
                {t("comments")}
              </Text>
            </>
          }
          ListEmptyComponent={
            <EmptyState icon="message-circle" title={t("no_comments")} message={t("add_comment")} />
          }
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}
      {replyTo ? (
        <View style={[styles.replyBanner, { backgroundColor: colors.infoSoft }]}>
          <Text numberOfLines={1} style={[typography.caption, { color: colors.info, flex: 1 }]}>
            {t("reply")}: {snapshot.teachers.find((teacher) => teacher.id === replyTo.authorId)?.name}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t("cancel")} onPress={() => setReplyTo(undefined)}>
            <Feather name="x" size={18} color={colors.info} />
          </Pressable>
        </View>
      ) : null}
      <View
        style={[
          styles.composer,
          {
            paddingBottom: Math.max(insets.bottom, spacing.xs),
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TextInput
          accessibilityLabel={t("add_comment")}
          value={text}
          onChangeText={setText}
          placeholder={t("add_comment")}
          placeholderTextColor={colors.textMuted}
          multiline
          style={[
            styles.commentInput,
            { color: colors.text, backgroundColor: colors.surfaceMuted, borderColor: colors.border },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("comment")}
          accessibilityState={{ disabled: !text.trim() || sending }}
          disabled={!text.trim() || sending}
          onPress={submit}
          style={[styles.send, { backgroundColor: text.trim() ? colors.primary : colors.disabled }]}
        >
          <Feather name="send" size={19} color={text.trim() ? colors.onPrimary : colors.disabledText} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.headerButton}>
        <Feather name="arrow-left" size={22} color={colors.text} />
      </Pressable>
      <Text style={[typography.heading, { color: colors.text }]}>{title}</Text>
      <View style={styles.headerButton} />
    </View>
  );
}

function CommentThread({
  comment,
  replies,
  onReply,
}: {
  comment: Comment;
  replies: Comment[];
  onReply: (comment: Comment) => void;
}) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { language, t } = useLanguage();
  const { repository, snapshot } = useSocial();
  const render = (item: Comment, nested: boolean) => {
    const author = snapshot.teachers.find((teacher) => teacher.id === item.authorId);
    if (!author) return null;
    return (
      <View
        key={item.id}
        style={[styles.comment, nested && styles.nestedComment, { borderLeftColor: colors.border }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={author.name}
          onPress={() => router.push(`/social/profile/${author.id}`)}
          style={{ alignSelf: "flex-start" }}
        >
          <Avatar name={author.name} uri={author.photoUrl} size={nested ? 32 : 38} />
        </Pressable>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={[styles.commentBubble, { backgroundColor: colors.surfaceMuted }]}>
            <Text style={[typography.label, { color: colors.text }]}>{author.name}</Text>
            <Text style={[typography.body, { color: item.deleted ? colors.textMuted : colors.text }]}>
              {item.deleted ? t("comment_deleted") : item.text}
            </Text>
          </View>
          <View style={styles.commentActions}>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {formatRelativeTime(item.createdAt, language)}
            </Text>
            {!nested && !item.deleted ? (
              <Pressable accessibilityRole="button" onPress={() => onReply(item)}>
                <Text style={[typography.label, { color: colors.primary }]}>{t("reply")}</Text>
              </Pressable>
            ) : null}
            {item.authorId === CURRENT_TEACHER_ID && !item.deleted ? (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  Alert.alert(t("delete"), t("delete_post_confirm"), [
                    { text: t("cancel"), style: "cancel" },
                    { text: t("delete"), style: "destructive", onPress: () => void repository.deleteComment(item.id) },
                  ])
                }
              >
                <Text style={[typography.label, { color: colors.error }]}>{t("delete")}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  };
  return (
    <View style={styles.thread}>
      {render(comment, false)}
      {replies.map((reply) => render(reply, true))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 58, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerButton: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  commentsTitle: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  thread: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  comment: { flexDirection: "row", gap: spacing.xs },
  nestedComment: { marginLeft: 42, marginTop: spacing.xs, paddingLeft: spacing.sm, borderLeftWidth: 2 },
  commentBubble: { borderRadius: radii.md, padding: spacing.sm, gap: 2 },
  commentActions: { minHeight: 28, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.xs },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "flex-end", gap: spacing.xs, paddingHorizontal: spacing.sm, paddingTop: spacing.xs },
  commentInput: { flex: 1, minHeight: 46, maxHeight: 110, borderWidth: 1, borderRadius: 23, paddingHorizontal: spacing.md, paddingVertical: 11, ...typography.body },
  send: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  replyBanner: { minHeight: 34, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, gap: spacing.sm },
});
