import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Conversation, Message } from "@/social/models";
import { isCurrentTeacher } from "@/social/api/identity";
import { SOCIAL_POLLING } from "@/social/constants/network";
import { usePolling } from "@/social/hooks/usePolling";
import { describeSocialError } from "@/social/api/describeError";
import { useSocial } from "@/social/hooks/useSocial";
import { socialStore } from "@/social/store/socialStore";
import { Avatar } from "@/social/components/Avatar";
import { formatDate } from "@/social/utils/format";
import * as Clipboard from "expo-clipboard";
import { confirmAction, notify } from "@/utils/dialog";
import { saveImageToDevice } from "@/utils/saveImage";
import { Divider } from "@/components/ui";
import { cacheKeys, readCache, writeCache } from "@/utils/offline/cache";
import { motion, radii, spacing, typography } from "@/constants/theme";

/** Local upload progress, keyed by the picked image URI. */
type UploadMap = Record<string, number>;

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
  const [uploads, setUploads] = useState<UploadMap>({});
  const [preview, setPreview] = useState<string | null>(null);
  // The message the long-press sheet is acting on.
  const [actionTarget, setActionTarget] = useState<Message | null>(null);
  // Composing a reply to, or an edit of, an existing message.
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [forwarding, setForwarding] = useState<Message | null>(null);
  const conversation = snapshot.conversations.find((candidate) => candidate.id === id);
  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;
  const otherId = conversation?.participantIds.find(
    (participantId) => !isCurrentTeacher(participantId),
  );
  const teacher = snapshot.teachers.find((candidate) => candidate.id === otherId);

  // Paint the cached thread before the network answers, so reopening a chat
  // shows messages immediately instead of an empty screen.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [cachedConversations, cachedMessages] = await Promise.all([
        readCache<Conversation[]>(cacheKeys.conversations),
        readCache<Message[]>(cacheKeys.messages(id)),
      ]);
      if (cancelled) return;
      if (cachedConversations?.length) socialStore.upsertConversations(cachedConversations);
      if (cachedMessages?.length) socialStore.setConversationMessages(id, cachedMessages);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    void repository.getConversations().catch(() => undefined);
    void repository.getMessages(id).catch(() => undefined);
  }, [id, repository]);

  // Keep the cache warm as the thread changes.
  useEffect(() => {
    if (conversation?.messages.length) {
      void writeCache(cacheKeys.messages(id), conversation.messages.slice(-60));
    }
  }, [conversation?.messages, id]);

  usePolling(
    async () => {
      await repository.getMessages(id);
      if (conversationRef.current?.unreadCount) {
        await repository.markConversationRead(id);
      }
    },
    SOCIAL_POLLING.openConversationMs,
    { immediate: false },
  );

  useEffect(() => {
    if (conversation?.unreadCount) void repository.markConversationRead(id);
  }, [conversation?.unreadCount, id, repository]);

  const canSend = repository.canSend(id);

  const send = useCallback(async () => {
    if (!text.trim() || sending) return;
    const outgoing = text;
    const editTarget = editing;
    const replyTarget = replyTo;

    setText("");
    setEditing(null);
    setReplyTo(null);
    setSending(true);

    try {
      if (editTarget) {
        await repository.editMessage(id, editTarget.id, outgoing);
      } else {
        await repository.sendMessage(id, outgoing, { replyToId: replyTarget?.id });
      }
    } catch (cause) {
      // Restore the draft and its context so nothing typed is lost.
      setText(outgoing);
      setEditing(editTarget);
      setReplyTo(replyTarget);
      notify(t("error"), describeSocialError(cause, t("operation_failed")));
    } finally {
      setSending(false);
    }
  }, [editing, id, replyTo, repository, sending, t, text]);

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.82,
      });
      if (result.canceled) return;

      const uri = result.assets[0].uri;
      setUploads((current) => ({ ...current, [uri]: 0 }));
      try {
        await repository.sendImage(id, uri, (fraction) =>
          setUploads((current) => ({ ...current, [uri]: fraction })),
        );
      } finally {
        setUploads((current) => {
          const next = { ...current };
          delete next[uri];
          return next;
        });
      }
    } catch (cause) {
      notify(t("error"), describeSocialError(cause, t("operation_failed")));
    }
  }, [id, repository, t]);

  const copyMessage = useCallback(
    async (message: Message) => {
      if (!message.text) return;
      await Clipboard.setStringAsync(message.text);
      notify(t("copied"));
    },
    [t],
  );

  const deleteMessage = useCallback(
    (message: Message) =>
      confirmAction({
        title: t("delete_message"),
        message: t("delete_message_confirm"),
        confirmLabel: t("delete"),
        cancelLabel: t("cancel"),
        destructive: true,
        onConfirm: () => {
          void repository
            .deleteMessage(id, message.id)
            .catch((cause: unknown) =>
              notify(t("error"), describeSocialError(cause, t("operation_failed"))),
            );
        },
      }),
    [id, repository, t],
  );

  if (!conversation || !teacher) return null;

  const messages = conversation.messages;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { backgroundColor: colors.feedBackground, paddingTop: insets.top }]}
    >
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("back")}
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.iconButton}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/social/profile/${teacher.id}`)}
          style={styles.headerIdentity}
        >
          <Avatar name={teacher.name} uri={teacher.photoUrl} size={38} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[typography.bodyStrong, { color: colors.text }]}>
              {teacher.name}
            </Text>
            <Text
              numberOfLines={1}
              style={[typography.micro, { color: canSend ? colors.success : colors.textMuted }]}
            >
              {canSend ? t("mutual_follow") : t("mutual_follow_required")}
            </Text>
          </View>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(message) => message.id}
        renderItem={({ item, index }) => {
          const previous = index > 0 ? messages[index - 1] : undefined;
          const next = index < messages.length - 1 ? messages[index + 1] : undefined;
          const newDay =
            !previous || formatDate(previous.sentAt, language) !== formatDate(item.sentAt, language);
          // Consecutive messages from the same sender group together, so only
          // the last of a run carries the tail and the timestamp.
          const sameRunAsNext = next?.senderId === item.senderId && !(
            next && formatDate(next.sentAt, language) !== formatDate(item.sentAt, language)
          );
          return (
            <>
              {newDay ? (
                <View style={styles.dayWrap}>
                  <Text
                    style={[
                      styles.dayChip,
                      typography.micro,
                      { backgroundColor: colors.surfaceMuted, color: colors.textSecondary },
                    ]}
                  >
                    {formatDate(item.sentAt, language)}
                  </Text>
                </View>
              ) : null}
              <MessageBubble
                message={item}
                grouped={sameRunAsNext}
                progress={item.mediaUri ? uploads[item.mediaUri] : undefined}
                onPreview={setPreview}
                onLongPress={setActionTarget}
              />
            </>
          );
        }}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Feather name="message-circle" size={30} color={colors.textMuted} />
            <Text style={[typography.caption, { color: colors.textMuted, textAlign: "center" }]}>
              {t("type_message")}
            </Text>
          </View>
        }
      />

      {replyTo || editing ? (
        <View
          style={[
            styles.contextBar,
            { backgroundColor: colors.surfaceMuted, borderLeftColor: colors.primary },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[typography.micro, { color: colors.primary }]}>
              {editing ? t("edit_message") : t("replying_to")}
            </Text>
            <Text numberOfLines={1} style={[typography.caption, { color: colors.textSecondary }]}>
              {(editing ?? replyTo)?.text || t("image_post")}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("cancel")}
            hitSlop={8}
            onPress={() => {
              setReplyTo(null);
              if (editing) setText("");
              setEditing(null);
            }}
          >
            <Feather name="x" size={18} color={colors.textMuted} />
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
        {/* Input pill holds the attachment control, so the row reads as one
            field rather than three separate floating controls. */}
        <View style={[styles.inputPill, { backgroundColor: colors.surfaceMuted }]}>
          <TextInput
            accessibilityLabel={t("type_message")}
            editable={canSend}
            value={text}
            onChangeText={setText}
            placeholder={canSend ? t("type_message") : t("mutual_follow_required")}
            placeholderTextColor={colors.textMuted}
            multiline
            style={[styles.input, { color: colors.text }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("add_images")}
            accessibilityState={{ disabled: !canSend }}
            disabled={!canSend}
            onPress={pickImage}
            hitSlop={6}
            style={({ pressed }) => [styles.attach, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather
              name="paperclip"
              size={20}
              color={canSend ? colors.textSecondary : colors.disabledText}
            />
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("message")}
          accessibilityState={{ disabled: !text.trim() || sending || !canSend }}
          disabled={!text.trim() || sending || !canSend}
          onPress={send}
          style={[
            styles.send,
            {
              backgroundColor: text.trim() && canSend ? colors.primary : colors.disabled,
            },
          ]}
        >
          <Feather
            name="send"
            size={19}
            color={text.trim() && canSend ? colors.onPrimary : colors.disabledText}
          />
        </Pressable>
      </View>
      <MessageActionSheet
        message={actionTarget}
        onClose={() => setActionTarget(null)}
        onReply={(message) => {
          setReplyTo(message);
          setEditing(null);
        }}
        onEdit={(message) => {
          setEditing(message);
          setReplyTo(null);
          setText(message.text ?? "");
        }}
        onCopy={(message) => void copyMessage(message)}
        onForward={(message) => setForwarding(message)}
        onDelete={deleteMessage}
      />

      <ForwardPicker
        message={forwarding}
        currentConversationId={id}
        onClose={() => setForwarding(null)}
      />

      <ImagePreview uri={preview} onClose={() => setPreview(null)} />
    </KeyboardAvoidingView>
  );
}

/** Long-press menu for a single message. */
function MessageActionSheet({
  message,
  onClose,
  onReply,
  onEdit,
  onCopy,
  onForward,
  onDelete,
}: {
  message: Message | null;
  onClose: () => void;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onCopy: (message: Message) => void;
  onForward: (message: Message) => void;
  onDelete: (message: Message) => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { height } = useWindowDimensions();
  const { t } = useLanguage();

  if (!message) return null;

  const run = (action: (message: Message) => void) => () => {
    onClose();
    action(message);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        style={[styles.sheetOverlay, { backgroundColor: colors.overlay }]}
      >
        <Pressable
          onPress={(event) => event.stopPropagation?.()}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surfaceElevated,
              paddingBottom: insets.bottom + spacing.md,
              maxHeight: height * 0.7,
            },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

          {/* Scrollable: with reply, copy, forward, edit and delete this can
              outgrow a short screen. */}
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
          <SheetAction icon="corner-up-left" label={t("reply")} onPress={run(onReply)} />
          {message.text ? (
            <SheetAction icon="copy" label={t("copy")} onPress={run(onCopy)} />
          ) : null}
          <SheetAction icon="corner-up-right" label={t("forward")} onPress={run(onForward)} />

          {/* `canEdit` is the server's verdict on the 10-minute window, so a
              device with a skewed clock cannot widen it. */}
          {message.canEdit ? (
            <SheetAction icon="edit-2" label={t("edit_message")} onPress={run(onEdit)} />
          ) : null}
          {message.canDelete ? (
            <>
              <Divider />
              <SheetAction
                icon="trash-2"
                label={t("delete_message")}
                destructive
                onPress={run(onDelete)}
              />
            </>
          ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SheetAction({
  icon,
  label,
  destructive,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const color = destructive ? colors.error : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.sheetAction,
        { backgroundColor: pressed ? colors.surfaceMuted : "transparent" },
      ]}
    >
      <Feather name={icon} size={19} color={color} />
      <Text style={[typography.bodyStrong, { color }]}>{label}</Text>
    </Pressable>
  );
}

/** Picks another conversation to forward a message into. */
function ForwardPicker({
  message,
  currentConversationId,
  onClose,
}: {
  message: Message | null;
  currentConversationId: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { height } = useWindowDimensions();
  const { t } = useLanguage();
  const { repository, snapshot } = useSocial();
  const [sending, setSending] = useState<string | null>(null);

  if (!message) return null;

  const targets = snapshot.conversations.filter(
    (conversation) => conversation.id !== currentConversationId,
  );

  const forward = async (conversationId: string) => {
    if (sending) return;
    setSending(conversationId);
    try {
      // Only text forwards for now: re-sending an image would need the media id
      // rather than the rendered URL.
      await repository.sendMessage(conversationId, message.text ?? "", {
        forwarded: true,
      });
      onClose();
      notify(t("success"), t("forwarded"));
    } catch (cause) {
      notify(t("error"), describeSocialError(cause, t("operation_failed")));
    } finally {
      setSending(null);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        style={[styles.sheetOverlay, { backgroundColor: colors.overlay }]}
      >
        <Pressable
          onPress={(event) => event.stopPropagation?.()}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surfaceElevated,
              paddingBottom: insets.bottom + spacing.md,
              maxHeight: height * 0.7,
            },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[typography.heading, { color: colors.text, paddingHorizontal: spacing.xs }]}>
            {t("forward_to")}
          </Text>

          <FlatList
            data={targets}
            keyExtractor={(conversation) => conversation.id}
            style={{ marginTop: spacing.xs }}
            ListEmptyComponent={
              <Text
                style={[
                  typography.caption,
                  { color: colors.textMuted, padding: spacing.md, textAlign: "center" },
                ]}
              >
                {t("no_results")}
              </Text>
            }
            renderItem={({ item }) => {
              const otherId = item.participantIds.find((id) => !isCurrentTeacher(id));
              const target = snapshot.teachers.find((candidate) => candidate.id === otherId);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={target?.name ?? ""}
                  disabled={sending !== null}
                  onPress={() => void forward(item.id)}
                  style={({ pressed }) => [
                    styles.forwardRow,
                    { backgroundColor: pressed ? colors.surfaceMuted : "transparent" },
                  ]}
                >
                  <Avatar name={target?.name ?? "?"} uri={target?.photoUrl} size={38} />
                  <Text style={[typography.bodyStrong, { color: colors.text, flex: 1 }]}>
                    {target?.name ?? ""}
                  </Text>
                  {sending === item.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Feather name="corner-up-right" size={18} color={colors.textMuted} />
                  )}
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Full-screen preview for a chat image, with the save action.
 *
 * A single image needs no scrolling, so a Modal is safe here — the trouble we
 * hit with modals was specifically scroll containers.
 */
function ImagePreview({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const [saving, setSaving] = useState(false);

  const copy =
    language === "fr"
      ? {
          saved: "Image enregistrée dans vos photos.",
          denied: "Autorisez l’accès aux photos pour enregistrer l’image.",
          failed: "Impossible d’enregistrer l’image.",
        }
      : {
          saved: "Image saved to your photos.",
          denied: "Allow photo access to save the image.",
          failed: "The image could not be saved.",
        };

  const save = async () => {
    if (!uri || saving) return;
    setSaving(true);
    const result = await saveImageToDevice(uri);
    setSaving(false);
    if (result === "saved") notify(t("success"), copy.saved);
    else if (result === "denied") notify(t("error"), copy.denied);
    else notify(t("error"), copy.failed);
  };

  return (
    <Modal
      visible={uri !== null}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.previewRoot}>
        {uri ? (
          <Image
            source={{ uri }}
            accessibilityLabel={t("image_post")}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
          />
        ) : null}

        <View style={[styles.previewBar, { paddingTop: insets.top + spacing.xs }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("back")}
            onPress={onClose}
            hitSlop={10}
            style={({ pressed }) => [styles.previewButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="arrow-left" size={21} color="#FFFFFF" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("download")}
            accessibilityState={{ busy: saving }}
            disabled={saving}
            onPress={() => void save()}
            hitSlop={10}
            style={({ pressed }) => [styles.previewButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name="download" size={20} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function MessageBubble({
  message,
  grouped,
  progress,
  onPreview,
  onLongPress,
}: {
  message: Message;
  /** Another message from the same sender follows, so drop the tail. */
  grouped: boolean;
  /** 0..1 while an outgoing image uploads. */
  progress?: number;
  onPreview: (uri: string) => void;
  onLongPress: (message: Message) => void;
}) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { language, t } = useLanguage();
  const mine = isCurrentTeacher(message.senderId);
  const uploading = progress !== undefined && message.status === "sending";

  const bubbleColor = mine ? colors.primary : colors.surface;
  const textColor = mine ? colors.onPrimary : colors.text;
  const metaColor = mine ? colors.onPrimary : colors.textMuted;

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
        // A deleted message has nothing to act on.
        onLongPress={message.deleted ? undefined : () => onLongPress(message)}
        delayLongPress={280}
        style={[
          styles.bubble,
          {
            backgroundColor: bubbleColor,
            // Incoming bubbles are white on a near-white background in light
            // mode, so they need an edge to read as separate objects.
            borderColor: mine ? "transparent" : colors.border,
          },
          mine ? styles.bubbleMine : styles.bubbleTheirs,
          // The tail belongs on the last bubble of a run only.
          !grouped && (mine ? styles.tailMine : styles.tailTheirs),
        ]}
      >
        {message.deleted ? (
          <View style={styles.deletedRow}>
            <Feather name="slash" size={13} color={metaColor} />
            <Text style={[typography.body, { color: metaColor, fontStyle: "italic" }]}>
              {t("message_deleted")}
            </Text>
          </View>
        ) : null}

        {message.forwarded && !message.deleted ? (
          <View style={styles.forwardedRow}>
            <Feather name="corner-up-right" size={11} color={metaColor} />
            <Text style={[typography.micro, { color: metaColor, opacity: 0.8 }]}>
              {t("forwarded")}
            </Text>
          </View>
        ) : null}

        {message.replyPreview && !message.deleted ? (
          <View
            style={[
              styles.replyPreview,
              {
                backgroundColor: mine ? "rgba(255,255,255,0.18)" : colors.surfaceMuted,
                borderLeftColor: mine ? colors.onPrimary : colors.primary,
              },
            ]}
          >
            <Text numberOfLines={2} style={[typography.micro, { color: textColor }]}>
              {message.replyPreview.deleted
                ? t("message_deleted")
                : message.replyPreview.text || t("image_post")}
            </Text>
          </View>
        ) : null}

        {!message.deleted && message.kind === "image" && message.mediaUri ? (
          <View style={styles.imageWrap}>
            <Pressable
              accessibilityRole="imagebutton"
              accessibilityLabel={t("image_post")}
              onPress={(event) => {
                event.stopPropagation?.();
                if (message.mediaUri) onPreview(message.mediaUri);
              }}
            >
              <ChatImage uri={message.mediaUri} label={t("image_post")} />
            </Pressable>
            {uploading ? (
              <View style={[styles.uploadOverlay, { backgroundColor: colors.overlay }]}>
                <UploadBar progress={progress ?? 0} color={colors.onPrimary} />
                <Text style={[typography.micro, { color: "#FFFFFF" }]}>
                  {Math.round((progress ?? 0) * 100)}%
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {message.sharedId && !message.deleted ? (
          <SharedPreview message={message} mine={mine} />
        ) : null}

        {/*
          Text and meta sit in one wrapping row: a short message keeps the time
          on the same line, a long one lets it fall to the next line flush
          right — the way a chat bubble reads.
        */}
        <View style={styles.textRow}>
          {message.text ? (
            <Text style={[typography.body, styles.messageText, { color: textColor }]}>
              {message.text}
            </Text>
          ) : null}
          <View style={styles.receipt}>
            {message.editedAt && !message.deleted ? (
              <Text style={[typography.micro, { color: metaColor, opacity: 0.6 }]}>
                {t("edited")}
              </Text>
            ) : null}
            <Text style={[typography.micro, { color: metaColor, opacity: 0.75 }]}>
              {formatDate(message.sentAt, language, {
                hour: "numeric",
                minute: "2-digit",
                hour12: language === "en",
              })}
            </Text>
            {mine ? <StatusTicks status={message.status} color={colors.onPrimary} /> : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

/**
 * Preview card for a shared profile, post or job.
 *
 * A bare "Professional profile" label tells the reader nothing, so the card
 * resolves the referenced record from the store and shows what identifies it —
 * for a teacher that is the avatar, name, headline and subjects.
 */
function SharedPreview({ message, mine }: { message: Message; mine: boolean }) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { snapshot } = useSocial();

  const borderColor = mine ? colors.onPrimary : colors.border;
  const textColor = mine ? colors.onPrimary : colors.text;
  const mutedColor = mine ? colors.onPrimary : colors.textSecondary;

  if (message.kind === "profile") {
    const teacher = snapshot.teachers.find((item) => item.id === message.sharedId);
    if (teacher) {
      return (
        <View style={[styles.shared, styles.sharedColumn, { borderColor }]}>
          <View style={styles.sharedIdentity}>
            <Avatar name={teacher.name} uri={teacher.photoUrl} size={36} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={[typography.label, { color: textColor }]}>
                {teacher.name}
              </Text>
              {teacher.headline ? (
                <Text
                  numberOfLines={1}
                  style={[typography.micro, { color: mutedColor, opacity: 0.85 }]}
                >
                  {teacher.headline}
                </Text>
              ) : null}
            </View>
          </View>
          {teacher.subjects.length || teacher.city ? (
            <Text
              numberOfLines={1}
              style={[typography.micro, { color: mutedColor, opacity: 0.75 }]}
            >
              {[teacher.subjects.slice(0, 2).join(" · "), teacher.city]
                .filter(Boolean)
                .join(" • ")}
            </Text>
          ) : null}
        </View>
      );
    }
  }

  if (message.kind === "post") {
    const post = snapshot.posts.find((item) => item.id === message.sharedId);
    const author = post
      ? snapshot.teachers.find((item) => item.id === post.authorId)
      : undefined;
    if (post) {
      return (
        <View style={[styles.shared, styles.sharedColumn, { borderColor }]}>
          <Text numberOfLines={1} style={[typography.micro, { color: mutedColor }]}>
            {author ? author.name : t("post")}
          </Text>
          <Text numberOfLines={3} style={[typography.caption, { color: textColor }]}>
            {post.type === "question" ? post.questionTitle : post.text}
          </Text>
        </View>
      );
    }
  }

  if (message.kind === "job") {
    const job = snapshot.jobs.find((item) => item.id === message.sharedId);
    if (job) {
      return (
        <View style={[styles.shared, styles.sharedColumn, { borderColor }]}>
          <Text numberOfLines={2} style={[typography.label, { color: textColor }]}>
            {job.title}
          </Text>
          <Text numberOfLines={1} style={[typography.micro, { color: mutedColor }]}>
            {[job.schoolName, job.location].filter(Boolean).join(" • ")}
          </Text>
        </View>
      );
    }
  }

  // The referenced record is not cached (yet): keep the generic label.
  return (
    <View style={[styles.shared, { borderColor }]}>
      <Feather
        name={
          message.kind === "job"
            ? "briefcase"
            : message.kind === "profile"
              ? "user"
              : "file-text"
        }
        size={18}
        color={mine ? colors.onPrimary : colors.primary}
      />
      <Text style={[typography.label, { color: textColor }]}>
        {message.kind === "job"
          ? t("jobs")
          : message.kind === "profile"
            ? t("professional_profile")
            : t("post")}
      </Text>
    </View>
  );
}

/** Widest a chat image is allowed to be. */
const CHAT_IMAGE_WIDTH = 234;
/** Beyond this a portrait photo would push the whole thread off screen. */
const CHAT_IMAGE_MAX_HEIGHT = 320;

/**
 * Renders a chat image at its own proportions.
 *
 * A fixed box cropped portrait photos to a square-ish sliver; measuring the
 * real dimensions lets the bubble size itself so the whole picture is visible.
 */
function ChatImage({ uri, label }: { uri: string; label: string }) {
  const { colors } = useAppTheme();
  const [ratio, setRatio] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Image.getSize(
      uri,
      (width, height) => {
        if (!cancelled && height) setRatio(width / height);
      },
      () => {
        // Unreadable image: fall back to the default box below.
      },
    );
    return () => {
      cancelled = true;
    };
  }, [uri]);

  const naturalHeight = ratio ? CHAT_IMAGE_WIDTH / ratio : CHAT_IMAGE_WIDTH * 0.75;
  const height = Math.min(naturalHeight, CHAT_IMAGE_MAX_HEIGHT);
  // Only a very tall image gets clamped, and then it must letterbox rather
  // than crop, so nothing is cut off.
  const clamped = naturalHeight > CHAT_IMAGE_MAX_HEIGHT;

  return (
    <Image
      source={{ uri }}
      accessibilityLabel={label}
      style={[
        styles.messageImage,
        { width: CHAT_IMAGE_WIDTH, height, backgroundColor: colors.surfaceMuted },
      ]}
      resizeMode={clamped ? "contain" : "cover"}
    />
  );
}

/** Clock while sending, one tick when sent, two when read. */
function StatusTicks({ status, color }: { status: Message["status"]; color: string }) {
  if (status === "sending") {
    return <Feather name="clock" size={12} color={color} style={{ opacity: 0.7 }} />;
  }
  if (status === "read") {
    return (
      <View style={styles.ticks}>
        <Feather name="check" size={13} color={color} />
        <Feather name="check" size={13} color={color} style={styles.tickOverlap} />
      </View>
    );
  }
  return <Feather name="check" size={13} color={color} style={{ opacity: 0.85 }} />;
}

function UploadBar({ progress, color }: { progress: number; color: string }) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, {
      toValue: progress,
      duration: motion.fast,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [progress, width]);
  return (
    <View style={styles.uploadTrack}>
      <Animated.View
        style={[
          styles.uploadFill,
          {
            backgroundColor: color,
            width: width.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    minHeight: 58,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.md,
  },
  headerIdentity: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.xs },
  iconButton: { width: 46, height: 46, alignItems: "center", justifyContent: "center" },
  messages: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, gap: 2, flexGrow: 1 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.xs },
  dayWrap: { alignItems: "center", marginVertical: spacing.sm },
  dayChip: {
    overflow: "hidden",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  messageWrap: { flexDirection: "row" },
  mine: { justifyContent: "flex-end", paddingLeft: 56 },
  theirs: { justifyContent: "flex-start", paddingRight: 56 },
  bubble: {
    maxWidth: "100%",
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 4,
  },
  textRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    columnGap: spacing.xs,
  },
  messageText: { flexShrink: 1, lineHeight: 20 },
  // Squared-off corner on the sender's side, the way chat bubbles point.
  bubbleMine: { borderTopRightRadius: radii.lg },
  bubbleTheirs: { borderTopLeftRadius: radii.lg },
  tailMine: { borderBottomRightRadius: 4 },
  tailTheirs: { borderBottomLeftRadius: 4 },
  imageWrap: { position: "relative" },
  messageImage: { borderRadius: radii.md },
  uploadOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  uploadTrack: {
    width: "100%",
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  uploadFill: { height: "100%", borderRadius: radii.pill },
  contextBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderLeftWidth: 3,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  deletedRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  forwardedRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  replyPreview: {
    borderLeftWidth: 3,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 5,
  },
  sheetOverlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  sheetAction: {
    minHeight: 50,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  forwardRow: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  previewRoot: { flex: 1, backgroundColor: "#000000" },
  previewBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  previewButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  shared: {
    minWidth: 190,
    borderWidth: 1,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.xs,
  },
  sharedColumn: { flexDirection: "column", alignItems: "stretch", gap: 4 },
  sharedIdentity: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  receipt: { flexDirection: "row", alignItems: "center", gap: 3, paddingBottom: 1 },
  ticks: { flexDirection: "row", width: 19 },
  tickOverlap: { marginLeft: -7 },
  composer: {
    minHeight: 44,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  inputPill: {
    flex: 1,
    minHeight: 32,
    maxHeight: 76,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingLeft: spacing.md,
    paddingRight: spacing.xxs,
  },
  input: { flex: 1, maxHeight: 68, paddingVertical: 4, ...typography.body },
  attach: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  send: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
});
