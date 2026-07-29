import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Config from "@/constants/Config";
import { radii, spacing, typography } from "@/constants/theme";
import {
  AppHeader,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  SchoolSelector,
  SectionHeader,
  StatusChip,
} from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import useSchoolStore from "@/utils/stores/schoolStore";
import useUserStore from "@/utils/stores/userStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authFetch } from "@/services/authFetch";

interface AssignedClass {
  id: number;
  name: string;
  level?: string;
  academic_year?: string;
  academic_year_id?: number;
}

interface AssignedSubject {
  id: number;
  name: string;
  code?: string;
}

export default function ClassesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const activeSchool = useSchoolStore((store) => store.activeSchool);
  const teacher = useUserStore((store) => store.teacher);
  const [classes, setClasses] = useState<AssignedClass[]>([]);
  const [subjects, setSubjects] = useState<AssignedSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    if (!activeSchool || !teacher) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [classesResponse, subjectsResponse] = await Promise.all([
        authFetch(
          `${Config.apiBaseUrl}/school-classes?school_id=${activeSchool.id}`,
        ),
        authFetch(
          `${Config.apiBaseUrl}/teacher-subjects?school_id=${activeSchool.id}&teacher_id=${teacher.id}`,
        ),
      ]);
      const [classesPayload, subjectsPayload] = await Promise.all([
        classesResponse.json(),
        subjectsResponse.json(),
      ]);
      if (!classesResponse.ok || !classesPayload.success) {
        throw new Error(
          classesPayload.message ?? "Unable to load assigned classes.",
        );
      }
      if (!subjectsResponse.ok || !subjectsPayload.success) {
        throw new Error(
          subjectsPayload.message ?? "Unable to load assigned subjects.",
        );
      }
      setClasses(classesPayload.classes ?? []);
      setSubjects(subjectsPayload.data ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Network error. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSchool, teacher]);

  useEffect(() => {
    setLoading(true);
    void loadAssignments();
  }, [loadAssignments]);

  const refresh = () => {
    setRefreshing(true);
    void loadAssignments();
  };

  const copy =
    language === "fr"
      ? {
          title: "Mes classes",
          subtitle: "Travail quotidien par école",
          actions: "Actions",
          attendance: "Faire l’appel",
          attendanceHelp: "Sélectionner une classe et enregistrer les présences",
          marks: "Saisir les notes",
          marksHelp: "Choisir matière, classe et séquence",
          classes: "Classes assignées",
          subjects: "Matières enseignées",
          noSchool: "Aucune école sélectionnée",
          noSchoolMessage:
            "Choisissez une école pour afficher ses classes et matières.",
          noAssignments: "Aucune affectation",
          noAssignmentsMessage:
            "Cette école ne contient actuellement aucune classe assignée.",
        }
      : {
          title: "My classes",
          subtitle: "Daily work, separated by school",
          actions: "Actions",
          attendance: "Take attendance",
          attendanceHelp: "Choose a class and record attendance",
          marks: "Enter marks",
          marksHelp: "Choose subject, class, and sequence",
          classes: "Assigned classes",
          subjects: "Subjects taught",
          noSchool: "No school selected",
          noSchoolMessage:
            "Choose a school to see its classes and subjects.",
          noAssignments: "No assignments",
          noAssignmentsMessage:
            "There are currently no assigned classes for this school.",
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
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        <AppHeader title={copy.title} subtitle={copy.subtitle} />
        <SchoolSelector />
        {!activeSchool ? (
          <EmptyState
            icon="home"
            title={copy.noSchool}
            message={copy.noSchoolMessage}
          />
        ) : loading ? (
          <LoadingState rows={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={loadAssignments} />
        ) : (
          <>
            <SectionHeader title={copy.actions} />
            <View style={styles.actionGrid}>
              <ActionCard
                icon="check-square"
                title={copy.attendance}
                description={copy.attendanceHelp}
                onPress={() => router.push("/(tabs)/attendance")}
              />
              <ActionCard
                icon="edit-3"
                title={copy.marks}
                description={copy.marksHelp}
                onPress={() => router.push("/(tabs)/subjects")}
              />
            </View>

            <SectionHeader title={copy.classes} />
            {classes.length === 0 ? (
              <EmptyState
                icon="users"
                title={copy.noAssignments}
                message={copy.noAssignmentsMessage}
              />
            ) : (
              <View style={styles.list}>
                {classes.map((item) => (
                  <Card
                    key={item.id}
                    onPress={() =>
                      router.push(
                        `/attendance/students?class_id=${item.id}&school_id=${activeSchool.id}`,
                      )
                    }
                  >
                    <View style={styles.row}>
                      <View
                        style={[
                          styles.leadingIcon,
                          { backgroundColor: colors.primarySoft },
                        ]}
                      >
                        <Feather name="users" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.flex}>
                        <Text
                          style={[typography.bodyStrong, { color: colors.text }]}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={[
                            typography.caption,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {[item.level, item.academic_year]
                            .filter(Boolean)
                            .join(" • ")}
                        </Text>
                      </View>
                      <StatusChip
                        label={language === "fr" ? "Appel" : "Attendance"}
                        tone="info"
                      />
                    </View>
                  </Card>
                ))}
              </View>
            )}

            <SectionHeader title={copy.subjects} />
            <View style={styles.subjectWrap}>
              {subjects.map((subject) => (
                <Pressable
                  key={subject.id}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push(
                      `/marks/classes?subjectId=${subject.id}&subjectName=${encodeURIComponent(subject.name)}`,
                    )
                  }
                  style={({ pressed }) => [
                    styles.subject,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      opacity: pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <Feather name="book-open" size={18} color={colors.primary} />
                  <Text
                    numberOfLines={1}
                    style={[typography.label, { color: colors.text, flex: 1 }]}
                  >
                    {subject.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  description: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Card onPress={onPress} style={styles.actionCard}>
      <View
        style={[styles.actionIcon, { backgroundColor: colors.primarySoft }]}
      >
        <Feather name={icon} size={23} color={colors.primary} />
      </View>
      <Text style={[typography.bodyStrong, { color: colors.text }]}>{title}</Text>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        {description}
      </Text>
    </Card>
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
  actionGrid: { flexDirection: "row", gap: spacing.sm },
  actionCard: { flex: 1, minHeight: 152, gap: spacing.xs },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxs,
  },
  list: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  leadingIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: { flex: 1, gap: 2 },
  subjectWrap: { gap: spacing.xs },
  subject: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
