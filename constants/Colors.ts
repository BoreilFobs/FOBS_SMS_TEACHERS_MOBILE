import { themeColors } from "./theme";

const Colors = {
  light: {
    ...themeColors.light,
    card: themeColors.light.surface,
    tint: themeColors.light.primary,
    tabIconDefault: themeColors.light.textMuted,
  },
  dark: {
    ...themeColors.dark,
    card: themeColors.dark.surface,
    tint: themeColors.dark.primary,
    tabIconDefault: themeColors.dark.textMuted,
  },
};

export default Colors;
