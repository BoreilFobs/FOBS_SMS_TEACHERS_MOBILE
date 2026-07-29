// components/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeType = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => Promise<void>;
  resolvedTheme: "light" | "dark";
  isReady: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: async () => {},
  resolvedTheme: "light",
  isReady: false,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemTheme = useSystemColorScheme() === "dark" ? "dark" : "light";
  const [theme, setTheme] = useState<ThemeType>("system");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("userTheme");
        if (
          savedTheme === "light" ||
          savedTheme === "dark" ||
          savedTheme === "system"
        ) {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error("Failed to load theme", error);
      } finally {
        setIsReady(true);
      }
    };

    loadTheme();
  }, []);

  const handleSetTheme = async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem("userTheme", newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error("Failed to save theme", error);
    }
  };

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: handleSetTheme,
        resolvedTheme,
        isReady,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
