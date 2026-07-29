import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AuthWrapper from "@/components/AuthWrapper";
import Config from "@/constants/Config";
import {
  AppHeader,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  StatusChip,
} from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import useSchoolStore from "@/utils/stores/schoolStore";
import useUserStore from "@/utils/stores/userStore";
import { radii, spacing, typography } from "@/constants/theme";
import { authFetch } from "@/services/authFetch";

interface AssignedClass {
  id: number;
  name: string;
  level?: string;
  academic_year?: string;
  academic_year_id?: number;
}

export default function MarksClassesRoute() {
  return (
    <AuthWrapper>
      <MarksClassesScreen />
    </AuthWrapper>
  );
}

function MarksClassesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    subjectId: string;
    subjectName?: string;
    school_id?: string;
  }>();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const activeSchool = useSchoolStore((store) => store.activeSchool);
  const teacher = useUserStore((store) => store.teacher);
  const schoolId = params.school_id ?? String(activeSchool?.id ?? "");
  const [classes, setClasses] = useState<AssignedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!schoolId || !teacher?.id || !params.subjectId) return;
    setError(null);
    try {
      const response = await authFetch(
        `${Config.apiBaseUrl}/teacher-classes?school_id=${schoolId}&teacher_id=${teacher.id}&subject_id=${params.subjectId}`,
      );
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to load classes.");
      }
      setClasses(payload.data ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Network error.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.subjectId, schoolId, teacher?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const copy =
    language === "fr"
      ? {
          title: "Choisir une classe",
          subtitle: `Étape 2 sur 3 · ${params.subjectName ?? "Matière"}`,
          empty: "Aucune classe assignée",
          emptyMessage:
            "Vous n’enseignez pas cette matière dans une classe de cette école.",
          choose: "Choisir",
        }
      : {
          title: "Choose a class",
          subtitle: `Step 2 of 3 · ${params.subjectName ?? "Subject"}`,
          empty: "No assigned classes",
          emptyMessage:
            "You are not assigned to teach this subject in a class at this school.",
          choose: "Choose",
        };

  return (
    <Screen scroll bottomInset={false}>
      <AppHeader
        title={copy.title}
        subtitle={copy.subtitle}
        onBack={() => router.back()}
      />
      {loading ? (
        <LoadingState rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : classes.length === 0 ? (
        <EmptyState icon="users" title={copy.empty} message={copy.emptyMessage} />
      ) : (
        <View style={styles.list}>
          {classes.map((item) => (
            <Card
              key={item.id}
              onPress={() =>
                router.push(
                  `/marks/exams?class_id=${item.id}&class_name=${encodeURIComponent(item.name)}&school_id=${schoolId}&subject_id=${params.subjectId}&subject_name=${encodeURIComponent(params.subjectName ?? "")}`,
                )
              }
            >
              <View style={styles.row}>
                <View
                  style={[styles.icon, { backgroundColor: colors.primarySoft }]}
                >
                  <Feather name="users" size={21} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <Text
                    style={[typography.caption, { color: colors.textSecondary }]}
                  >
                    {[item.level, item.academic_year].filter(Boolean).join(" • ")}
                  </Text>
                </View>
                <StatusChip label={copy.choose} tone="info" />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
