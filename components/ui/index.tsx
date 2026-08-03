import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  PressableProps,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import {
  elevation,
  layout,
  motion,
  radii,
  spacing,
  touchTarget,
  typography,
} from "@/constants/theme";
import useSchoolStore, { School } from "@/utils/stores/schoolStore";
import { useLanguage } from "@/contexts/LanguageContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable with a subtle scale response. Used app-wide so every tappable
 * surface answers the finger the same way.
 */
export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  ...props
}: Omit<PressableProps, "children" | "style"> & {
  children?: React.ReactNode;
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (toValue: number) =>
    Animated.timing(scale, {
      toValue,
      duration: motion.fast,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

  return (
    // The style must land on the Pressable itself: it is the flex child of the
    // surrounding row, so putting `flex: 1` on an inner wrapper would let the
    // Pressable collapse to its content width and bunch rows to one side.
    <AnimatedPressable
      {...props}
      onPressIn={(event) => {
        animate(scaleTo);
        props.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animate(1);
        props.onPressOut?.(event);
      }}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  badge,
  tone = "muted",
  size = 44,
  loading = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  badge?: number;
  tone?: "muted" | "primary" | "plain";
  size?: number;
  loading?: boolean;
}) {
  const { colors } = useAppTheme();
  const background =
    tone === "primary"
      ? colors.primarySoft
      : tone === "plain"
        ? "transparent"
        : colors.surfaceMuted;
  const foreground = tone === "primary" ? colors.primary : colors.text;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading, disabled: loading }}
      disabled={loading}
      onPress={onPress}
      style={[
        styles.iconCircle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={foreground} />
      ) : (
        <Ionicons name={icon} size={Math.round(size * 0.48)} color={foreground} />
      )}
      {badge ? (
        <View style={[styles.countBadge, { backgroundColor: colors.error, borderColor: background }]}>
          <Text style={styles.countBadgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

export function Chip({
  label,
  icon,
  tone = "neutral",
}: {
  label: string;
  icon?: React.ComponentProps<typeof Feather>["name"];
  tone?: "neutral" | "primary" | "success" | "warning" | "error" | "info" | "accent";
}) {
  const { colors } = useAppTheme();
  const map = {
    neutral: [colors.textSecondary, colors.surfaceMuted],
    primary: [colors.primary, colors.primarySoft],
    success: [colors.success, colors.successSoft],
    warning: [colors.warning, colors.warningSoft],
    error: [colors.error, colors.errorSoft],
    info: [colors.info, colors.infoSoft],
    accent: [colors.accent, colors.accentSoft],
  } as const;
  const [foreground, background] = map[tone];
  return (
    <View style={[styles.softChip, { backgroundColor: background }]}>
      {icon ? <Feather name={icon} size={12} color={foreground} /> : null}
      <Text style={[typography.micro, { color: foreground }]}>{label}</Text>
    </View>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.divider,
        marginLeft: inset,
      }}
    />
  );
}

/** Pulsing placeholder block, shaped like the content it stands in for. */
export function Skeleton({
  width = "100%",
  height = 12,
  radius = radii.pill,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useAppTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 780,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 780,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [colors.skeleton, colors.skeletonHighlight],
          }),
        },
        style,
      ]}
    />
  );
}

export function Screen({
  children,
  scroll = false,
  bottomInset = true,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  bottomInset?: boolean;
  style?: StyleProp<ViewStyle>;
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
  back,
  action,
  compact,
}: {
  title: string;
  subtitle?: string;
  /** Explicit handler. Prefer `back` unless you need custom navigation. */
  onBack?: () => void;
  /** Shows a back button wired to `router.back()`. */
  back?: boolean;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  const { colors } = useAppTheme();
  const router = useRouter();
  const handleBack = onBack ?? (back ? () => router.back() : undefined);
  return (
    <View style={styles.header}>
      {handleBack ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={handleBack}
          style={[styles.iconButton, { backgroundColor: colors.surfaceMuted }]}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </PressableScale>
      ) : null}
      <View style={styles.headerText}>
        <Text
          numberOfLines={compact ? 1 : 2}
          style={[compact ? typography.heading : typography.title, { color: colors.text }]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={2}
            style={[
              compact ? typography.caption : typography.body,
              { color: colors.textSecondary },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? <View>{action}</View> : null}
    </View>
  );
}

/**
 * Low-emphasis school switcher for the management section. The working school
 * is context, not a call to action, so it sits quietly in a header row instead
 * of occupying a full card. Tapping it opens the same picker as SchoolSelector.
 */
export function SchoolPill({
  align = "left",
}: {
  align?: "left" | "right" | "center";
}) {
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const { activeSchool, schools, setActiveSchool } = useSchoolStore();
  const [visible, setVisible] = useState(false);
  const available = schools.filter(
    (school) => school.status === "active" && school.pivot?.is_approved !== false,
  );
  const label =
    activeSchool?.code ||
    activeSchool?.name ||
    (language === "fr" ? "École" : "School");

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          language === "fr" ? "Changer d’école" : "Change current school"
        }
        onPress={() => setVisible(true)}
        hitSlop={8}
        style={({ pressed }) => [
          styles.schoolPill,
          {
            borderColor: colors.border,
            alignSelf:
              align === "right"
                ? "flex-end"
                : align === "center"
                  ? "center"
                  : "flex-start",
            opacity: pressed ? 0.6 : 1,
          },
        ]}
      >
        <Feather name="home" size={13} color={colors.textMuted} />
        <Text
          numberOfLines={1}
          style={[typography.micro, { color: colors.textSecondary, maxWidth: 132 }]}
        >
          {label}
        </Text>
        <Feather name="chevron-down" size={13} color={colors.textMuted} />
      </Pressable>
      <SchoolPickerSheet
        visible={visible}
        schools={available}
        activeId={activeSchool?.id}
        onSelect={(school) => {
          setActiveSchool(school);
          setVisible(false);
        }}
        onClose={() => setVisible(false)}
      />
    </>
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
  variant = "default",
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** `raised` lifts further off the background; `flat` drops the shadow. */
  variant?: "default" | "raised" | "flat";
}) {
  const { colors } = useAppTheme();
  const cardStyle = [
    styles.card,
    { backgroundColor: colors.surface, borderColor: colors.border },
    variant === "raised" && elevation.raised,
    variant === "flat" && styles.cardFlat,
    style,
  ];
  if (!onPress) return <View style={cardStyle}>{children}</View>;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={cardStyle}
    >
      {children}
    </PressableScale>
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
  const { t } = useLanguage();
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
          accessibilityLabel={t("clear_search")}
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

/**
 * Segmented control for a small, fixed set of mutually exclusive views.
 * Preferred over FilterChips when the options are the primary way to navigate
 * a screen rather than an optional refinement.
 */
export function Segmented<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: Array<{ value: T; label: string; badge?: number }>;
  selected: T;
  onSelect: (value: T) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.segmentTrack, { backgroundColor: colors.surfaceMuted }]}
    >
      {options.map((option) => {
        const active = selected === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(option.value)}
            style={[
              styles.segment,
              active && { backgroundColor: colors.surface, ...elevation.card },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                typography.label,
                { color: active ? colors.primary : colors.textSecondary },
              ]}
            >
              {option.label}
            </Text>
            {option.badge ? (
              <View style={[styles.segmentBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.countBadgeText}>
                  {option.badge > 99 ? "99+" : option.badge}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmptyState({
  icon = "inbox",
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: React.ComponentProps<typeof Feather>["name"];
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.stateContainer}>
      <View style={[styles.stateRing, { borderColor: colors.border }]}>
        <View style={[styles.stateIcon, { backgroundColor: colors.surfaceMuted }]}>
          <Feather name={icon} size={28} color={colors.textMuted} />
        </View>
      </View>
      <Text style={[typography.heading, { color: colors.text }]}>{title}</Text>
      {message ? (
        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, textAlign: "center" },
          ]}
        >
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
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

export function LoadingState({
  rows = 4,
  variant = "list",
}: {
  rows?: number;
  /** `post` mirrors the feed card silhouette so the swap-in is seamless. */
  variant?: "list" | "post";
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.loadingList} accessibilityLabel="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <View
          key={index}
          style={[
            variant === "post" ? styles.loadingPost : styles.loadingRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.loadingHead}>
            <Skeleton width={44} height={44} radius={22} />
            <View style={styles.loadingLines}>
              <Skeleton width="62%" height={12} />
              <Skeleton width="40%" height={10} />
            </View>
          </View>
          {variant === "post" ? (
            <>
              <Skeleton width="94%" height={11} />
              <Skeleton width="78%" height={11} />
              <Skeleton width="100%" height={148} radius={radii.md} />
            </>
          ) : null}
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
  secureToggle,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  optional?: boolean;
  /** Renders a show/hide eye and manages `secureTextEntry` internally. */
  secureToggle?: boolean;
}) {
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const [revealed, setRevealed] = useState(false);
  const borderColor = error ? colors.error : colors.border;

  const input = (
    <TextInput
      {...props}
      multiline={multiline}
      secureTextEntry={secureToggle ? !revealed : props.secureTextEntry}
      placeholderTextColor={colors.textMuted}
      style={[
        styles.input,
        multiline && styles.multiline,
        secureToggle && styles.inputBare,
        {
          color: colors.text,
          backgroundColor: secureToggle ? "transparent" : colors.surface,
          borderColor: secureToggle ? "transparent" : borderColor,
        },
        props.style,
      ]}
      accessibilityHint={error}
    />
  );

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
      {secureToggle ? (
        <View
          style={[
            styles.inputRow,
            { backgroundColor: colors.surface, borderColor },
          ]}
        >
          {input}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              revealed
                ? language === "fr"
                  ? "Masquer le mot de passe"
                  : "Hide password"
                : language === "fr"
                  ? "Afficher le mot de passe"
                  : "Show password"
            }
            onPress={() => setRevealed((current) => !current)}
            hitSlop={8}
            style={styles.revealButton}
          >
            <Feather
              name={revealed ? "eye-off" : "eye"}
              size={19}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
      ) : (
        input
      )}
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
      <SchoolPickerSheet
        visible={visible}
        schools={availableSchools}
        activeId={activeSchool?.id}
        onSelect={select}
        onClose={() => setVisible(false)}
      />
    </>
  );
}

function SchoolPickerSheet({
  visible,
  schools,
  activeId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  schools: School[];
  activeId?: School["id"];
  onSelect: (school: School) => void;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const router = useRouter();
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={language === "fr" ? "Fermer" : "Close"}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surfaceElevated },
            elevation.overlay,
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
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
          {schools.map((school) => {
            const selected = activeId === school.id;
            return (
              <PressableScale
                key={school.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onSelect(school)}
                style={[
                  styles.schoolOption,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primarySoft : colors.surface,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>
                    {school.name}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    {school.code}
                  </Text>
                </View>
                {selected ? (
                  <Feather name="check-circle" size={21} color={colors.primary} />
                ) : null}
              </PressableScale>
            );
          })}
          {schools.length === 0 ? (
            <EmptyState
              icon="home"
              title={language === "fr" ? "Aucune école" : "No schools"}
              message={
                language === "fr"
                  ? "Envoyez une demande avec le code de votre école."
                  : "Send a request using your school code."
              }
            />
          ) : null}

          {/* Joining another school belongs with the list of schools, not
              buried in the profile tab. */}
          <Divider />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={
              language === "fr" ? "Ajouter une école" : "Add a school"
            }
            onPress={() => {
              onClose();
              router.push("/schools/add");
            }}
            style={[styles.schoolOption, { borderColor: colors.border }]}
          >
            <View
              style={[styles.addSchoolIcon, { backgroundColor: colors.primarySoft }]}
            >
              <Feather name="plus" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyStrong, { color: colors.primary }]}>
                {language === "fr" ? "Ajouter une école" : "Add a school"}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {language === "fr"
                  ? "Rejoindre avec un code d’école"
                  : "Join with a school code"}
              </Text>
            </View>
            <Feather name="chevron-right" size={19} color={colors.textMuted} />
          </PressableScale>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={
              language === "fr" ? "Demandes en attente" : "Pending requests"
            }
            onPress={() => {
              onClose();
              router.push("/schools/requests");
            }}
            style={styles.sheetLink}
          >
            <Feather name="clock" size={15} color={colors.textSecondary} />
            <Text style={[typography.label, { color: colors.textSecondary }]}>
              {language === "fr" ? "Demandes en attente" : "Pending requests"}
            </Text>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: {
    flexGrow: 1,
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    paddingHorizontal: layout.screenPadding,
    gap: spacing.md,
  },
  iconCircle: { alignItems: "center", justifyContent: "center" },
  countBadge: {
    position: "absolute",
    top: -1,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  countBadgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "800" },
  softChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  schoolPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 30,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    backgroundColor: "transparent",
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
    borderRadius: radii.card,
    padding: spacing.md,
    ...elevation.card,
  },
  cardFlat: { shadowOpacity: 0, elevation: 0 },
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
  segmentTrack: { flexDirection: "row", borderRadius: radii.md, padding: 4, gap: 4 },
  segment: {
    flex: 1,
    minHeight: 38,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 6,
  },
  segmentBadge: {
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
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
  stateRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  stateIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
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
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    padding: spacing.md,
    justifyContent: "center",
  },
  loadingPost: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  loadingHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  loadingLines: { flex: 1, gap: spacing.xs },
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
  // Inside a secure-entry row the border lives on the wrapper, not the input.
  inputBare: { flex: 1, borderWidth: 0 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.md,
    paddingRight: spacing.xs,
  },
  revealButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
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
    gap: spacing.sm,
  },
  addSchoolIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 44,
  },
});
