import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  EmptyState,
  ErrorState,
  FilterChips,
  LoadingState,
  SearchInput,
  Segmented,
} from "@/components/ui";
import { layout, spacing, typography } from "@/constants/theme";
import { useSocial } from "@/social/hooks/useSocial";
import { useSocialResource } from "@/social/hooks/useSocialResource";
import { TeacherCard } from "@/social/components/TeacherCard";
import { CURRENT_TEACHER_ID, SocialTeacher } from "@/social/models";

type ViewKey = "suggested" | "trending" | "following" | "followers";

export default function NetworkScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { repository, snapshot } = useSocial();
  const [view, setView] = useState<ViewKey>("suggested");
  const [subject, setSubject] = useState("all");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SocialTeacher[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Directory, suggestions and trending are three separately ranked server
  // endpoints. Settled independently so one failing does not empty the screen.
  const { loading, refreshing, error, refresh, retry } = useSocialResource(async () => {
    await Promise.allSettled([
      repository.getTeachers(),
      repository.getSuggestedTeachers(),
      repository.getTrendingTeachers(),
    ]);
  });

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      void repository
        .search(query)
        .then((result) => setSearchResults(result.teachers))
        .finally(() => setSearching(false));
    }, 280);
    return () => clearTimeout(timer);
  }, [query, repository]);

  const subjects = useMemo(
    () =>
      Array.from(
        new Set(
          snapshot.teachers
            .filter((teacher) => teacher.id !== CURRENT_TEACHER_ID && !teacher.blocked)
            .flatMap((teacher) => teacher.subjects),
        ),
      ).slice(0, 8),
    [snapshot.teachers],
  );

  const teachers = useMemo(() => {
    if (searchResults) return searchResults;
    let result = snapshot.teachers.filter(
      (teacher) => teacher.id !== CURRENT_TEACHER_ID && !teacher.blocked,
    );
    if (view === "trending") {
      result = [...result].sort(
        (a, b) => b.engagementScore - a.engagementScore || b.followerCount - a.followerCount,
      );
    } else if (view === "following") {
      result = result.filter((teacher) => teacher.followedByCurrentUser);
    } else if (view === "followers") {
      result = result.filter((teacher) => teacher.followsCurrentUser);
    } else {
      result = [...result].sort((a, b) => {
        const relevance = (teacher: SocialTeacher) =>
          teacher.subjects.some((item) =>
            snapshot.teachers
              .find((candidate) => candidate.id === CURRENT_TEACHER_ID)
              ?.subjects.includes(item),
          )
            ? 100
            : 0;
        return relevance(b) + b.engagementScore - relevance(a) - a.engagementScore;
      });
    }
    if (subject !== "all") result = result.filter((teacher) => teacher.subjects.includes(subject));
    return result;
  }, [searchResults, snapshot.teachers, subject, view]);

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.feedBackground, paddingTop: insets.top },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.titleLarge, { color: colors.text }]}>
            {t("network")}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {teachers.length} {t("teachers")}
          </Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: colors.primarySoft }]}>
          <Feather name="users" size={20} color={colors.primary} />
        </View>
      </View>
      <View style={styles.controls}>
        <SearchInput value={query} onChangeText={setQuery} placeholder={t("search")} />
        <Segmented
          selected={view}
          onSelect={setView}
          options={[
            { value: "suggested", label: t("suggested") },
            { value: "trending", label: t("trending") },
            { value: "following", label: t("following") },
            { value: "followers", label: t("followers") },
          ]}
        />
        <FilterChips
          selected={subject}
          onSelect={setSubject}
          options={[
            { value: "all", label: t("all") },
            ...subjects.map((item) => ({ value: item, label: item })),
          ]}
        />
      </View>
      {searching || (loading && teachers.length === 0) ? (
        <View style={styles.loadingBox}>
          <LoadingState rows={5} />
        </View>
      ) : error && teachers.length === 0 ? (
        <ErrorState message={error.message} onRetry={() => void retry()} />
      ) : (
        <FlatList
          data={teachers}
          keyExtractor={(teacher) => teacher.id}
          renderItem={({ item }) => <TeacherCard teacher={item} />}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          ItemSeparatorComponent={() => <View style={{ height: layout.cardGap }} />}
          showsVerticalScrollIndicator={false}
          initialNumToRender={7}
          windowSize={7}
          ListEmptyComponent={
            <EmptyState icon="users" title={t("no_teachers")} message={t("try_again")} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: layout.gutter,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xxs,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  controls: { gap: spacing.xs, paddingHorizontal: layout.gutter, paddingBottom: spacing.sm },
  list: { paddingHorizontal: layout.gutter, paddingBottom: layout.tabBarClearance },
  loadingBox: { paddingHorizontal: layout.gutter },
});
