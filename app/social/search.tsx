import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { EmptyState, FilterChips } from "@/components/ui";
import { Job, SearchResults, SocialPost, SocialTeacher } from "@/social/models";
import { useSocial } from "@/social/hooks/useSocial";
import { TeacherCard } from "@/social/components/TeacherCard";
import { PostCard } from "@/social/components/PostCard";
import { JobCard } from "@/social/components/JobCard";
import { radii, spacing, typography } from "@/constants/theme";

type SearchTab = "teachers" | "posts" | "jobs";
let recentSearches: string[] = [];

export default function GlobalSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { repository, snapshot } = useSocial();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<SearchTab>("teachers");
  const [results, setResults] = useState<SearchResults>({ teachers: [], posts: [], jobs: [] });
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [recentsVersion, setRecentsVersion] = useState(0);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ teachers: [], posts: [], jobs: [] });
      setLoading(false);
      setFailed(false);
      return;
    }
    setLoading(true);
    setFailed(false);
    const timer = setTimeout(() => {
      void repository
        .search(query)
        .then((next) => {
          setResults(next);
          recentSearches = [query.trim(), ...recentSearches.filter((item) => item !== query.trim())].slice(0, 6);
          setRecentsVersion((value) => value + 1);
        })
        .catch(() => setFailed(true))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, repository]);

  const data = results[tab] as Array<SocialTeacher | SocialPost | Job>;
  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.searchHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("back")} onPress={() => router.back()} style={styles.iconButton}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceMuted }]}>
          <Feather name="search" size={20} color={colors.textMuted} />
          <TextInput
            accessibilityLabel={t("global_search")}
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={t("global_search")}
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            style={[typography.body, { color: colors.text, flex: 1 }]}
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t("clear_search")} onPress={() => setQuery("")}>
              <Feather name="x-circle" size={19} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={styles.tabs}>
        <FilterChips
          selected={tab}
          onSelect={setTab}
          options={[
            { value: "teachers", label: t("teachers") },
            { value: "posts", label: t("posts") },
            { value: "jobs", label: t("jobs") },
          ]}
        />
      </View>
      {!query ? (
        <View style={styles.prompt}>
          {recentSearches.length ? (
            <>
              <View style={styles.recentHeader}>
                <Text style={[typography.heading, { color: colors.text }]}>{t("recent_searches")}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    recentSearches = [];
                    setRecentsVersion(recentsVersion + 1);
                  }}
                >
                  <Text style={[typography.label, { color: colors.primary }]}>{t("clear_search")}</Text>
                </Pressable>
              </View>
              <View style={styles.recentChips}>
                {recentSearches.map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    onPress={() => setQuery(item)}
                    style={[styles.recentChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Feather name="clock" size={15} color={colors.textMuted} />
                    <Text style={[typography.body, { color: colors.text }]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <EmptyState icon="search" title={t("search_prompt")} message={t("discover")} />
          )}
        </View>
      ) : loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : failed ? (
        <EmptyState icon="alert-circle" title={t("operation_failed")} message={t("retry")} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => `${tab}-${item.id}`}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => {
            if (tab === "teachers") return <TeacherCard teacher={item as SocialTeacher} />;
            if (tab === "posts") return <PostCard post={item as SocialPost} />;
            const job = item as Job;
            return (
              <JobCard
                job={job}
                application={snapshot.applications.find((application) => application.jobId === job.id)}
              />
            );
          }}
          ListEmptyComponent={<EmptyState icon="search" title={t("no_results")} message={t("try_again")} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  searchHeader: { minHeight: 64, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", paddingRight: spacing.sm },
  iconButton: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  searchBox: { flex: 1, minHeight: 48, borderRadius: radii.pill, flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.sm },
  tabs: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  prompt: { padding: spacing.md, gap: spacing.md },
  recentHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  recentChips: { gap: spacing.xs },
  recentChip: { minHeight: 48, borderWidth: 1, borderRadius: radii.md, flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.sm },
  loading: { marginTop: spacing.xxl },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
});
