import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
import { Button, EmptyState, StatusChip } from "@/components/ui";
import { CURRENT_TEACHER_ID } from "@/social/models";
import { useSocial } from "@/social/hooks/useSocial";
import { SocialScreenHeader } from "@/social/components/ScreenHeader";
import { formatDate } from "@/social/utils/format";
import { radii, spacing, typography } from "@/constants/theme";

export default function JobDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { language, t } = useLanguage();
  const { repository, snapshot } = useSocial();
  const job = snapshot.jobs.find((candidate) => candidate.id === id);
  const application = snapshot.applications.find(
    (candidate) => candidate.jobId === id && candidate.teacherId === CURRENT_TEACHER_ID,
  );
  const currentTeacher = snapshot.teachers.find((candidate) => candidate.id === CURRENT_TEACHER_ID);
  const [applying, setApplying] = useState(false);
  const [motivation, setMotivation] = useState("");
  const [availability, setAvailability] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!job) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <SocialScreenHeader title={t("jobs")} />
        <EmptyState icon="briefcase" title={t("no_results")} message={t("back")} />
      </View>
    );
  }

  const submit = () =>
    Alert.alert(t("apply"), t("apply_confirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("apply"),
        onPress: () => {
          setSubmitting(true);
          void repository
            .apply(job.id, motivation, availability)
            .then(() => {
              setApplying(false);
              Alert.alert(t("success"), t("application_submitted"));
            })
            .catch((cause) =>
              Alert.alert(
                t("error"),
                cause instanceof Error && cause.message === "ALREADY_APPLIED"
                  ? t("already_applied")
                  : t("validation_required"),
              ),
            )
            .finally(() => setSubmitting(false));
        },
      },
    ]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <SocialScreenHeader
        title={t("jobs")}
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("share")}
            onPress={() => router.push({ pathname: "/social/share", params: { kind: "job", id: job.id } })}
            style={styles.iconButton}
          >
            <Feather name="send" size={20} color={colors.text} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
        <View style={styles.titleRow}>
          <View style={[styles.logo, { backgroundColor: colors.primarySoft }]}>
            <Feather name="briefcase" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[typography.title, { color: colors.text }]}>{job.title}</Text>
            <Text style={[typography.bodyStrong, { color: colors.textSecondary }]}>{job.schoolName}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={job.saved ? t("saved") : t("save")}
            onPress={() => void repository.toggleSaved(job.id)}
            style={[styles.iconButton, { backgroundColor: colors.surfaceMuted }]}
          >
            <Feather name="bookmark" size={21} color={job.saved ? colors.primary : colors.textMuted} />
          </Pressable>
        </View>
        <View style={styles.chips}>
          <StatusChip label={job.subjects.join(", ")} tone="info" />
          <StatusChip label={t(job.employmentType.replace("-", "_"))} />
          {application ? <StatusChip label={t(`status_${application.status}`)} tone={application.status === "accepted" ? "success" : application.status === "rejected" ? "error" : "info"} /> : null}
        </View>
        <Detail icon="map-pin" label={t("location")} value={job.location} />
        <Detail icon="calendar" label={t("application_deadline")} value={formatDate(job.deadline, language)} />
        <Detail icon="book-open" label={t("educational_level")} value={job.level} />
        <Detail icon="award" label={t("qualification")} value={job.qualification} />
        <Detail icon="clock" label={t("experience_required")} value={`${job.experienceYears} ${t("years_experience")}`} />
        {job.positions ? <Detail icon="users" label={t("positions")} value={String(job.positions)} /> : null}

        <Section title={t("about")}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>{job.schoolSummary}</Text>
        </Section>
        <Section title={t("job_search")}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>{job.description}</Text>
        </Section>
        <Section title={t("responsibilities")}>
          {job.responsibilities.map((item) => (
            <View key={item} style={styles.bullet}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <Text style={[typography.body, { color: colors.textSecondary, flex: 1 }]}>{item}</Text>
            </View>
          ))}
        </Section>

        {applying && !application ? (
          <View style={[styles.application, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.heading, { color: colors.text }]}>{t("apply")}</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {currentTeacher?.name} · {currentTeacher?.headline}
            </Text>
            <TextInput
              accessibilityLabel={t("motivation")}
              value={motivation}
              onChangeText={setMotivation}
              multiline
              placeholder={t("motivation")}
              placeholderTextColor={colors.textMuted}
              style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            />
            <TextInput
              accessibilityLabel={t("availability")}
              value={availability}
              onChangeText={setAvailability}
              placeholder={t("availability")}
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            />
            <View style={styles.buttonRow}>
              <View style={{ flex: 1 }}>
                <Button label={t("cancel")} variant="secondary" onPress={() => setApplying(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={t("apply")}
                  loading={submitting}
                  disabled={!motivation.trim() || !availability.trim()}
                  onPress={submit}
                />
              </View>
            </View>
          </View>
        ) : application ? (
          <Button label={`${t("my_applications")} · ${t(`status_${application.status}`)}`} onPress={() => router.push("/social/applications")} />
        ) : (
          <Button label={t("apply")} onPress={() => setApplying(true)} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Detail({ icon, label, value }: { icon: React.ComponentProps<typeof Feather>["name"]; label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.detail}>
      <Feather name={icon} size={18} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.section}>
      <Text style={[typography.heading, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  logo: { width: 58, height: 58, borderRadius: radii.lg, alignItems: "center", justifyContent: "center" },
  iconButton: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  detail: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  section: { gap: spacing.xs, paddingTop: spacing.xs },
  bullet: { flexDirection: "row", alignItems: "flex-start", gap: spacing.xs },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  application: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.md, gap: spacing.sm },
  textArea: { minHeight: 120, borderWidth: 1, borderRadius: radii.md, padding: spacing.sm, textAlignVertical: "top", ...typography.body },
  input: { minHeight: 50, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing.sm, ...typography.body },
  buttonRow: { flexDirection: "row", gap: spacing.sm },
});
