import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button, FilterChips } from "@/components/ui";
import { PostDraft, PostType } from "@/social/models";
import { useSocial } from "@/social/hooks/useSocial";
import { describeSocialError } from "@/social/api/describeError";
import { uploadQueue } from "@/social/store/uploadQueue";
import { runUploadJob } from "@/social/hooks/useUploadQueue";
import { confirmAction, notify } from "@/utils/dialog";
import { Avatar } from "@/social/components/Avatar";
import useSchoolStore from "@/utils/stores/schoolStore";
import { radii, spacing, typography } from "@/constants/theme";

type ComposerType = Extract<PostType, "text" | "image" | "poll" | "question">;

const categories = [
  "Teaching practice",
  "Mathematics",
  "English",
  "French",
  "Physics",
  "Biology",
  "ICT",
  "Primary education",
];

export default function ComposerScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ edit?: string; quote?: string; type?: ComposerType }>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { repository, snapshot } = useSocial();
  const schools = useSchoolStore((state) => state.schools);
  const existing = params.edit
    ? snapshot.posts.find((post) => post.id === params.edit)
    : undefined;
  const quoted = params.quote
    ? snapshot.posts.find((post) => post.id === params.quote)
    : undefined;
  const initialType: ComposerType =
    existing && !["reshare", "quote"].includes(existing.type)
      ? (existing.type as ComposerType)
      : params.type ?? "text";
  const [type, setType] = useState<ComposerType>(initialType);
  const [text, setText] = useState(existing?.text ?? "");
  const [images, setImages] = useState(existing?.images ?? []);
  const [category, setCategory] = useState(existing?.category ?? "");
  const [school, setSchool] = useState(existing?.schoolAffiliation ?? "");
  const [location, setLocation] = useState(existing?.location ?? "");
  const [taggedIds, setTaggedIds] = useState(existing?.taggedTeacherIds ?? []);
  const [questionTitle, setQuestionTitle] = useState(
    existing?.type === "question" ? existing.questionTitle : "",
  );
  const [pollQuestion, setPollQuestion] = useState(
    existing?.type === "poll" ? existing.poll.question : "",
  );
  const [pollOptions, setPollOptions] = useState(
    existing?.type === "poll" ? existing.poll.options.map((option) => option.text) : ["", ""],
  );
  const [multiple, setMultiple] = useState(
    existing?.type === "poll" ? existing.poll.multiple : false,
  );
  const [publishing, setPublishing] = useState(false);
  const bypassProtection = useRef(false);

  const hasChanges = useMemo(
    () =>
      Boolean(
        text.trim() ||
          images.length ||
          category ||
          school ||
          location ||
          taggedIds.length ||
          questionTitle.trim() ||
          pollQuestion.trim() ||
          pollOptions.some((option) => option.trim()),
      ),
    [category, images.length, location, pollOptions, pollQuestion, questionTitle, school, taggedIds.length, text],
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      if (!hasChanges || bypassProtection.current || publishing) return;
      event.preventDefault();
      confirmAction({
        title: t("cancel"),
        message: t("delete_post_confirm"),
        confirmLabel: t("delete"),
        cancelLabel: t("back"),
        destructive: true,
        onConfirm: () => {
          bypassProtection.current = true;
          navigation.dispatch(event.data.action);
        },
      });
    });
    return unsubscribe;
  }, [hasChanges, navigation, publishing, t]);

  const valid =
    params.quote
      ? Boolean(text.trim())
      : type === "poll"
        ? Boolean(pollQuestion.trim() && pollOptions.filter((option) => option.trim()).length >= 2)
        : type === "question"
          ? Boolean(questionTitle.trim())
          : type === "image"
            ? images.length > 0
            : Boolean(text.trim() || images.length);

  const pickImages = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error("MEDIA_PERMISSION_REQUIRED");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 6,
        quality: 0.84,
      });
      if (!result.canceled) {
        setImages((current) => [
          ...current,
          ...result.assets.map((asset) => asset.uri).filter((uri) => !current.includes(uri)),
        ].slice(0, 6));
        if (type === "text") setType("image");
      }
    } catch {
      notify(t("error"), t("operation_failed"));
    }
  };

  const publish = async () => {
    if (!valid) {
      notify(t("error"), t("validation_required"));
      return;
    }

    // A reshare carries no media, so it is quick enough to await here.
    if (params.quote) {
      setPublishing(true);
      try {
        await repository.reshare(params.quote, text);
        bypassProtection.current = true;
        router.replace("/(tabs)/home");
      } catch (cause) {
        notify(t("error"), describeSocialError(cause, t("operation_failed")));
      } finally {
        setPublishing(false);
      }
      return;
    }

    const draft: PostDraft = {
      type,
      text,
      images,
      category: category || undefined,
      schoolAffiliation: school || undefined,
      location: location || undefined,
      taggedTeacherIds: taggedIds,
      questionTitle: type === "question" ? questionTitle : undefined,
      poll:
        type === "poll"
          ? { question: pollQuestion, multiple, options: pollOptions }
          : undefined,
    };

    // Hand the upload to the background queue and return to the feed straight
    // away; the banner there reports progress, failure and retry.
    const job = {
      id: `upload-${Date.now()}`,
      kind: params.edit ? ("edit" as const) : ("create" as const),
      postId: params.edit,
      draft,
      previewUri: images[0],
    };
    uploadQueue.enqueue(job);
    bypassProtection.current = true;
    router.replace("/(tabs)/home");
    void runUploadJob(repository, job);
  };

  const taggedTeachers = snapshot.teachers.filter(
    (teacher) => teacher.id !== "teacher-current" && !teacher.blocked,
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { backgroundColor: colors.feedBackground }]}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.xs,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("close")}
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Feather name="x" size={24} color={colors.text} />
        </Pressable>
        <Text style={[typography.heading, { color: colors.text }]}>
          {params.edit ? t("edit") : params.quote ? t("quote_post") : t("create")}
        </Text>
        <View style={{ minWidth: 94 }}>
          <Button
            label={params.edit ? t("save") : t("post")}
            loading={publishing}
            disabled={!valid || publishing}
            onPress={publish}
          />
        </View>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
      >
        {!params.quote ? (
          <FilterChips
            selected={type}
            onSelect={(next) => {
              if (!params.edit) setType(next);
            }}
            options={[
              { value: "text", label: t("text_post") },
              { value: "image", label: t("image_post") },
              { value: "poll", label: t("poll") },
              { value: "question", label: t("question") },
            ]}
          />
        ) : null}

        {type === "question" && !params.quote ? (
          <ComposerInput
            label={t("question_title")}
            value={questionTitle}
            onChangeText={setQuestionTitle}
            placeholder={t("question_title")}
          />
        ) : null}

        {type === "poll" && !params.quote ? (
          <View style={styles.section}>
            <ComposerInput
              label={t("poll_question")}
              value={pollQuestion}
              onChangeText={setPollQuestion}
              placeholder={t("poll_question")}
            />
            {pollOptions.map((option, index) => (
              <View key={index} style={styles.optionRow}>
                <View style={{ flex: 1 }}>
                  <ComposerInput
                    label={`${t("poll_option")} ${index + 1}`}
                    value={option}
                    onChangeText={(value) =>
                      setPollOptions((current) =>
                        current.map((item, optionIndex) => (optionIndex === index ? value : item)),
                      )
                    }
                    placeholder={t("poll_option")}
                  />
                </View>
                {pollOptions.length > 2 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("delete")}
                    onPress={() =>
                      setPollOptions((current) => current.filter((_, optionIndex) => optionIndex !== index))
                    }
                    style={styles.smallButton}
                  >
                    <Feather name="trash-2" size={19} color={colors.error} />
                  </Pressable>
                ) : null}
              </View>
            ))}
            {pollOptions.length < 6 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setPollOptions((current) => [...current, ""])}
                style={styles.addOption}
              >
                <Feather name="plus" size={18} color={colors.primary} />
                <Text style={[typography.label, { color: colors.primary }]}>{t("add_option")}</Text>
              </Pressable>
            ) : null}
            <View style={styles.switchRow}>
              <Text style={[typography.body, { color: colors.text }]}>{t("multiple_choice")}</Text>
              <Switch
                accessibilityLabel={t("multiple_choice")}
                value={multiple}
                onValueChange={setMultiple}
                trackColor={{ false: colors.disabled, true: colors.primary }}
              />
            </View>
          </View>
        ) : (
          <View style={styles.textArea}>
            <TextInput
              accessibilityLabel={t("post_text_placeholder")}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus={!existing}
              placeholder={
                type === "question" ? t("question_details") : t("post_text_placeholder")
              }
              placeholderTextColor={colors.textMuted}
              style={[styles.mainInput, { color: colors.text }]}
            />
            <Text style={[typography.caption, { color: colors.textMuted, alignSelf: "flex-end" }]}>
              {text.length}
            </Text>
          </View>
        )}

        {quoted ? (
          <View style={[styles.quotePreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.label, { color: colors.text }]}>
              {snapshot.teachers.find((teacher) => teacher.id === quoted.authorId)?.name}
            </Text>
            <Text numberOfLines={5} style={[typography.body, { color: colors.textSecondary }]}>
              {quoted.text}
            </Text>
          </View>
        ) : null}

        {type !== "poll" && !params.quote ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("add_images")}
              onPress={pickImages}
              style={[styles.addMedia, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Feather name="image" size={21} color={colors.primary} />
              <Text style={[typography.bodyStrong, { color: colors.primary }]}>{t("add_images")}</Text>
            </Pressable>
            {images.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
                {images.map((uri, index) => (
                  <View key={`${uri}-${index}`}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("remove_image")}
                      onPress={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
                      style={[styles.removeImage, { backgroundColor: colors.overlay }]}
                    >
                      <Feather name="x" size={16} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            ) : null}
          </>
        ) : null}

        {!params.quote ? (
          <>
            <Text style={[typography.label, { color: colors.text }]}>{t("category")}</Text>
            <FilterChips
              selected={category || "none"}
              onSelect={(value) => setCategory(value === "none" ? "" : value)}
              options={[
                { value: "none", label: t("cancel") },
                ...categories.map((value) => ({ value, label: value })),
              ]}
            />
            <Text style={[typography.label, { color: colors.text }]}>{t("school_affiliation")}</Text>
            <FilterChips
              selected={school || "none"}
              onSelect={(value) => setSchool(value === "none" ? "" : value)}
              options={[
                { value: "none", label: t("cancel") },
                ...schools.map((item) => ({ value: item.name, label: item.code || item.name })),
              ]}
            />
            <ComposerInput
              label={t("location")}
              value={location}
              onChangeText={setLocation}
              placeholder={t("location")}
            />
            <Text style={[typography.label, { color: colors.text }]}>{t("tag_teachers")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagRow}>
              {taggedTeachers.slice(0, 8).map((teacher) => {
                const selected = taggedIds.includes(teacher.id);
                return (
                  <Pressable
                    key={teacher.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    onPress={() =>
                      setTaggedIds((current) =>
                        selected ? current.filter((id) => id !== teacher.id) : [...current, teacher.id],
                      )
                    }
                    style={[
                      styles.teacherTag,
                      {
                        backgroundColor: selected ? colors.primarySoft : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Avatar name={teacher.name} uri={teacher.photoUrl} size={30} />
                    <Text style={[typography.caption, { color: selected ? colors.primary : colors.text }]}>{teacher.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ComposerInput({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.field}>
      <Text style={[typography.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 68, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.sm, paddingBottom: spacing.xs, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  headerButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.md, gap: spacing.md },
  textArea: { minHeight: 180 },
  mainInput: { ...typography.body, fontSize: 17, lineHeight: 25, minHeight: 150, textAlignVertical: "top" },
  section: { gap: spacing.sm },
  field: { gap: 5 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing.sm, ...typography.body },
  optionRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.xs },
  smallButton: { width: 48, height: 50, alignItems: "center", justifyContent: "center" },
  addOption: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: spacing.xs },
  switchRow: { minHeight: 52, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addMedia: { minHeight: 52, borderWidth: 1, borderRadius: radii.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs },
  imageRow: { gap: spacing.xs },
  previewImage: { width: 170, height: 130, borderRadius: radii.md },
  removeImage: { position: "absolute", top: 6, right: 6, width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  quotePreview: { borderWidth: 1, borderRadius: radii.md, padding: spacing.sm, gap: spacing.xs },
  tagRow: { gap: spacing.xs },
  teacherTag: { minHeight: 48, borderWidth: 1, borderRadius: radii.pill, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.xs },
});
