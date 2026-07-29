import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import Config from "@/constants/Config";
import AuthWrapper from "@/components/AuthWrapper";
import {
  AppHeader,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FilterChips,
  FormField,
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

interface Student {
  id: number;
  name: string;
  absences: number;
  isPresent: boolean | null;
}

interface Subject {
  id: number;
  name: string;
}

interface ClassInfo {
  id: number;
  name: string;
}

export default function ClassAttendanceRoute() {
  return (
    <AuthWrapper>
      <ClassAttendanceScreen />
    </AuthWrapper>
  );
}

function ClassAttendanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    class_id: string;
    school_id?: string;
    class_name?: string;
  }>();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const { activeSchool, schools } = useSchoolStore();
  const teacher = useUserStore((store) => store.teacher);
  const classId = params.class_id;
  const schoolId = params.school_id ?? String(activeSchool?.id ?? "");
  const school = schools.find((item) => String(item.id) === schoolId) ?? activeSchool;
  const today = new Date().toISOString().slice(0, 10);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subject, setSubject] = useState("");
  const [periods, setPeriods] = useState<1 | 2>(1);
  const [started, setStarted] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const term = getCurrentTerm();
  const load = useCallback(async () => {
    if (!classId || !schoolId) return;
    setError(null);
    try {
      const urls = [
        `${Config.apiBaseUrl}/class-students?class_id=${classId}`,
        `${Config.apiBaseUrl}/attendances?school_id=${schoolId}&class_id=${classId}&date=${today}&term=${term}`,
      ];
      if (teacher?.id) {
        urls.push(
          `${Config.apiBaseUrl}/teacher-subjects?school_id=${schoolId}&teacher_id=${teacher.id}`,
        );
      }
      const responses = await Promise.all(urls.map((url) => authFetch(url)));
      const payloads = await Promise.all(responses.map((response) => response.json()));
      const [studentPayload, attendancePayload, subjectPayload] = payloads;
      if (!responses[0].ok || !studentPayload.success) {
        throw new Error(studentPayload.message ?? "Unable to load students.");
      }
      const attendance = attendancePayload.success ? attendancePayload.data ?? [] : [];
      setClassInfo(studentPayload.class);
      setStudents(
        (studentPayload.students ?? []).map(
          (student: { id: number; name: string }) => {
            const saved = attendance.find(
              (item: { student_id: number }) => item.student_id === student.id,
            );
            return {
              ...student,
              absences: Number(saved?.hours ?? 0),
              isPresent:
                typeof saved?.is_present === "boolean"
                  ? saved.is_present
                  : saved
                    ? Boolean(saved.is_present)
                    : null,
            };
          },
        ),
      );
      if (attendance.length > 0) {
        setSubject(String(attendance[0].subject ?? ""));
        setPeriods(Number(attendance[0].hours) === 2 ? 2 : 1);
        setStarted(true);
      }
      if (subjectPayload?.success) setSubjects(subjectPayload.data ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Network error.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [classId, schoolId, teacher?.id, term, today]);

  useEffect(() => {
    void load();
  }, [load]);

  const copy =
    language === "fr"
      ? {
          title: "Présences",
          setup: "Configurer l’appel",
          subject: "Matière",
          periods: "Durée",
          oneHour: "1 heure",
          twoHours: "2 heures",
          start: "Commencer",
          present: "Présent",
          absent: "Absent",
          remaining: "Restants",
          allPresent: "Tous les restants présents",
          saved: "Synchronisé",
          saving: "Enregistrement…",
          noStudents: "Aucun élève",
          noStudentsMessage: "Aucun élève n’est inscrit dans cette classe.",
          chooseSubject: "Choisissez une matière avant de commencer.",
          change: "Modifier la séance",
        }
      : {
          title: "Attendance",
          setup: "Set up attendance",
          subject: "Subject",
          periods: "Duration",
          oneHour: "1 hour",
          twoHours: "2 hours",
          start: "Start attendance",
          present: "Present",
          absent: "Absent",
          remaining: "Remaining",
          allPresent: "Mark all remaining present",
          saved: "Synchronized",
          saving: "Saving…",
          noStudents: "No students",
          noStudentsMessage: "There are no students enrolled in this class.",
          chooseSubject: "Choose a subject before starting.",
          change: "Edit session",
        };

  const saveAttendance = async (student: Student, isPresent: boolean) => {
    if (!subject.trim() || savingIds.has(student.id)) return false;
    setSavingIds((current) => new Set(current).add(student.id));
    try {
      const response = await authFetch(`${Config.apiBaseUrl}/attendances`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          school_id: schoolId,
          student_id: student.id,
          class_id: classId,
          term,
          date: today,
          subject: subject.trim(),
          hours: isPresent ? 0 : periods,
          is_present: isPresent,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to save attendance.");
      }
      setStudents((current) =>
        current.map((item) => {
          if (item.id !== student.id) return item;
          const adjustedAbsences = isPresent
            ? item.isPresent === false
              ? Math.max(0, item.absences - periods)
              : item.absences
            : item.isPresent === false
              ? item.absences
              : item.absences + periods;
          return { ...item, isPresent, absences: adjustedAbsences };
        }),
      );
      setLastSavedAt(new Date());
      return true;
    } catch (saveError) {
      Alert.alert(
        language === "fr" ? "Échec de l’enregistrement" : "Save failed",
        saveError instanceof Error
          ? saveError.message
          : language === "fr"
            ? "Veuillez réessayer."
            : "Please try again.",
      );
      return false;
    } finally {
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(student.id);
        return next;
      });
    }
  };

  const markRemainingPresent = async () => {
    const remaining = students.filter((student) => student.isPresent === null);
    if (!remaining.length) return;
    setBulkSaving(true);
    for (const student of remaining) {
      await saveAttendance(student, true);
    }
    setBulkSaving(false);
  };

  const marked = students.filter((item) => item.isPresent !== null).length;
  const present = students.filter((item) => item.isPresent === true).length;
  const absent = students.filter((item) => item.isPresent === false).length;

  if (loading && !refreshing) {
    return (
      <Screen bottomInset={false}>
        <LoadingState rows={7} />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen bottomInset={false}>
        <AppHeader title={copy.title} onBack={() => router.back()} />
        <ErrorState message={error} onRetry={load} />
      </Screen>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
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
        <AppHeader
          title={copy.title}
          subtitle={`${classInfo?.name ?? params.class_name ?? ""} · ${new Intl.DateTimeFormat(
            language === "fr" ? "fr-FR" : "en-GB",
            { dateStyle: "medium" },
          ).format(new Date())}`}
          onBack={() => router.back()}
        />
        <Card>
          <View style={styles.context}>
            <ContextItem icon="home" label={school?.name ?? "School"} />
            <ContextItem icon="book-open" label={subject || copy.subject} />
            <ContextItem
              icon="clock"
              label={periods === 1 ? copy.oneHour : copy.twoHours}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowSetup(true)}
            style={styles.changeButton}
          >
            <Text style={[typography.label, { color: colors.primary }]}>
              {started ? copy.change : copy.setup}
            </Text>
          </Pressable>
        </Card>

        {started ? (
          <>
            <View style={styles.summary}>
              <Summary value={present} label={copy.present} tone="success" />
              <Summary value={absent} label={copy.absent} tone="error" />
              <Summary
                value={students.length - marked}
                label={copy.remaining}
                tone="neutral"
              />
            </View>
            {marked < students.length ? (
              <Button
                label={copy.allPresent}
                icon="check-circle"
                variant="secondary"
                loading={bulkSaving}
                onPress={() => void markRemainingPresent()}
              />
            ) : (
              <View
                style={[
                  styles.syncBanner,
                  { backgroundColor: colors.successSoft },
                ]}
              >
                <Feather name="check-circle" size={18} color={colors.success} />
                <Text style={[typography.label, { color: colors.success }]}>
                  {copy.saved}
                  {lastSavedAt
                    ? ` · ${lastSavedAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : ""}
                </Text>
              </View>
            )}
          </>
        ) : (
          <Button
            label={copy.setup}
            icon="play"
            onPress={() => setShowSetup(true)}
          />
        )}

        {students.length === 0 ? (
          <EmptyState
            icon="users"
            title={copy.noStudents}
            message={copy.noStudentsMessage}
          />
        ) : (
          <View style={styles.list}>
            {students.map((student) => (
              <StudentAttendanceRow
                key={student.id}
                student={student}
                started={started}
                saving={savingIds.has(student.id)}
                presentLabel={copy.present}
                absentLabel={copy.absent}
                onChange={(value) => void saveAttendance(student, value)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showSetup}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSetup(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
            onPress={() => setShowSetup(false)}
          />
          <View style={[styles.sheet, { backgroundColor: colors.surfaceElevated }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[typography.heading, { color: colors.text }]}>
              {copy.setup}
            </Text>
            {subjects.length > 0 ? (
              <>
                <Text style={[typography.label, { color: colors.text }]}>
                  {copy.subject}
                </Text>
                <FilterChips
                  options={subjects.map((item) => ({
                    value: item.name,
                    label: item.name,
                  }))}
                  selected={subject || subjects[0].name}
                  onSelect={setSubject}
                />
              </>
            ) : (
              <FormField
                label={copy.subject}
                value={subject}
                onChangeText={setSubject}
              />
            )}
            <Text style={[typography.label, { color: colors.text }]}>
              {copy.periods}
            </Text>
            <FilterChips
              options={[
                { value: "1", label: copy.oneHour },
                { value: "2", label: copy.twoHours },
              ]}
              selected={String(periods)}
              onSelect={(value) => setPeriods(value === "2" ? 2 : 1)}
            />
            <Button
              label={copy.start}
              icon="check"
              disabled={!subject && subjects.length === 0}
              onPress={() => {
                const resolvedSubject = subject || subjects[0]?.name || "";
                if (!resolvedSubject) {
                  Alert.alert(copy.subject, copy.chooseSubject);
                  return;
                }
                setSubject(resolvedSubject);
                setStarted(true);
                setShowSetup(false);
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ContextItem({ icon, label }: { icon: React.ComponentProps<typeof Feather>["name"]; label: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.contextItem}>
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

function Summary({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "success" | "error" | "neutral";
}) {
  const { colors } = useAppTheme();
  const foreground =
    tone === "success"
      ? colors.success
      : tone === "error"
        ? colors.error
        : colors.textSecondary;
  return (
    <Card style={styles.summaryItem}>
      <Text style={[typography.heading, { color: foreground }]}>{value}</Text>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </Card>
  );
}

function StudentAttendanceRow({
  student,
  started,
  saving,
  presentLabel,
  absentLabel,
  onChange,
}: {
  student: Student;
  started: boolean;
  saving: boolean;
  presentLabel: string;
  absentLabel: string;
  onChange: (present: boolean) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Card>
      <View style={styles.studentRow}>
        <View
          style={[styles.avatar, { backgroundColor: colors.surfaceMuted }]}
        >
          <Feather name="user" size={19} color={colors.textSecondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>
            {student.name}
          </Text>
          {student.absences > 0 ? (
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {student.absences}h absent
            </Text>
          ) : null}
        </View>
        {started ? (
          <View style={styles.statusButtons}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${student.name}: ${presentLabel}`}
              accessibilityState={{ selected: student.isPresent === true, busy: saving }}
              disabled={saving}
              onPress={() => onChange(true)}
              style={[
                styles.statusButton,
                {
                  backgroundColor:
                    student.isPresent === true
                      ? colors.success
                      : colors.successSoft,
                  borderColor: colors.success,
                },
              ]}
            >
              <Ionicons
                name="checkmark"
                size={22}
                color={
                  student.isPresent === true ? "#FFFFFF" : colors.success
                }
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${student.name}: ${absentLabel}`}
              accessibilityState={{ selected: student.isPresent === false, busy: saving }}
              disabled={saving}
              onPress={() => onChange(false)}
              style={[
                styles.statusButton,
                {
                  backgroundColor:
                    student.isPresent === false ? colors.error : colors.errorSoft,
                  borderColor: colors.error,
                },
              ]}
            >
              <Ionicons
                name="close"
                size={22}
                color={student.isPresent === false ? "#FFFFFF" : colors.error}
              />
            </Pressable>
          </View>
        ) : (
          <StatusChip label="—" />
        )}
      </View>
    </Card>
  );
}

function getCurrentTerm() {
  const month = new Date().getMonth() + 1;
  if (month >= 7) return 1;
  if (month <= 3) return 2;
  return 3;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  contextItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  changeButton: { minHeight: 36, justifyContent: "center", alignSelf: "flex-start" },
  summary: { flexDirection: "row", gap: spacing.xs },
  summaryItem: { flex: 1, alignItems: "center", gap: 2 },
  syncBanner: {
    minHeight: 48,
    borderRadius: radii.md,
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  list: { gap: spacing.sm },
  studentRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  statusButtons: { flexDirection: "row", gap: spacing.xs },
  statusButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.xs,
  },
});
