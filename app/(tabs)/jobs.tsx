import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
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
import {
  Button,
  EmptyState,
  IconButton,
  LoadingState,
  SearchInput,
  Segmented,
} from "@/components/ui";
import { EmploymentType, Job, JobFilters } from "@/social/models";
import { JobCard } from "@/social/components/JobCard";
import { useSocial } from "@/social/hooks/useSocial";
import { elevation, layout, radii, spacing, typography } from "@/constants/theme";

type JobsView = "recommended" | "recent" | "saved";

const emptyFilters: JobFilters = {};

export default function JobsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { repository, snapshot } = useSocial();
  const [view, setView] = useState<JobsView>("recommended");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<JobFilters>(emptyFilters);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      void repository
        .getJobs({ ...filters, query, savedOnly: view === "saved" })
        .then((result) => {
          setJobs(
            view === "recommended"
              ? [...result].sort((a, b) => Number(b.recommended) - Number(a.recommended))
              : [...result].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
          );
        })
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(timer);
  }, [filters, query, repository, snapshot.jobs, view]);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => value !== undefined && value !== "").length,
    [filters],
  );

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.feedBackground, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.titleLarge, { color: colors.text }]}>{t("jobs")}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {jobs.length} {t("jobs")}
          </Text>
        </View>
        <IconButton
          icon="document-text"
          label={t("my_applications")}
          tone="primary"
          size={40}
          onPress={() => router.push("/social/applications")}
        />
      </View>
      <View style={styles.controls}>
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <SearchInput value={query} onChangeText={setQuery} placeholder={t("job_search")} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("filters")}
            onPress={() => setFilterVisible(true)}
            style={({ pressed }) => [
              styles.filterButton,
              {
                backgroundColor: activeFilterCount ? colors.primary : colors.surface,
                borderColor: activeFilterCount ? colors.primary : colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Feather
              name="sliders"
              size={19}
              color={activeFilterCount ? colors.onPrimary : colors.text}
            />
            {activeFilterCount ? (
              <Text style={[typography.micro, { color: colors.onPrimary }]}>
                {activeFilterCount}
              </Text>
            ) : null}
          </Pressable>
        </View>
        <Segmented
          selected={view}
          onSelect={setView}
          options={[
            { value: "recommended", label: t("recommended") },
            { value: "recent", label: t("recent") },
            { value: "saved", label: t("saved") },
          ]}
        />
      </View>
      {loading ? (
        <View style={styles.loadingBox}>
          <LoadingState rows={4} />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(job) => job.id}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              application={snapshot.applications.find((application) => application.jobId === item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: layout.cardGap }} />}
          ListEmptyComponent={<EmptyState icon="briefcase" title={t("no_jobs")} message={t("clear_filters")} />}
        />
      )}
      <JobFiltersModal
        visible={filterVisible}
        filters={filters}
        onApply={(next) => {
          setFilters(next);
          setFilterVisible(false);
        }}
        onClose={() => setFilterVisible(false)}
      />
    </View>
  );
}

function JobFiltersModal({
  visible,
  filters,
  onApply,
  onClose,
}: {
  visible: boolean;
  filters: JobFilters;
  onApply: (filters: JobFilters) => void;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const [draft, setDraft] = useState<JobFilters>(filters);
  useEffect(() => setDraft(filters), [filters, visible]);
  const input = (key: keyof JobFilters, label: string, keyboardType?: "numeric") => (
    <View style={styles.field}>
      <Text style={[typography.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={draft[key] === undefined ? "" : String(draft[key])}
        onChangeText={(value) =>
          setDraft((current) => ({
            ...current,
            [key]: key === "experienceYears" ? (value ? Number(value) : undefined) : value || undefined,
          }))
        }
        keyboardType={keyboardType}
        style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
        placeholder={label}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.modal,
            { backgroundColor: colors.surfaceElevated },
            elevation.overlay,
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <View style={styles.modalHeader}>
            <Text style={[typography.title, { color: colors.text }]}>{t("filters")}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("close")}
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Feather name="x" size={22} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.filterContent} keyboardShouldPersistTaps="handled">
            {input("subject", t("subjects"))}
            {input("location", t("location"))}
            {input("qualification", t("qualification"))}
            {input("level", t("educational_level"))}
            {input("experienceYears", t("experience_required"), "numeric")}
            <Text style={[typography.label, { color: colors.text }]}>{t("employment_type")}</Text>
            <View style={styles.typeRow}>
              {(["full-time", "part-time", "contract", "temporary"] as EmploymentType[]).map((type) => (
                <Pressable
                  key={type}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: draft.employmentType === type }}
                  onPress={() =>
                    setDraft((current) => ({
                      ...current,
                      employmentType: current.employmentType === type ? undefined : type,
                    }))
                  }
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: draft.employmentType === type ? colors.primary : colors.surface,
                      borderColor: draft.employmentType === type ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[typography.label, { color: draft.employmentType === type ? colors.onPrimary : colors.text }]}>
                    {t(type.replace("-", "_"))}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.buttonRow}>
              <View style={{ flex: 1 }}>
                <Button label={t("clear_filters")} variant="secondary" onPress={() => setDraft({})} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label={t("done")} onPress={() => onApply(draft)} />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  controls: { paddingHorizontal: layout.gutter, paddingBottom: spacing.sm, gap: spacing.xs },
  searchRow: { flexDirection: "row", gap: spacing.xs },
  closeButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  filterButton: { minWidth: 48, height: 48, borderWidth: 1, borderRadius: radii.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 },
  list: { paddingHorizontal: layout.gutter, paddingBottom: layout.tabBarClearance },
  loadingBox: { paddingHorizontal: layout.gutter },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modal: { maxHeight: "88%", borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.md, paddingTop: spacing.xs },
  sheetHandle: { width: 40, height: 4, borderRadius: radii.pill, alignSelf: "center", marginBottom: spacing.xs },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  filterContent: { gap: spacing.sm, paddingBottom: spacing.xxl },
  field: { gap: 5 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing.sm, ...typography.body },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  typeChip: { minHeight: 44, borderWidth: 1, borderRadius: radii.pill, justifyContent: "center", paddingHorizontal: spacing.sm },
  buttonRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
});
