import { useTheme } from "@/components/ThemeContext";
import { themeColors } from "@/constants/theme";

export function useAppTheme() {
  const context = useTheme();
  return {
    ...context,
    colors: themeColors[context.resolvedTheme],
    isDark: context.resolvedTheme === "dark",
  };
}

