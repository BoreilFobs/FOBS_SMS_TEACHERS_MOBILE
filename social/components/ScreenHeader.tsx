import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { PressableScale } from "@/components/ui";
import { layout, radii, spacing, typography } from "@/constants/theme";

/**
 * Shared header for every social stack screen. The native navigation header is
 * disabled app-wide, so this is the only header these screens draw.
 */
export function SocialScreenHeader({
  title,
  subtitle,
  action,
  onBack,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  onBack?: () => void;
}) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  return (
    <View
      style={[
        styles.header,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
    >
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={t("back")}
        onPress={onBack ?? (() => router.back())}
        style={[styles.back, { backgroundColor: colors.surfaceMuted }]}
      >
        <Feather name="arrow-left" size={20} color={colors.text} />
      </PressableScale>
      <View style={styles.text}>
        <Text numberOfLines={1} style={[typography.subheading, { color: colors.text }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={[typography.micro, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: layout.gutter,
    paddingVertical: spacing.xs,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 1 },
  action: { alignItems: "flex-end" },
});
