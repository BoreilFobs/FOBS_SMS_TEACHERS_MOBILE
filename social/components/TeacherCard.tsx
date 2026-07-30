import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { radii, spacing, typography } from "@/constants/theme";
import { SocialTeacher } from "@/social/models";
import { useSocial } from "@/social/hooks/useSocial";
import { Avatar } from "@/social/components/Avatar";

export const TeacherCard = React.memo(function TeacherCard({
  teacher,
  compact = false,
}: {
  teacher: SocialTeacher;
  compact?: boolean;
}) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { repository } = useSocial();
  const mutual = teacher.followedByCurrentUser && teacher.followsCurrentUser;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t("professional_profile")}: ${teacher.name}`}
      onPress={() => router.push(`/social/profile/${teacher.id}`)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.76 : 1,
        },
      ]}
    >
      <Avatar name={teacher.name} uri={teacher.photoUrl} size={compact ? 44 : 54} />
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={[typography.bodyStrong, { color: colors.text, flex: 1 }]}>
            {teacher.name}
          </Text>
          {teacher.verified ? <Feather name="check-circle" size={15} color={colors.primary} /> : null}
        </View>
        <Text numberOfLines={2} style={[typography.caption, { color: colors.textSecondary }]}>
          {teacher.headline}
        </Text>
        <Text numberOfLines={1} style={[typography.caption, { color: colors.textMuted }]}>
          {teacher.subjects.slice(0, 2).join(" · ")} · {teacher.city}
        </Text>
        {mutual ? (
          <Text style={[typography.caption, { color: colors.success }]}>{t("mutual_follow")}</Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={teacher.followedByCurrentUser ? t("unfollow") : t("follow")}
        onPress={(event) => {
          event.stopPropagation();
          void repository.follow(teacher.id);
        }}
        style={[
          styles.follow,
          {
            backgroundColor: teacher.followedByCurrentUser ? colors.surfaceMuted : colors.primary,
            borderColor: teacher.followedByCurrentUser ? colors.border : colors.primary,
          },
        ]}
      >
        <Text
          style={[
            typography.label,
            { color: teacher.followedByCurrentUser ? colors.text : colors.onPrimary },
          ]}
        >
          {teacher.followedByCurrentUser ? t("following") : t("follow")}
        </Text>
      </Pressable>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  content: { flex: 1, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  follow: {
    minHeight: 42,
    minWidth: 78,
    borderWidth: 1,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
});
