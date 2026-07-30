import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Job, JobApplication } from "@/social/models";
import { useSocial } from "@/social/hooks/useSocial";
import { formatDate } from "@/social/utils/format";
import { radii, spacing, typography } from "@/constants/theme";

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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${job.title}, ${job.schoolName}`}
      onPress={() => router.push(`/social/job/${job.id}`)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.76 : 1,
        },
      ]}
    >
      <View style={[styles.logo, { backgroundColor: colors.primarySoft }]}>
        <Feather name="briefcase" size={22} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[typography.heading, { color: colors.text, flex: 1 }]} numberOfLines={2}>
            {job.title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={job.saved ? t("saved") : t("save")}
            onPress={(event) => {
              event.stopPropagation();
              void repository.toggleSaved(job.id);
            }}
            style={styles.iconButton}
          >
            <Feather
              name={job.saved ? "bookmark" : "bookmark"}
              size={21}
              color={job.saved ? colors.primary : colors.textMuted}
            />
          </Pressable>
        </View>
        <Text style={[typography.bodyStrong, { color: colors.textSecondary }]}>{job.schoolName}</Text>
        <View style={styles.meta}>
          <Feather name="map-pin" size={13} color={colors.textMuted} />
          <Text style={[typography.caption, { color: colors.textMuted }]}>{job.location}</Text>
        </View>
        <View style={styles.chips}>
          <Text style={[styles.chip, { color: colors.primary, backgroundColor: colors.primarySoft }]}>
            {job.subjects[0]}
          </Text>
          <Text style={[styles.chip, { color: colors.textSecondary, backgroundColor: colors.surfaceMuted }]}>
            {t(employmentKey)}
          </Text>
          {application ? (
            <Text style={[styles.chip, { color: colors.success, backgroundColor: colors.successSoft }]}>
              {t(`status_${application.status}`)}
            </Text>
          ) : null}
        </View>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {t("application_deadline")}: {formatDate(job.deadline, language)}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.md, flexDirection: "row", gap: spacing.sm },
  logo: { width: 46, height: 46, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, gap: 5 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.xs },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", marginTop: -8, marginRight: -8 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { ...typography.caption, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radii.pill },
});
