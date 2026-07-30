import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { CURRENT_TEACHER_ID, Message } from "@/social/models";
import { useSocial } from "@/social/hooks/useSocial";
import { Avatar } from "@/social/components/Avatar";
import { formatDate, formatRelativeTime } from "@/social/utils/format";
import { radii, spacing, typography } from "@/constants/theme";

export default function ConversationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { language, t } = useLanguage();
  const { repository, snapshot } = useSocial();
  const listRef = useRef<FlatList<Message>>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const conversation = snapshot.conversations.find((candidate) => candidate.id === id);
  const otherId = conversation?.participantIds.find((participantId) => participantId !== CURRENT_TEACHER_ID);
  const teacher = snapshot.teachers.find((candidate) => candidate.id === otherId);

  useEffect(() => {
    if (conversation?.unreadCount) void repository.markConversationRead(id);
  }, [conversation?.unreadCount, id, repository]);

  if (!conversation || !teacher) return null;

  const send = async () => {
    if (!text.trim() || sending) return;
    const outgoing = text;
    setText("");
    setSending(true);
    try {
      await repository.sendMessage(id, outgoing);
    } catch {
      setText(outgoing);
      Alert.alert(t("error"), t("operation_failed"));
    } finally {
      setSending(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.82,
      });
      if (!result.canceled) await repository.sendImage(id, result.assets[0].uri);
    } catch {
      Alert.alert(t("error"), t("operation_failed"));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(`/social/profile/${teacher.id}`)}
        style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      >
        <Pressable accessibilityRole="button" accessibilityLabel={t("back")} onPress={() => router.back()} style={styles.iconButton}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Avatar name={teacher.name} uri={teacher.photoUrl} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>{teacher.name}</Text>
          <Text style={[typography.caption, { color: colors.success }]}>{t("mutual_follow")}</Text>
        </View>
      </Pressable>
      <FlatList
        ref={listRef}
        data={conversation.messages}
        keyExtractor={(message) => message.id}
        renderItem={({ item, index }) => (
          <>
            {index === 0 ||
            formatDate(conversation.messages[index - 1].sentAt, language) !== formatDate(item.sentAt, language) ? (
              <Text style={[styles.date, typography.caption, { color: colors.textMuted }]}>
                {formatDate(item.sentAt, language)}
              </Text>
            ) : null}
            <MessageBubble message={item} />
          </>
        )}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <Text style={[typography.body, { color: colors.textMuted, textAlign: "center", marginTop: spacing.xxl }]}>
            {t("type_message")}
          </Text>
        }
      />
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
        <Pressable accessibilityRole="button" accessibilityLabel={t("add_images")} onPress={pickImage} style={styles.iconButton}>
          <Feather name="image" size={21} color={colors.primary} />
        </Pressable>
        <TextInput
          accessibilityLabel={t("type_message")}
          value={text}
          onChangeText={setText}
          placeholder={t("type_message")}
          placeholderTextColor={colors.textMuted}
          multiline
          style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceMuted }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("message")}
          accessibilityState={{ disabled: !text.trim() || sending }}
          disabled={!text.trim() || sending}
          onPress={send}
          style={[styles.send, { backgroundColor: text.trim() ? colors.primary : colors.disabled }]}
        >
          <Feather name="send" size={19} color={text.trim() ? colors.onPrimary : colors.disabledText} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { language, t } = useLanguage();
  const mine = message.senderId === CURRENT_TEACHER_ID;
  const openShared = () => {
    if (!message.sharedId) return;
    if (message.kind === "post") router.push(`/social/post/${message.sharedId}`);
    if (message.kind === "job") router.push(`/social/job/${message.sharedId}`);
    if (message.kind === "profile") router.push(`/social/profile/${message.sharedId}`);
  };
  return (
    <View style={[styles.messageWrap, mine ? styles.mine : styles.theirs]}>
      <Pressable
        accessibilityRole={message.sharedId ? "button" : undefined}
        onPress={message.sharedId ? openShared : undefined}
        style={[
          styles.bubble,
          {
            backgroundColor: mine ? colors.primary : colors.surface,
            borderColor: mine ? colors.primary : colors.border,
          },
        ]}
      >
        {message.kind === "image" && message.mediaUri ? (
          <Image source={{ uri: message.mediaUri }} accessibilityLabel={t("image_post")} style={styles.messageImage} />
        ) : null}
        {message.sharedId ? (
          <View style={[styles.shared, { borderColor: mine ? colors.onPrimary : colors.border }]}>
            <Feather
              name={message.kind === "job" ? "briefcase" : message.kind === "profile" ? "user" : "file-text"}
              size={18}
              color={mine ? colors.onPrimary : colors.primary}
            />
            <Text style={[typography.label, { color: mine ? colors.onPrimary : colors.text }]}>
              {message.kind === "job" ? t("jobs") : message.kind === "profile" ? t("professional_profile") : t("post")}
            </Text>
          </View>
        ) : null}
        {message.text ? (
          <Text style={[typography.body, { color: mine ? colors.onPrimary : colors.text }]}>{message.text}</Text>
        ) : null}
        <View style={styles.receipt}>
          <Text style={[typography.caption, { color: mine ? colors.onPrimary : colors.textMuted, opacity: 0.82 }]}>
            {formatRelativeTime(message.sentAt, language)}
          </Text>
          {mine ? (
            <Feather name={message.status === "read" ? "check-circle" : "check"} size={13} color={colors.onPrimary} />
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 62, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingRight: spacing.md },
  iconButton: { width: 50, height: 50, alignItems: "center", justifyContent: "center" },
  messages: { padding: spacing.md, gap: spacing.xs, flexGrow: 1 },
  date: { textAlign: "center", marginVertical: spacing.sm },
  messageWrap: { flexDirection: "row" },
  mine: { justifyContent: "flex-end", paddingLeft: 52 },
  theirs: { justifyContent: "flex-start", paddingRight: 52 },
  bubble: { maxWidth: "100%", borderWidth: 1, borderRadius: radii.lg, padding: spacing.sm, gap: 5 },
  messageImage: { width: 220, height: 180, borderRadius: radii.md },
  shared: { minHeight: 48, borderWidth: 1, borderRadius: radii.md, flexDirection: "row", alignItems: "center", gap: spacing.xs, padding: spacing.sm },
  receipt: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 4 },
  composer: { minHeight: 62, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "flex-end", gap: spacing.xs, paddingHorizontal: spacing.xs, paddingTop: spacing.xs },
  input: { flex: 1, minHeight: 46, maxHeight: 110, borderRadius: 23, paddingHorizontal: spacing.md, paddingVertical: 11, ...typography.body },
  send: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
});
