import React, { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  EmptyState,
  ErrorState,
  FilterChips,
  LoadingState,
  SearchInput,
} from "@/components/ui";
import { AnnouncementCard } from "@/components/updates/Cards";
import { SocialScreenHeader } from "@/social/components/ScreenHeader";
import { useUpdates } from "@/contexts/UpdatesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import useSchoolStore from "@/utils/stores/schoolStore";
import { layout, spacing } from "@/constants/theme";

/**
 * School announcements. These are communication from schools to teachers, so
 * they belong with the rest of the social section rather than with the
 * academic tools.
 */
export default function AnnouncementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const { announcements, state, error, reload } = useUpdates();
  const schools = useSchoolStore((store) => store.schools);
  const assignedSchools = schools.filter(
    (school) => school.status === "active" && school.pivot?.is_approved !== false,
  );
  const [query, setQuery] = useState("");
  const [schoolId, setSchoolId] = useState("all");

  const filtered = announcements
    .filter(
      (announcement) => schoolId === "all" || String(announcement.schoolId) === schoolId,
    )
    .filter((announcement) => {
      const needle = query.trim().toLowerCase();
      return (
        !needle ||
        `${announcement.title} ${announcement.excerpt} ${announcement.schoolName}`
          .toLowerCase()
          .includes(needle)
      );
    })
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        +new Date(b.publishedAt) - +new Date(a.publishedAt),
    );

  const copy =
    language === "fr"
      ? {
          title: "Annonces",
          subtitle: "Communications de vos écoles",
          search: "Rechercher une annonce",
          all: "Toutes les écoles",
          empty: "Aucune annonce",
          emptyMessage: "Aucune annonce ne correspond à ce filtre.",
        }
      : {
          title: "Announcements",
          subtitle: "Communication from your schools",
          search: "Search school announcements",
          all: "All schools",
          empty: "No announcements",
          emptyMessage: "No school announcements match this filter.",
        };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.feedBackground, paddingTop: insets.top },
      ]}
    >
      <SocialScreenHeader title={copy.title} subtitle={copy.subtitle} />
      <View style={styles.controls}>
        <SearchInput value={query} onChangeText={setQuery} placeholder={copy.search} />
        <FilterChips
          options={[
            { value: "all", label: copy.all },
            ...assignedSchools.map((school) => ({
              value: String(school.id),
              label: school.code || school.name,
            })),
          ]}
          selected={schoolId}
          onSelect={setSchoolId}
        />
      </View>
      {state === "loading" || state === "idle" ? (
        <View style={styles.controls}>
          <LoadingState rows={4} />
        </View>
      ) : state === "error" ? (
        <ErrorState message={error ?? copy.emptyMessage} onRetry={reload} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(announcement) => announcement.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: layout.cardGap }} />}
          renderItem={({ item }) => (
            <AnnouncementCard
              announcement={item}
              onPress={() => router.push(`/social/announcements/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState icon="bell-off" title={copy.empty} message={copy.emptyMessage} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  controls: { gap: spacing.xs, paddingHorizontal: layout.gutter, paddingBottom: spacing.xs },
  list: { paddingHorizontal: layout.gutter, paddingBottom: spacing.xxl },
});
