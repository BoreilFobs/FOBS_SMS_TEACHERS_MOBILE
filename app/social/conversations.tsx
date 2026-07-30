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
import { EmptyState, SearchInput } from "@/components/ui";
import { CURRENT_TEACHER_ID } from "@/social/models";
import { useSocial } from "@/social/hooks/useSocial";
import { SOCIAL_POLLING } from "@/social/constants/network";
import { usePolling } from "@/social/hooks/usePolling";
import { SocialScreenHeader } from "@/social/components/ScreenHeader";
import { Avatar } from "@/social/components/Avatar";
import { formatRelativeTime } from "@/social/utils/format";
import { spacing, typography } from "@/constants/theme";

export default function ConversationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { language, t } = useLanguage();
  const { repository, snapshot } = useSocial();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  // Conversation search runs server-side: filtering only the loaded page would
  // silently miss older conversations once the list paginates.
  useEffect(() => {
    const handle = setTimeout(() => {
      void repository
        .getConversations(query.trim() || undefined)
        .finally(() => setLoading(false));
    }, query ? 300 : 0);

    return () => clearTimeout(handle);
  }, [query, repository]);

  // Mutual-follow eligibility is server-owned, so the "new message" list is
  // fetched rather than derived from cached follow flags.
  useEffect(() => {
    if (showNew) void repository.getEligibleTeachers().catch(() => undefined);
  }, [repository, showNew]);

  // Longer interval than an open thread: this only needs to keep unread badges
  // and ordering roughly current.
  usePolling(
    async () => {
      await repository.getConversations(query.trim() || undefined);
    },
    SOCIAL_POLLING.conversationListMs,
    { immediate: false },
  );

  const conversations = useMemo(
    () =>
      [...snapshot.conversations]
        .filter((conversation) => {
          const otherId = conversation.participantIds.find((id) => id !== CURRENT_TEACHER_ID);
          const teacher = snapshot.teachers.find((candidate) => candidate.id === otherId);
          // The server has already applied the query; this narrows the cached copy
          // while a debounced request is still in flight.
          return teacher && !teacher.blocked && teacher.name.toLowerCase().includes(query.toLowerCase());
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [query, snapshot.conversations, snapshot.teachers],
  );
  const eligible = snapshot.teachers.filter(
    (teacher) =>
      teacher.id !== CURRENT_TEACHER_ID &&
      !teacher.blocked &&
      teacher.followedByCurrentUser &&
      teacher.followsCurrentUser,
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <SocialScreenHeader
        title={t("messages")}
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("new_message")}
            onPress={() => setShowNew((value) => !value)}
            style={[styles.newButton, { backgroundColor: colors.primarySoft }]}
          >
            <Feather name={showNew ? "x" : "edit"} size={20} color={colors.primary} />
          </Pressable>
        }
      />
      <View style={styles.search}>
        <SearchInput value={query} onChangeText={setQuery} placeholder={t("messages")} />
      </View>
      {showNew ? (
        <View style={[styles.eligible, { borderBottomColor: colors.border }]}>
          <Text style={[typography.label, { color: colors.textSecondary }]}>{t("mutual_follow")}</Text>
          <FlatList
            horizontal
            data={eligible}
            keyExtractor={(teacher) => teacher.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t("new_message")}: ${item.name}`}
                onPress={() =>
                  void repository.startConversation(item.id).then((conversation) => {
                    setShowNew(false);
                    router.push(`/social/conversation/${conversation.id}`);
                  })
                }
                style={styles.eligibleTeacher}
              >
                <Avatar name={item.name} uri={item.photoUrl} size={48} />
                <Text numberOfLines={1} style={[typography.caption, { color: colors.text, maxWidth: 82 }]}>
                  {item.name}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={<Text style={[typography.body, { color: colors.textMuted }]}>{t("no_eligible_conversations")}</Text>}
          />
        </View>
      ) : null}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(conversation) => conversation.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.divider }]} />}
          renderItem={({ item }) => {
            const otherId = item.participantIds.find((id) => id !== CURRENT_TEACHER_ID);
            const teacher = snapshot.teachers.find((candidate) => candidate.id === otherId);
            if (!teacher) return null;
            const last = item.messages[item.messages.length - 1];
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t("messages")}: ${teacher.name}`}
                onPress={() => router.push(`/social/conversation/${item.id}`)}
                style={({ pressed }) => [styles.conversation, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Avatar name={teacher.name} uri={teacher.photoUrl} size={54} />
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={styles.conversationTop}>
                    <Text style={[typography.bodyStrong, { color: colors.text, flex: 1 }]}>{teacher.name}</Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>
                      {formatRelativeTime(item.updatedAt, language)}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      item.unreadCount ? typography.bodyStrong : typography.body,
                      { color: item.unreadCount ? colors.text : colors.textSecondary },
                    ]}
                  >
                    {last?.text || (last?.kind === "image" ? t("image_post") : t("share"))}
                  </Text>
                </View>
                {item.unreadCount ? (
                  <View style={[styles.unread, { backgroundColor: colors.primary }]}>
                    <Text style={styles.unreadText}>{item.unreadCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          }}
          ListEmptyComponent={<EmptyState icon="message-circle" title={t("conversation_empty")} message={t("mutual_required")} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  newButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  search: { padding: spacing.md, paddingBottom: spacing.xs },
  eligible: { padding: spacing.md, gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  eligibleTeacher: { alignItems: "center", gap: 4 },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  conversation: { minHeight: 78, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  conversationTop: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
  unread: { minWidth: 23, height: 23, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  unreadText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
});
