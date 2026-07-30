import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { EmptyState } from "@/components/ui";
import { SocialScreenHeader } from "@/social/components/ScreenHeader";
import { Avatar } from "@/social/components/Avatar";
import { useSocial } from "@/social/hooks/useSocial";
import { radii, spacing, typography } from "@/constants/theme";

export default function BlockedAccountsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { snapshot, repository } = useSocial();
  const teachers = snapshot.teachers.filter((teacher) => teacher.blocked);
  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <SocialScreenHeader title={t("blocked_accounts")} />
      <FlatList
        data={teachers}
        keyExtractor={(teacher) => teacher.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Avatar name={item.name} uri={item.photoUrl} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>{item.name}</Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>{item.headline}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => void repository.unblock(item.id)}
              style={[styles.unblock, { borderColor: colors.primary }]}
            >
              <Text style={[typography.label, { color: colors.primary }]}>{t("unblock")}</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<EmptyState icon="shield" title={t("no_blocked_accounts")} message={t("blocked_accounts")} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: spacing.md },
  row: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  unblock: { minHeight: 44, borderWidth: 1, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
});
