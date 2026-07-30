import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { radii, spacing, typography } from "@/constants/theme";
import { useSocial } from "@/social/hooks/useSocial";
import useSchoolStore from "@/utils/stores/schoolStore";

function HeaderAction({
  icon,
  label,
  badge,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  badge?: number;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: colors.surfaceMuted, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Ionicons name={icon} size={21} color={colors.text} />
      {badge ? (
        <View style={[styles.badge, { backgroundColor: colors.error }]}>
          <Text style={styles.badgeText}>{Math.min(99, badge)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function SocialHeader() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { unreadMessages, unreadNotifications } = useSocial();
  const activeSchool = useSchoolStore((state) => state.activeSchool);
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.brand}>
        <View style={[styles.mark, { backgroundColor: colors.primary }]}>
          <Text style={[styles.markText, { color: colors.onPrimary }]}>F</Text>
        </View>
        <View>
          <Text style={[typography.heading, { color: colors.text }]}>FobsSMS</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {t("social_feed")}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("my_schools")}
          onPress={() => router.push("/schools/workspace")}
          style={({ pressed }) => [
            styles.schoolButton,
            { backgroundColor: colors.primarySoft, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="school-outline" size={18} color={colors.primary} />
          <Text
            numberOfLines={1}
            style={[typography.label, { color: colors.primary, maxWidth: 82 }]}
          >
            {activeSchool?.code || t("my_schools")}
          </Text>
        </Pressable>
        <HeaderAction
          icon="chatbubble-ellipses-outline"
          label={t("messages")}
          badge={unreadMessages}
          onPress={() => router.push("/social/conversations")}
        />
        <HeaderAction
          icon="notifications-outline"
          label={t("notifications")}
          badge={unreadNotifications}
          onPress={() => router.push("/social/notifications")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 66,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexShrink: 1 },
  mark: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: { fontSize: 22, fontWeight: "800" },
  actions: { flexDirection: "row", alignItems: "center", gap: 6 },
  action: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  schoolButton: {
    minHeight: 44,
    borderRadius: radii.pill,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  badge: {
    position: "absolute",
    top: 1,
    right: 0,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "800" },
});
