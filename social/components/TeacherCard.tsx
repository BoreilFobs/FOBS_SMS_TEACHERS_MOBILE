import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { PressableScale } from "@/components/ui";
import { elevation, radii, spacing, typography } from "@/constants/theme";
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
  const following = teacher.followedByCurrentUser;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${t("professional_profile")}: ${teacher.name}`}
      onPress={() => router.push(`/social/profile/${teacher.id}`)}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        !compact && elevation.card,
      ]}
    >
      {/* Tinted band behind the avatar gives the row a face without a photo. */}
      {!compact ? (
        <View style={[styles.band, { backgroundColor: colors.primarySoft }]} />
      ) : null}
      <View style={styles.row}>
        <View style={[styles.avatarRing, { borderColor: colors.surface }]}>
          <Avatar name={teacher.name} uri={teacher.photoUrl} size={compact ? 42 : 52} />
        </View>
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text
              numberOfLines={1}
              style={[typography.bodyStrong, { color: colors.text, flexShrink: 1 }]}
            >
              {teacher.name}
            </Text>
            {teacher.verified ? (
              <Feather name="check-circle" size={14} color={colors.primary} />
            ) : null}
            {mutual ? (
              <View style={[styles.mutualDot, { backgroundColor: colors.success }]} />
            ) : null}
          </View>
          <Text
            numberOfLines={2}
            style={[typography.caption, { color: colors.textSecondary }]}
          >
            {teacher.headline}
          </Text>
          <View style={styles.metaRow}>
            <Feather name="map-pin" size={11} color={colors.textMuted} />
            <Text
              numberOfLines={1}
              style={[typography.micro, { color: colors.textMuted, flexShrink: 1 }]}
            >
              {teacher.city} · {teacher.followerCount} {t("followers")}
            </Text>
          </View>
          {!compact && teacher.subjects.length ? (
            <View style={styles.chips}>
              {teacher.subjects.slice(0, 2).map((subject) => (
                <View
                  key={subject}
                  style={[styles.chip, { backgroundColor: colors.surfaceMuted }]}
                >
                  <Text
                    numberOfLines={1}
                    style={[typography.micro, { color: colors.textSecondary }]}
                  >
                    {subject}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={following ? t("unfollow") : t("follow")}
          onPress={(event) => {
            event.stopPropagation();
            void repository.follow(teacher.id);
          }}
          hitSlop={6}
          style={({ pressed }) => [
            styles.follow,
            {
              backgroundColor: following ? "transparent" : colors.primary,
              borderColor: following ? colors.border : colors.primary,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          {!following ? <Feather name="plus" size={13} color={colors.onPrimary} /> : null}
          <Text
            style={[
              typography.micro,
              { color: following ? colors.textSecondary : colors.onPrimary },
            ]}
          >
            {following ? t("following") : t("follow")}
          </Text>
        </Pressable>
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
  band: { height: 26 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    marginTop: -14,
  },
  avatarRing: { borderRadius: radii.pill, borderWidth: 3 },
  content: { flex: 1, gap: 2, paddingTop: 16 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  mutualDot: { width: 6, height: 6, borderRadius: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 4 },
  chip: { borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3, maxWidth: 120 },
  follow: {
    minHeight: 34,
    minWidth: 78,
    marginTop: 18,
    borderWidth: 1,
    borderRadius: radii.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: spacing.xs,
  },
});
