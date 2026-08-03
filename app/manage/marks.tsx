import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Config from "@/constants/Config";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  SchoolSelector,
  StatusChip,
} from "@/components/ui";
import { ManageHeader } from "@/components/manage/ManageHeader";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import useSchoolStore from "@/utils/stores/schoolStore";
import useUserStore from "@/utils/stores/userStore";
import { radii, spacing, typography } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authFetch } from "@/services/authFetch";
import { cacheKeys, readCache, writeCache } from "@/utils/offline/cache";

interface Subject {
  id: number;
  name: string;
  code?: string;
}

export default function MarksSubjectsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const activeSchool = useSchoolStore((store) => store.activeSchool);
  const teacher = useUserStore((store) => store.teacher);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeSchool || !teacher) {
      setLoading(false);
      return;
    }
    setError(null);

    const cached = await readCache<Subject[]>(
      cacheKeys.teacherSubjects(activeSchool.id, teacher.id),
    );
    if (cached?.length) {
      setSubjects(cached);
      setLoading(false);
    }

    try {
      const response = await authFetch(
        `${Config.apiBaseUrl}/teacher-subjects?school_id=${activeSchool.id}&teacher_id=${teacher.id}`,
      );
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to load subjects.");
      }
      const next = payload.data ?? [];
      setSubjects(next);
      await writeCache(
        cacheKeys.teacherSubjects(activeSchool.id, teacher.id),
        next,
      );
    } catch (loadError) {
      if (!cached?.length) {
        setError(
          loadError instanceof Error ? loadError.message : "Network error.",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSchool, teacher]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const copy =
    language === "fr"
      ? {
          title: "Saisie des notes",
          subtitle: "Étape 1 sur 3 · Choisir une matière",
          noSchool: "Aucune école sélectionnée",
          empty: "Aucune matière assignée",
          emptyMessage:
            "Cette école ne contient aucune matière attribuée à votre compte.",
          continue: "Choisir",
        }
      : {
          title: "Enter marks",
          subtitle: "Step 1 of 3 · Choose a subject",
          noSchool: "No school selected",
          empty: "No assigned subjects",
          emptyMessage:
            "No subjects are assigned to your account at this school.",
          continue: "Choose",
        };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + 92 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <ManageHeader
          title={copy.title}
          subtitle={copy.subtitle}
          showSchool={Boolean(activeSchool)}
        />
        {!activeSchool ? (
          <>
            {/* Only when a choice is actually required does the switcher take
                up real estate. */}
            <SchoolSelector />
            <EmptyState
              icon="home"
              title={copy.noSchool}
              message={copy.emptyMessage}
            />
          </>
        ) : loading ? (
          <LoadingState rows={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : subjects.length === 0 ? (
          <EmptyState
            icon="book-open"
            title={copy.empty}
            message={copy.emptyMessage}
          />
        ) : (
          <View style={styles.list}>
            {subjects.map((subject) => (
              <Card
                key={subject.id}
                onPress={() =>
                  router.push(
                    `/marks/classes?subjectId=${subject.id}&subjectName=${encodeURIComponent(subject.name)}&school_id=${activeSchool.id}`,
                  )
                }
              >
                <View style={styles.row}>
                  <View
                    style={[
                      styles.icon,
                      { backgroundColor: colors.primarySoft },
                    ]}
                  >
                    <Feather name="book-open" size={21} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyStrong, { color: colors.text }]}>
                      {subject.name}
                    </Text>
                    {subject.code ? (
                      <Text
                        style={[typography.caption, { color: colors.textSecondary }]}
                      >
                        {subject.code}
                      </Text>
                    ) : null}
                  </View>
                  <StatusChip label={copy.continue} tone="info" />
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  list: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
