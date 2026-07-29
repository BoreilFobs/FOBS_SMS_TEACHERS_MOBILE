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
  AppHeader,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  SchoolSelector,
  StatusChip,
} from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import useSchoolStore from "@/utils/stores/schoolStore";
import { radii, spacing, typography } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authFetch } from "@/services/authFetch";

interface SchoolClass {
  id: number;
  name: string;
  level?: string;
  academic_year?: string;
  academic_year_id?: number;
}

export default function AttendanceClassesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const activeSchool = useSchoolStore((store) => store.activeSchool);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeSchool) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setError(null);
    try {
      const response = await authFetch(
        `${Config.apiBaseUrl}/school-classes?school_id=${activeSchool.id}`,
      );
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to load classes.");
      }
      setClasses(payload.classes ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Network error.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSchool]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const copy =
    language === "fr"
      ? {
          title: "Présences",
          subtitle: "Choisir une classe pour commencer",
          count: "classes dans",
          empty: "Aucune classe assignée",
          emptyMessage:
            "Cette école ne contient aucune classe disponible pour l’appel.",
          noSchool: "Aucune école sélectionnée",
          noSchoolMessage:
            "Choisissez l’école avant d’enregistrer les présences.",
          action: "Faire l’appel",
        }
      : {
          title: "Attendance",
          subtitle: "Choose a class to begin",
          count: "classes at",
          empty: "No assigned classes",
          emptyMessage:
            "There are no classes available for attendance at this school.",
          noSchool: "No school selected",
          noSchoolMessage: "Choose the school before recording attendance.",
          action: "Take attendance",
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
        <AppHeader
          title={copy.title}
          subtitle={copy.subtitle}
          onBack={() => router.replace("/(tabs)/classes")}
        />
        <SchoolSelector />
        {!activeSchool ? (
          <EmptyState
            icon="home"
            title={copy.noSchool}
            message={copy.noSchoolMessage}
          />
        ) : loading ? (
          <LoadingState rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : classes.length === 0 ? (
          <EmptyState
            icon="users"
            title={copy.empty}
            message={copy.emptyMessage}
          />
        ) : (
          <>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {classes.length} {copy.count} {activeSchool.name}
            </Text>
            <View style={styles.list}>
              {classes.map((item) => (
                <Card
                  key={item.id}
                  onPress={() =>
                    router.push(
                      `/attendance/students?class_id=${item.id}&school_id=${activeSchool.id}&class_name=${encodeURIComponent(item.name)}`,
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
                      <Feather name="users" size={21} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyStrong, { color: colors.text }]}>
                        {item.name}
                      </Text>
                      <Text
                        style={[typography.caption, { color: colors.textSecondary }]}
                      >
                        {[item.level, item.academic_year]
                          .filter(Boolean)
                          .join(" • ")}
                      </Text>
                    </View>
                    <StatusChip label={copy.action} tone="info" />
                  </View>
                </Card>
              ))}
            </View>
          </>
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
