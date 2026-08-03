import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { IconButton } from "@/components/ui";
import { layout, radii, spacing, typography } from "@/constants/theme";
import { useSocial } from "@/social/hooks/useSocial";
import useSchoolStore from "@/utils/stores/schoolStore";

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
        <Text style={[typography.titleLarge, { color: colors.text }]}>FobsSMS</Text>
      </View>
      <View style={styles.actions}>
        {/*
          Entry point to the management section. Kept as a distinct, labelled
          affordance because it switches the whole context of the app.
        */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("my_schools")}
          onPress={() => router.push("/manage")}
          style={({ pressed }) => [
            styles.schoolButton,
            {
              backgroundColor: colors.primarySoft,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="school" size={16} color={colors.primary} />
          <Text
            numberOfLines={1}
            style={[typography.micro, { color: colors.primary, maxWidth: 74 }]}
          >
            {activeSchool?.code || t("my_schools")}
          </Text>
        </Pressable>
        <IconButton
          icon="chatbubble-ellipses"
          label={t("messages")}
          badge={unreadMessages}
          onPress={() => router.push("/social/conversations")}
          size={40}
        />
        <IconButton
          icon="notifications"
          label={t("notifications")}
          badge={unreadNotifications}
          onPress={() => router.push("/social/notifications")}
          size={40}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 58,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: layout.gutter,
    paddingVertical: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexShrink: 1 },
  mark: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: { fontSize: 20, fontWeight: "800" },
  actions: { flexDirection: "row", alignItems: "center", gap: 6 },
  schoolButton: {
    minHeight: 34,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
