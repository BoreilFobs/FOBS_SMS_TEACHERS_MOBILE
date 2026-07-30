import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { spacing, typography } from "@/constants/theme";

export function SocialScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("back")}
        onPress={() => router.back()}
        style={styles.back}
      >
        <Feather name="arrow-left" size={22} color={colors.text} />
      </Pressable>
      <View style={styles.text}>
        <Text numberOfLines={1} style={[typography.heading, { color: colors.text }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={[typography.caption, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.action}>{action}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  },
  back: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  text: { flex: 1 },
  action: { minWidth: 48, alignItems: "flex-end" },
});
