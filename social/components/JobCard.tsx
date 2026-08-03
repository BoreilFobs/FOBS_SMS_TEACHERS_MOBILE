import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Chip, PressableScale } from "@/components/ui";
import { Job, JobApplication } from "@/social/models";
import { useSocial } from "@/social/hooks/useSocial";
import { formatDate } from "@/social/utils/format";
import { elevation, radii, spacing, typography } from "@/constants/theme";

/** Days remaining, so a closing deadline can colour itself. */
function daysUntil(deadline: string) {
  const diff = +new Date(deadline) - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export const JobCard = React.memo(function JobCard({
  job,
  application,
}: {
  job: Job;
  application?: JobApplication;
}) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { language, t } = useLanguage();
  const { repository } = useSocial();
  const employmentKey = job.employmentType.replace("-", "_");
  const remaining = daysUntil(job.deadline);
  const deadlineTone =
    remaining < 0 ? colors.textMuted : remaining <= 2 ? colors.error : remaining <= 7 ? colors.warning : colors.textMuted;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${job.title}, ${job.schoolName}`}
      onPress={() => router.push(`/social/job/${job.id}`)}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        elevation.card,
      ]}
    >
      {job.recommended ? (
        <View style={[styles.ribbon, { backgroundColor: colors.primarySoft }]}>
          <Feather name="star" size={11} color={colors.primary} />
          <Text style={[typography.micro, { color: colors.primary }]}>
            {t("recommended_jobs")}
          </Text>
        </View>
      ) : null}
      <View style={styles.body}>
        <View style={[styles.logo, { backgroundColor: colors.primarySoft }]}>
          <Feather name="briefcase" size={20} color={colors.primary} />
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[typography.subheading, { color: colors.text, flex: 1 }]}
              numberOfLines={2}
            >
              {job.title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={job.saved ? t("saved") : t("save")}
              onPress={(event) => {
                event.stopPropagation();
                void repository.toggleSaved(job.id);
              }}
              hitSlop={8}
              style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Feather
                name="bookmark"
                size={19}
                color={job.saved ? colors.primary : colors.textMuted}
              />
            </Pressable>
          </View>
          <Text
            numberOfLines={1}
            style={[typography.caption, { color: colors.textSecondary }]}
          >
            {job.schoolName}
          </Text>
          <View style={styles.meta}>
            <Feather name="map-pin" size={11} color={colors.textMuted} />
            <Text
              numberOfLines={1}
              style={[typography.micro, { color: colors.textMuted, flexShrink: 1 }]}
            >
              {job.location}
            </Text>
          </View>
          <View style={styles.chips}>
            {job.subjects[0] ? <Chip label={job.subjects[0]} tone="primary" /> : null}
            <Chip label={t(employmentKey)} tone="neutral" />
            {application ? (
              <Chip label={t(`status_${application.status}`)} tone="success" icon="check" />
            ) : null}
          </View>
          <View style={styles.deadline}>
            <Feather name="clock" size={11} color={deadlineTone} />
            <Text style={[typography.micro, { color: deadlineTone }]}>
              {t("application_deadline")}: {formatDate(job.deadline, language)}
            </Text>
          </View>
        </View>
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    overflow: "hidden",
  },
  ribbon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  body: { flexDirection: "row", gap: spacing.sm, padding: spacing.md },
  logo: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.xs },
  iconButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center", marginTop: -4, marginRight: -6 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 2 },
  deadline: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
});
