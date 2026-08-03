import React, { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
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
import { radii, spacing, typography } from "@/constants/theme";
import { fetchJson } from "@/services/fetchJson";
import { formatDate } from "@/social/utils/format";

interface ExamSequence {
  id: number;
  name: string;
  term: number;
  academic_year: string;
  academic_year_id?: number;
  start_date: string;
  mark_entry_allowed: boolean;
  is_published: boolean;
}

export default function MarksExamsRoute() {
  return (
    <AuthWrapper>
      <MarksExamsScreen />
    </AuthWrapper>
  );
}

function MarksExamsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    class_id: string;
    class_name?: string;
    school_id: string;
    subject_id: string;
    subject_name?: string;
  }>();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const schools = useSchoolStore((store) => store.schools);
  const school = schools.find((item) => String(item.id) === params.school_id);
  const [sequences, setSequences] = useState<ExamSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!params.school_id) {
      // Without a school there is nothing to fetch, but the screen must still
      // leave its loading state or it spins forever.
      setError("No school selected.");
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const payload = await fetchJson<{ data?: ExamSequence[] }>(
        `${Config.apiBaseUrl}/exam-sequences?school_id=${params.school_id}`,
      );
      setSequences(payload.data ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Network error.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.school_id]);

  useEffect(() => {
    void load();
  }, [load]);

  const copy =
    language === "fr"
      ? {
          title: "Choisir une séquence",
          subtitle: "Étape 3 sur 3",
          open: "Ouverte",
          closed: "Fermée",
          published: "Publiée",
          term: "Trimestre",
          empty: "Aucune séquence",
          emptyMessage:
            "Aucune séquence d’examen n’est disponible pour cette école.",
          unavailableTitle: "Saisie fermée",
          unavailableMessage:
            "L’administration n’autorise pas la saisie des notes pour cette séquence.",
        }
      : {
          title: "Choose a sequence",
          subtitle: "Step 3 of 3",
          open: "Open",
          closed: "Closed",
          published: "Published",
          term: "Term",
          empty: "No sequences",
          emptyMessage: "No exam sequences are available for this school.",
          unavailableTitle: "Marks entry closed",
          unavailableMessage:
            "The school administration has not enabled marks entry for this sequence.",
        };

  return (
    <Screen scroll bottomInset={false}>
      <AppHeader
        title={copy.title}
        subtitle={`${copy.subtitle} · ${params.class_name ?? ""}`}
        onBack={() => router.back()}
      />
      <Card>
        <View style={styles.context}>
          <Context label={school?.name ?? "School"} icon="home" />
          <Context label={params.subject_name ?? "Subject"} icon="book-open" />
          <Context label={params.class_name ?? "Class"} icon="users" />
        </View>
      </Card>
      {loading ? (
        <LoadingState rows={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : sequences.length === 0 ? (
        <EmptyState
          icon="calendar"
          title={copy.empty}
          message={copy.emptyMessage}
        />
      ) : (
        <View style={styles.list}>
          {sequences.map((item) => (
            <Card
              key={item.id}
              onPress={() => {
                if (!item.mark_entry_allowed) {
                  Alert.alert(copy.unavailableTitle, copy.unavailableMessage);
                  return;
                }
                router.push(
                  `/marks/students?class_id=${params.class_id}&class_name=${encodeURIComponent(params.class_name ?? "")}&school_id=${params.school_id}&school_name=${encodeURIComponent(school?.name ?? "")}&subject_id=${params.subject_id}&subject_name=${encodeURIComponent(params.subject_name ?? "")}&sequence_id=${item.id}&sequence_name=${encodeURIComponent(item.name)}`,
                );
              }}
            >
              <View style={styles.row}>
                <View
                  style={[styles.icon, { backgroundColor: colors.primarySoft }]}
                >
                  <Feather name="calendar" size={21} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <Text
                    style={[typography.caption, { color: colors.textSecondary }]}
                  >
                    {copy.term} {item.term} · {item.academic_year}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    {formatDate(item.start_date, language, { dateStyle: "medium" })}
                  </Text>
                </View>
                <View style={styles.statuses}>
                  <StatusChip
                    label={item.mark_entry_allowed ? copy.open : copy.closed}
                    tone={item.mark_entry_allowed ? "success" : "error"}
                    icon={item.mark_entry_allowed ? "unlock" : "lock"}
                  />
                  {item.is_published ? (
                    <StatusChip label={copy.published} tone="info" />
                  ) : null}
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
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
    <View style={styles.contextItem}>
      <Feather name={icon} size={15} color={colors.primary} />
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  context: { gap: spacing.xs },
  contextItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  list: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statuses: { alignItems: "flex-end", gap: spacing.xs },
});
