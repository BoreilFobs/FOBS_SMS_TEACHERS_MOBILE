export const palette = {
  blue50: "#EFF6FF",
  blue100: "#DBEAFE",
  blue500: "#2563EB",
  blue600: "#1D4ED8",
  blue300: "#93C5FD",
  slate950: "#0B1220",
  slate900: "#111827",
  slate800: "#1F2937",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748B",
  slate400: "#94A3B8",
  slate300: "#CBD5E1",
  slate200: "#E2E8F0",
  slate100: "#F1F5F9",
  slate50: "#F8FAFC",
  white: "#FFFFFF",
  green600: "#15803D",
  green400: "#4ADE80",
  amber700: "#B45309",
  amber400: "#FBBF24",
  red600: "#DC2626",
  red400: "#F87171",
  cyan700: "#0E7490",
  cyan300: "#67E8F9",
} as const;

export const themeColors = {
  light: {
    primary: palette.blue600,
    primaryPressed: "#1E40AF",
    primarySoft: palette.blue50,
    secondary: palette.cyan700,
    background: palette.slate50,
    surface: palette.white,
    surfaceElevated: palette.white,
    surfaceMuted: palette.slate100,
    text: palette.slate950,
    textSecondary: palette.slate600,
    textMuted: palette.slate500,
    border: palette.slate200,
    divider: palette.slate200,
    success: palette.green600,
    successSoft: "#ECFDF3",
    warning: palette.amber700,
    warningSoft: "#FFF7E6",
    error: palette.red600,
    errorSoft: "#FEF2F2",
    info: palette.blue600,
    infoSoft: palette.blue50,
    disabled: palette.slate300,
    disabledText: palette.slate500,
    overlay: "rgba(15, 23, 42, 0.55)",
    onPrimary: palette.white,
    tabBar: palette.white,
  },
  dark: {
    primary: palette.blue300,
    primaryPressed: "#BFDBFE",
    primarySoft: "#172554",
    secondary: palette.cyan300,
    background: palette.slate950,
    surface: "#141D2E",
    surfaceElevated: "#1B2638",
    surfaceMuted: palette.slate800,
    text: palette.slate50,
    textSecondary: palette.slate300,
    textMuted: palette.slate400,
    border: palette.slate700,
    divider: palette.slate700,
    success: palette.green400,
    successSoft: "#123524",
    warning: palette.amber400,
    warningSoft: "#3B2A0B",
    error: palette.red400,
    errorSoft: "#3B171B",
    info: palette.blue300,
    infoSoft: "#172554",
    disabled: palette.slate700,
    disabledText: palette.slate400,
    overlay: "rgba(2, 6, 23, 0.72)",
    onPrimary: palette.slate950,
    tabBar: "#141D2E",
  },
} as const;

export type AppThemeName = keyof typeof themeColors;
export type AppThemeColors = (typeof themeColors)[AppThemeName];

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: "700" as const },
  title: { fontSize: 24, lineHeight: 30, fontWeight: "700" as const },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: "700" as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: "600" as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: "500" as const },
} as const;

export const iconSizes = { sm: 16, md: 20, lg: 24, xl: 32 } as const;
export const touchTarget = { minHeight: 48, minWidth: 48 } as const;
export const motion = { fast: 140, normal: 220, slow: 320 } as const;

export const elevation = {
  card: {
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

