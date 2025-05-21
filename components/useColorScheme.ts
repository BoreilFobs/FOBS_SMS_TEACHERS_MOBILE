import { useColorScheme as _useColorScheme } from "react-native";

export function useColorScheme() {
  const colorScheme = _useColorScheme();
  return colorScheme === "dark" ? "dark" : "light";
}
