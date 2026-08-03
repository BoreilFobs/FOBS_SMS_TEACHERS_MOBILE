import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { PressableScale, SchoolPill } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { radii, spacing, typography, touchTarget } from "@/constants/theme";

/**
 * Header for every school-management screen. It always offers the way back to
 * the social section, because the management tab bar has no social entry of
 * its own, and shows the working school as quiet context.
 */
export function ManageHeader({
  title,
  subtitle,
  showSchool = true,
}: {
  title: string;
  subtitle?: string;
  showSchool?: boolean;
}) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { language } = useLanguage();

  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.text}>
          <Text numberOfLines={1} style={[typography.title, { color: colors.text }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              numberOfLines={2}
              style={[typography.caption, { color: colors.textSecondary }]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={language === "fr" ? "Retour au réseau" : "Back to social"}
          onPress={() => router.replace("/(tabs)/home")}
          style={[styles.socialButton, { backgroundColor: colors.primarySoft }]}
        >
          <Feather name="users" size={20} color={colors.primary} />
        </PressableScale>
      </View>
      {/* Centred on its own line: the active school is page-wide context, so it
          reads better balanced than tucked against one edge. */}
      {showSchool ? (
        <View style={styles.pillRow}>
          <SchoolPill align="center" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs, minHeight: touchTarget.minHeight },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  text: { flex: 1, gap: 3 },
  pillRow: { alignItems: "center" },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
