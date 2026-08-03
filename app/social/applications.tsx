import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button, EmptyState, ErrorState, LoadingState, StatusChip } from "@/components/ui";
import { JobApplication } from "@/social/models";
import { useSocial } from "@/social/hooks/useSocial";
import { useSocialResource } from "@/social/hooks/useSocialResource";
import { describeSocialError } from "@/social/api/describeError";
import { SocialScreenHeader } from "@/social/components/ScreenHeader";
import { formatDate } from "@/social/utils/format";
import { radii, spacing, typography } from "@/constants/theme";

export default function ApplicationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { language, t } = useLanguage();
  const { repository, snapshot } = useSocial();
  const [editing, setEditing] = useState<JobApplication>();
  // Applications and the jobs they point at both come from the server.
  const { loading, refreshing, error, refresh, retry } = useSocialResource(async () => {
    const applications = await repository.getApplications();
    // The list renders each application's job, so make sure those are cached too.
    await Promise.all(
      applications.map((application) =>
        repository.getJob(application.jobId).catch(() => undefined),
      ),
    );
  });

  if (loading && snapshot.applications.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.feedBackground, paddingTop: insets.top }]}>
        <SocialScreenHeader title={t("my_applications")} />
        <LoadingState rows={3} />
      </View>
    );
  }

  if (error && snapshot.applications.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.feedBackground, paddingTop: insets.top }]}>
        <SocialScreenHeader title={t("my_applications")} />
        <ErrorState message={error.message} onRetry={() => void retry()} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.feedBackground, paddingTop: insets.top }]}>
      <SocialScreenHeader title={t("my_applications")} />
      <FlatList
        data={[...snapshot.applications].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))}
        keyExtractor={(application) => application.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={() => void refresh()}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => {
          const job = snapshot.jobs.find((candidate) => candidate.id === item.jobId);
          if (!job) return null;
          // Edit-lock is decided by the server; `submitted` is the only editable
          // state and the API rejects anything else with APPLICATION_LOCKED.
          const editable = item.status === "submitted";
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/social/job/${job.id}`)}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.heading, { color: colors.text }]}>{job.title}</Text>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>{job.schoolName}</Text>
                </View>
                <StatusChip
                  label={t(`status_${item.status}`)}
                  tone={item.status === "accepted" ? "success" : item.status === "rejected" ? "error" : item.status === "viewed" ? "warning" : "info"}
                />
              </View>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {formatDate(item.submittedAt, language)}
              </Text>
              <Text numberOfLines={3} style={[typography.body, { color: colors.textSecondary }]}>{item.motivation}</Text>
              <View style={styles.availability}>
                <Feather name="calendar" size={15} color={colors.primary} />
                <Text style={[typography.label, { color: colors.text }]}>{item.availability}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !editable }}
                disabled={!editable}
                onPress={(event) => {
                  event.stopPropagation();
                  setEditing(item);
                }}
                style={[styles.edit, { borderColor: editable ? colors.primary : colors.disabled }]}
              >
                <Feather name={editable ? "edit-2" : "lock"} size={16} color={editable ? colors.primary : colors.disabledText} />
                <Text style={[typography.label, { color: editable ? colors.primary : colors.disabledText }]}>
                  {editable ? t("edit") : t("application_read_only")}
                </Text>
              </Pressable>
            </Pressable>
          );
        }}
        ListEmptyComponent={<EmptyState icon="file-text" title={t("no_results")} message={t("jobs")} />}
      />
      <EditApplicationModal application={editing} onClose={() => setEditing(undefined)} />
    </View>
  );
}

function EditApplicationModal({
  application,
  onClose,
}: {
  application?: JobApplication;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { repository } = useSocial();
  const [motivation, setMotivation] = useState("");
  const [availability, setAvailability] = useState("");
  const [saving, setSaving] = useState(false);
  React.useEffect(() => {
    setMotivation(application?.motivation ?? "");
    setAvailability(application?.availability ?? "");
  }, [application]);
  const save = async () => {
    if (!application) return;
    setSaving(true);
    try {
      await repository.editApplication(application.id, motivation, availability);
      onClose();
    } catch (cause) {
      // Surfaces the server's own reason — APPLICATION_LOCKED once the school has
      // viewed it, or the specific field complaint on a validation failure.
      Alert.alert(t("error"), describeSocialError(cause, t("application_read_only")));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal visible={Boolean(application)} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modal, { backgroundColor: colors.surfaceElevated }]}>
          <View style={styles.cardTop}>
            <Text style={[typography.title, { color: colors.text }]}>{t("edit")}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t("close")} onPress={onClose} style={styles.close}>
              <Feather name="x" size={22} color={colors.text} />
            </Pressable>
          </View>
          <TextInput
            accessibilityLabel={t("motivation")}
            value={motivation}
            onChangeText={setMotivation}
            multiline
            placeholder={t("motivation")}
            placeholderTextColor={colors.textMuted}
            style={[styles.textArea, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
          />
          <TextInput
            accessibilityLabel={t("availability")}
            value={availability}
            onChangeText={setAvailability}
            placeholder={t("availability")}
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
          />
          <Button
            label={t("save")}
            loading={saving}
            disabled={!motivation.trim() || !availability.trim()}
            onPress={save}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  card: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.md, gap: spacing.xs },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
  availability: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  edit: { minHeight: 44, borderWidth: 1, borderRadius: radii.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs },
  overlay: { flex: 1, justifyContent: "flex-end" },
  modal: { borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.md, gap: spacing.sm },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  textArea: { minHeight: 120, borderWidth: 1, borderRadius: radii.md, padding: spacing.sm, textAlignVertical: "top", ...typography.body },
  input: { minHeight: 50, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing.sm, ...typography.body },
});
