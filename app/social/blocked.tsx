import React from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { SocialScreenHeader } from "@/social/components/ScreenHeader";
import { Avatar } from "@/social/components/Avatar";
import { useSocial } from "@/social/hooks/useSocial";
import { useSocialResource } from "@/social/hooks/useSocialResource";
import { describeSocialError } from "@/social/api/describeError";
import { radii, spacing, typography } from "@/constants/theme";

export default function BlockedAccountsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { snapshot, repository } = useSocial();
  const { loading, refreshing, error, refresh, retry } = useSocialResource(
    () => repository.getBlockedTeachers(),
  );
  const teachers = snapshot.teachers.filter((teacher) => teacher.blocked);

  if (loading && teachers.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <SocialScreenHeader title={t("blocked_accounts")} />
        <LoadingState rows={3} />
      </View>
    );
  }

  if (error && teachers.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <SocialScreenHeader title={t("blocked_accounts")} />
        <ErrorState message={error.message} onRetry={() => void retry()} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <SocialScreenHeader title={t("blocked_accounts")} />
      <FlatList
        data={teachers}
        keyExtractor={(teacher) => teacher.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={() => void refresh()}
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
              onPress={() => {
                void repository.unblock(item.id).catch((cause) => {
                  Alert.alert(t("error"), describeSocialError(cause, t("error")));
                });
              }}
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
