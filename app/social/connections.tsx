import React, { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { EmptyState, FilterChips, SearchInput } from "@/components/ui";
import { CURRENT_TEACHER_ID } from "@/social/models";
import { useSocial } from "@/social/hooks/useSocial";
import { SocialScreenHeader } from "@/social/components/ScreenHeader";
import { TeacherCard } from "@/social/components/TeacherCard";
import { spacing } from "@/constants/theme";

export default function ConnectionsScreen() {
  const { type } = useLocalSearchParams<{ type?: "following" | "followers" }>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { snapshot } = useSocial();
  const [view, setView] = useState<"following" | "followers">(type ?? "followers");
  const [query, setQuery] = useState("");
  const teachers = snapshot.teachers.filter(
    (teacher) =>
      teacher.id !== CURRENT_TEACHER_ID &&
      !teacher.blocked &&
      (view === "following" ? teacher.followedByCurrentUser : teacher.followsCurrentUser) &&
      `${teacher.name} ${teacher.headline}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <SocialScreenHeader title={view === "following" ? t("following") : t("followers")} />
      <View style={styles.controls}>
        <SearchInput value={query} onChangeText={setQuery} placeholder={t("search")} />
        <FilterChips
          selected={view}
          onSelect={setView}
          options={[
            { value: "followers", label: t("followers") },
            { value: "following", label: t("following") },
          ]}
        />
      </View>
      <FlatList
        data={teachers}
        keyExtractor={(teacher) => teacher.id}
        renderItem={({ item }) => <TeacherCard teacher={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={<EmptyState icon="users" title={t("no_teachers")} message={t("try_again")} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  controls: { padding: spacing.md, gap: spacing.xs },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
});
