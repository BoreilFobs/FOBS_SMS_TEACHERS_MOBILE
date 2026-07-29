import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { elevation, radii, spacing, touchTarget, typography } from "@/constants/theme";
import useSchoolStore, { School } from "@/utils/stores/schoolStore";
import { useLanguage } from "@/contexts/LanguageContext";

export function Screen({
  children,
  scroll = false,
  bottomInset = true,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  bottomInset?: boolean;
  style?: ViewStyle;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const contentStyle = [
    styles.screenContent,
    {
      paddingTop: insets.top + spacing.sm,
      paddingBottom: bottomInset ? insets.bottom + 92 : spacing.lg,
    },
    style,
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={contentStyle}>{children}</View>
      )}
    </View>
  );
}

export function AppHeader({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor: colors.surfaceMuted,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
      ) : null}
      <View style={styles.headerText}>
        <Text style={[typography.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? <View>{action}</View> : null}
    </View>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[typography.heading, { color: colors.text }]}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text style={[typography.label, { color: colors.primary }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Card({
  children,
  onPress,
  style,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}) {
  const { colors } = useAppTheme();
  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      {content}
    </Pressable>
  );
}

export function StatusChip({
  label,
  tone = "neutral",
  icon,
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "error" | "info";
  icon?: React.ComponentProps<typeof Feather>["name"];
}) {
  const { colors } = useAppTheme();
  const foreground =
    tone === "success"
      ? colors.success
      : tone === "warning"
        ? colors.warning
        : tone === "error"
          ? colors.error
          : tone === "info"
            ? colors.info
            : colors.textSecondary;
  const background =
    tone === "success"
      ? colors.successSoft
      : tone === "warning"
        ? colors.warningSoft
        : tone === "error"
          ? colors.errorSoft
          : tone === "info"
            ? colors.infoSoft
            : colors.surfaceMuted;
  return (
    <View style={[styles.chip, { backgroundColor: background }]}>
      {icon ? <Feather name={icon} size={13} color={foreground} /> : null}
      <Text style={[typography.caption, { color: foreground }]}>{label}</Text>
    </View>
  );
}

export function SearchInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.search,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Feather name="search" size={20} color={colors.textMuted} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.searchInput, typography.body, { color: colors.text }]}
        returnKeyType="search"
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChangeText("")}
          hitSlop={10}
        >
          <Feather name="x-circle" size={19} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function FilterChips<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: Array<{ value: T; label: string }>;
  selected: T;
  onSelect: (value: T) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
    >
      {options.map((option) => {
        const active = selected === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(option.value)}
            style={[
              styles.filterChip,
              {
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                typography.label,
                { color: active ? colors.onPrimary : colors.textSecondary },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function EmptyState({
  icon = "inbox",
  title,
  message,
}: {
  icon?: React.ComponentProps<typeof Feather>["name"];
  title: string;
  message: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.stateContainer}>
      <View style={[styles.stateIcon, { backgroundColor: colors.surfaceMuted }]}>
        <Feather name={icon} size={28} color={colors.textMuted} />
      </View>
      <Text style={[typography.heading, { color: colors.text }]}>{title}</Text>
      <Text
        style={[
          typography.body,
          { color: colors.textSecondary, textAlign: "center" },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  return (
    <View style={styles.stateContainer}>
      <View style={[styles.stateIcon, { backgroundColor: colors.errorSoft }]}>
        <Feather name="alert-circle" size={28} color={colors.error} />
      </View>
      <Text style={[typography.heading, { color: colors.text }]}>
        {language === "fr" ? "Impossible de charger" : "Unable to load"}
      </Text>
      <Text
        style={[
          typography.body,
          { color: colors.textSecondary, textAlign: "center" },
        ]}
      >
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={[styles.retryButton, { borderColor: colors.primary }]}
      >
        <Text style={[typography.bodyStrong, { color: colors.primary }]}>
          {language === "fr" ? "Réessayer" : "Try again"}
        </Text>
      </Pressable>
    </View>
  );
}

export function LoadingState({ rows = 4 }: { rows?: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.loadingList} accessibilityLabel="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.loadingRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View
            style={[styles.loadingAvatar, { backgroundColor: colors.surfaceMuted }]}
          />
          <View style={styles.loadingLines}>
            <View
              style={[
                styles.loadingLine,
                { backgroundColor: colors.surfaceMuted, width: "72%" },
              ]}
            />
            <View
              style={[
                styles.loadingLine,
                { backgroundColor: colors.surfaceMuted, width: "46%" },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export function Button({
  label,
  onPress,
  icon,
  variant = "primary",
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Feather>["name"];
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
}) {
  const { colors } = useAppTheme();
  const background =
    variant === "primary"
      ? colors.primary
      : variant === "danger"
        ? colors.errorSoft
        : colors.surface;
  const foreground =
    variant === "primary"
      ? colors.onPrimary
      : variant === "danger"
        ? colors.error
        : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled ? colors.disabled : background,
          borderColor: variant === "secondary" ? colors.border : background,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon ? <Feather name={icon} size={19} color={foreground} /> : null}
          <Text style={[typography.bodyStrong, { color: foreground }]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function FormField({
  label,
  error,
  optional,
  multiline,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  optional?: boolean;
}) {
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  return (
    <View style={styles.field}>
      <Text style={[typography.label, { color: colors.text }]}>
        {label}
        {optional ? (
          <Text style={{ color: colors.textMuted }}>
            {" "}
            ({language === "fr" ? "facultatif" : "optional"})
          </Text>
        ) : null}
      </Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
          },
          props.style,
        ]}
        accessibilityHint={error}
      />
      {error ? (
        <Text style={[typography.caption, { color: colors.error }]}>{error}</Text>
      ) : null}
    </View>
  );
}

export function OfflineBanner({ message }: { message: string }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: colors.warningSoft, borderColor: colors.warning },
      ]}
    >
      <Feather name="wifi-off" size={16} color={colors.warning} />
      <Text style={[typography.caption, { color: colors.warning, flex: 1 }]}>
        {message}
      </Text>
    </View>
  );
}

export function SchoolSelector() {
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const { activeSchool, schools, setActiveSchool } = useSchoolStore();
  const [visible, setVisible] = useState(false);
  const availableSchools = schools.filter(
    (school) =>
      school.status === "active" && school.pivot?.is_approved !== false,
  );

  const select = (school: School) => {
    setActiveSchool(school);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          language === "fr" ? "Changer d’école" : "Change current school"
        }
        onPress={() => setVisible(true)}
        style={[
          styles.schoolSelector,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View
          style={[styles.schoolMonogram, { backgroundColor: colors.primarySoft }]}
        >
          <Text style={[typography.label, { color: colors.primary }]}>
            {(activeSchool?.code || activeSchool?.name || "—")
              .slice(0, 3)
              .toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {language === "fr" ? "École actuelle" : "Current school"}
            {activeSchool?.academic_year
              ? ` • ${activeSchool.academic_year}`
              : ""}
          </Text>
          <Text
            numberOfLines={1}
            style={[typography.bodyStrong, { color: colors.text }]}
          >
            {activeSchool?.name ??
              (language === "fr"
                ? "Sélectionner une école"
                : "Select a school")}
          </Text>
        </View>
        <Feather name="chevron-down" size={20} color={colors.textMuted} />
      </Pressable>
      <Modal
        transparent
        visible={visible}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
            onPress={() => setVisible(false)}
          />
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.surfaceElevated },
            ]}
          >
            <View
              style={[styles.sheetHandle, { backgroundColor: colors.border }]}
            />
            <Text style={[typography.heading, { color: colors.text }]}>
              {language === "fr" ? "Choisir une école" : "Choose a school"}
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, marginBottom: spacing.md },
              ]}
            >
              {language === "fr"
                ? "Les présences et les notes resteront séparées par école."
                : "Attendance and marks stay separated by school."}
            </Text>
            {availableSchools.map((school) => {
              const selected = activeSchool?.id === school.id;
              return (
                <Pressable
                  key={school.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => select(school)}
                  style={[
                    styles.schoolOption,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected
                        ? colors.primarySoft
                        : colors.surface,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyStrong, { color: colors.text }]}>
                      {school.name}
                    </Text>
                    <Text
                      style={[typography.caption, { color: colors.textSecondary }]}
                    >
                      {school.code}
                    </Text>
                  </View>
                  {selected ? (
                    <Feather name="check-circle" size={21} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
            {availableSchools.length === 0 ? (
              <EmptyState
                icon="home"
                title={language === "fr" ? "Aucune école" : "No schools"}
                message={
                  language === "fr"
                    ? "Ajoutez une école depuis votre profil."
                    : "Add a school from your profile."
                }
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: touchTarget.minHeight,
  },
  headerText: { flex: 1, gap: 2 },
  iconButton: {
    width: touchTarget.minWidth,
    height: touchTarget.minHeight,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 30,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...elevation.card,
  },
  chip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    minHeight: 28,
    borderRadius: radii.pill,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: touchTarget.minHeight,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
  },
  searchInput: { flex: 1, paddingVertical: Platform.OS === "web" ? 12 : 8 },
  filterRow: { gap: spacing.xs, paddingRight: spacing.lg },
  filterChip: {
    minHeight: 38,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
  },
  stateContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxxl,
  },
  stateIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  retryButton: {
    minHeight: touchTarget.minHeight,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  loadingList: { gap: spacing.sm },
  loadingRow: {
    minHeight: 82,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingAvatar: { width: 44, height: 44, borderRadius: radii.md },
  loadingLines: { flex: 1, gap: spacing.xs },
  loadingLine: { height: 12, borderRadius: radii.pill },
  button: {
    minHeight: touchTarget.minHeight,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  field: { gap: spacing.xs },
  input: {
    minHeight: touchTarget.minHeight,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  multiline: { minHeight: 112, textAlignVertical: "top" },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  schoolSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 64,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
  },
  schoolMonogram: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    maxHeight: "82%",
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    alignSelf: "center",
    borderRadius: radii.pill,
    marginBottom: spacing.sm,
  },
  schoolOption: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 62,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
});
