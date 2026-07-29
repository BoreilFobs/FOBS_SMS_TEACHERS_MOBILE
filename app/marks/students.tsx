import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  BackHandler,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AuthWrapper from "@/components/AuthWrapper";
import Config from "@/constants/Config";
import {
  AppHeader,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  SearchInput,
  StatusChip,
} from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { radii, spacing, touchTarget, typography } from "@/constants/theme";
import { authFetch } from "@/services/authFetch";

interface StudentMark {
  id: number;
  name: string;
  savedMark: number | null;
  markId: number | null;
  draft: string;
}

export default function StudentMarksRoute() {
  return (
    <AuthWrapper>
      <StudentMarksScreen />
    </AuthWrapper>
  );
}

function StudentMarksScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    class_id: string;
    class_name?: string;
    school_id: string;
    school_name?: string;
    subject_id: string;
    subject_name?: string;
    sequence_id: string;
    sequence_name?: string;
  }>();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const [students, setStudents] = useState<StudentMark[]>([]);
  const [className, setClassName] = useState(params.class_name ?? "");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [query, setQuery] = useState("");
  const [savedFeedback, setSavedFeedback] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [studentResponse, marksResponse] = await Promise.all([
        authFetch(`${Config.apiBaseUrl}/class-students?class_id=${params.class_id}`),
        authFetch(
          `${Config.apiBaseUrl}/marks?school_id=${params.school_id}&exam_id=${params.sequence_id}&subject_id=${params.subject_id}&class_id=${params.class_id}`,
        ),
      ]);
      const [studentPayload, marksPayload] = await Promise.all([
        studentResponse.json(),
        marksResponse.json(),
      ]);
      if (!studentResponse.ok || !studentPayload.success) {
        throw new Error(studentPayload.message ?? "Unable to load students.");
      }
      const marks = marksPayload.success ? marksPayload.data ?? [] : [];
      setClassName(studentPayload.class?.name ?? params.class_name ?? "");
      setStudents(
        (studentPayload.students ?? []).map(
          (student: { id: number; name: string }) => {
            const mark = marks.find(
              (item: { student_id: number }) => item.student_id === student.id,
            );
            const value =
              mark?.mark === null || mark?.mark === undefined
                ? null
                : Number(mark.mark);
            return {
              ...student,
              savedMark: value,
              markId: mark?.id ?? null,
              draft: value === null ? "" : String(value),
            };
          },
        ),
      );
      setErrors({});
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Network error.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    params.class_id,
    params.class_name,
    params.school_id,
    params.sequence_id,
    params.subject_id,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirtyStudents = useMemo(
    () =>
      students.filter((student) => {
        const draft = student.draft.trim();
        if (!draft) return student.savedMark !== null;
        return Number(draft) !== student.savedMark;
      }),
    [students],
  );
  const hasErrors = Object.keys(errors).length > 0;

  const copy =
    language === "fr"
      ? {
          title: "Saisir les notes",
          subtitle: "Notes sur 20 · Enregistrement groupé",
          search: "Rechercher un élève",
          entered: "saisies",
          missing: "Manquante",
          saved: "Enregistrée",
          draft: "Brouillon",
          save: "Enregistrer les modifications",
          savedAll: "Toutes les modifications sont enregistrées",
          invalid: "Entrer une note comprise entre 0 et 20.",
          empty: "Aucun élève",
          emptyMessage: "Aucun élève n’est inscrit dans cette classe.",
          discardTitle: "Ignorer les notes non enregistrées ?",
          discardMessage:
            "Les brouillons saisis sur cet écran seront perdus.",
          keep: "Continuer",
          discard: "Ignorer",
          refreshTitle: "Actualiser les notes ?",
          refreshMessage:
            "Les brouillons non enregistrés seront remplacés par les données du serveur.",
        }
      : {
          title: "Enter marks",
          subtitle: "Marks out of 20 · Batch save",
          search: "Search students",
          entered: "entered",
          missing: "Missing",
          saved: "Saved",
          draft: "Draft",
          save: "Save changes",
          savedAll: "All changes are saved",
          invalid: "Enter a mark from 0 to 20.",
          empty: "No students",
          emptyMessage: "There are no students enrolled in this class.",
          discardTitle: "Discard unsaved marks?",
          discardMessage: "Draft marks entered on this screen will be lost.",
          keep: "Keep editing",
          discard: "Discard",
          refreshTitle: "Refresh marks?",
          refreshMessage:
            "Unsaved drafts will be replaced with data from the server.",
        };

  const requestBack = () => {
    if (dirtyStudents.length === 0) {
      router.back();
      return;
    }
    Alert.alert(copy.discardTitle, copy.discardMessage, [
      { text: copy.keep, style: "cancel" },
      { text: copy.discard, style: "destructive", onPress: () => router.back() },
    ]);
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      requestBack();
      return true;
    });
    return () => subscription.remove();
  }, [dirtyStudents.length]);

  const updateDraft = (studentId: number, draft: string) => {
    const normalized = draft.replace(",", ".");
    if (normalized && !/^\d{0,2}(\.\d{0,2})?$/.test(normalized)) return;
    setStudents((current) =>
      current.map((student) =>
        student.id === studentId ? { ...student, draft: normalized } : student,
      ),
    );
    setSavedFeedback(false);
    const value = Number(normalized);
    setErrors((current) => {
      const next = { ...current };
      if (normalized && (Number.isNaN(value) || value < 0 || value > 20)) {
        next[studentId] = copy.invalid;
      } else {
        delete next[studentId];
      }
      return next;
    });
  };

  const saveChanges = async () => {
    const invalid = students.filter((student) => {
      if (!student.draft.trim()) return false;
      const value = Number(student.draft);
      return Number.isNaN(value) || value < 0 || value > 20;
    });
    if (invalid.length) {
      setErrors(
        invalid.reduce<Record<number, string>>((result, student) => {
          result[student.id] = copy.invalid;
          return result;
        }, {}),
      );
      return;
    }
    setSaving(true);
    try {
      for (const student of dirtyStudents) {
        const isDelete = !student.draft.trim() && student.savedMark !== null;
        const response = await authFetch(`${Config.apiBaseUrl}/marks`, {
          method: isDelete ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            school_id: params.school_id,
            student_id: student.id,
            subject_id: params.subject_id,
            class_id: params.class_id,
            exam_id: params.sequence_id,
            ...(isDelete ? {} : { mark: Number(student.draft) }),
          }),
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(
            payload.message ?? `Unable to save the mark for ${student.name}.`,
          );
        }
        setStudents((current) =>
          current.map((item) =>
            item.id === student.id
              ? {
                  ...item,
                  savedMark: isDelete ? null : Number(student.draft),
                  markId: isDelete ? null : payload.data?.id ?? item.markId,
                }
              : item,
          ),
        );
      }
      setSavedFeedback(true);
    } catch (saveError) {
      Alert.alert(
        language === "fr" ? "Échec de l’enregistrement" : "Save failed",
        saveError instanceof Error
          ? saveError.message
          : language === "fr"
            ? "Veuillez réessayer."
            : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const refresh = () => {
    const perform = () => {
      setRefreshing(true);
      void load();
    };
    if (!dirtyStudents.length) {
      perform();
      return;
    }
    Alert.alert(copy.refreshTitle, copy.refreshMessage, [
      { text: copy.keep, style: "cancel" },
      { text: copy.discard, style: "destructive", onPress: perform },
    ]);
  };

  const filtered = students.filter((student) =>
    student.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const entered = students.filter((student) => student.draft.trim()).length;

  if (loading && !refreshing) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContent}>
          <LoadingState rows={8} />
        </View>
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContent}>
          <AppHeader title={copy.title} onBack={() => router.back()} />
          <ErrorState message={error} onRetry={load} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        <AppHeader
          title={copy.title}
          subtitle={`${className} · ${entered}/${students.length} ${copy.entered}`}
          onBack={requestBack}
        />
        <Card>
          <View style={styles.context}>
            <Context icon="home" label={params.school_name ?? "School"} />
            <Context icon="book-open" label={params.subject_name ?? "Subject"} />
            <Context icon="calendar" label={params.sequence_name ?? "Sequence"} />
          </View>
        </Card>
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder={copy.search}
        />
        {filtered.length === 0 ? (
          <EmptyState
            icon="users"
            title={copy.empty}
            message={copy.emptyMessage}
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((student, index) => {
              const value = student.draft.trim();
              const isDirty =
                (!value && student.savedMark !== null) ||
                (value && Number(value) !== student.savedMark);
              return (
                <Card key={student.id}>
                  <View style={styles.studentRow}>
                    <View
                      style={[
                        styles.number,
                        { backgroundColor: colors.surfaceMuted },
                      ]}
                    >
                      <Text
                        style={[typography.label, { color: colors.textSecondary }]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[typography.bodyStrong, { color: colors.text }]}
                      >
                        {student.name}
                      </Text>
                      <StatusChip
                        label={
                          isDirty
                            ? copy.draft
                            : student.savedMark === null
                              ? copy.missing
                              : copy.saved
                        }
                        tone={
                          isDirty
                            ? "warning"
                            : student.savedMark === null
                              ? "error"
                              : "success"
                        }
                        icon={isDirty ? "edit-3" : student.savedMark === null ? "minus" : "check"}
                      />
                    </View>
                    <View style={styles.markField}>
                      <TextInput
                        accessibilityLabel={`${student.name}, mark out of 20`}
                        value={student.draft}
                        onChangeText={(value) => updateDraft(student.id, value)}
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        placeholder="—"
                        placeholderTextColor={colors.textMuted}
                        selectTextOnFocus
                        maxLength={5}
                        style={[
                          styles.markInput,
                          {
                            color: colors.text,
                            backgroundColor: colors.surfaceMuted,
                            borderColor: errors[student.id]
                              ? colors.error
                              : isDirty
                                ? colors.warning
                                : colors.border,
                          },
                        ]}
                      />
                      <Text style={[typography.label, { color: colors.textMuted }]}>
                        /20
                      </Text>
                    </View>
                  </View>
                  {errors[student.id] ? (
                    <Text style={[typography.caption, { color: colors.error }]}>
                      {errors[student.id]}
                    </Text>
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}
        {savedFeedback && dirtyStudents.length === 0 ? (
          <View
            style={[styles.feedback, { backgroundColor: colors.successSoft }]}
          >
            <Feather name="check-circle" size={18} color={colors.success} />
            <Text style={[typography.label, { color: colors.success }]}>
              {copy.savedAll}
            </Text>
          </View>
        ) : null}
        <Button
          label={
            dirtyStudents.length
              ? `${copy.save} (${dirtyStudents.length})`
              : copy.savedAll
          }
          icon={dirtyStudents.length ? "save" : "check"}
          loading={saving}
          disabled={dirtyStudents.length === 0 || hasErrors}
          onPress={() => void saveChanges()}
        />
      </ScrollView>
    </View>
  );
}

function Context({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.contextRow}>
      <Feather name={icon} size={15} color={colors.primary} />
      <Text
        numberOfLines={1}
        style={[typography.caption, { color: colors.textSecondary, flex: 1 }]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingContent: {
    flex: 1,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    padding: spacing.lg,
  },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    padding: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  context: { gap: spacing.xs },
  contextRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  list: { gap: spacing.sm },
  studentRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  number: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  markField: { flexDirection: "row", alignItems: "center", gap: spacing.xxs },
  markInput: {
    width: 68,
    minHeight: touchTarget.minHeight,
    borderWidth: 1,
    borderRadius: radii.md,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },
  feedback: {
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
});
