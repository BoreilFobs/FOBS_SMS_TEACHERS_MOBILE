import { FontAwesome } from "@expo/vector-icons";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, Tabs } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { BlurView } from 'expo-blur';
import { Text, View } from 'react-native';
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import AuthWrapper from "@/components/AuthWrapper";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  const modifiedTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      primary: Colors[colorScheme ?? "light"].primary,
      background: Colors[colorScheme ?? "light"].background,
      card: Colors[colorScheme ?? "light"].card,
      text: Colors[colorScheme ?? "light"].text,
      border: Colors[colorScheme ?? "light"].border,
    },
  };

  return (
    <ThemeProvider value={modifiedTheme}>
      <Stack>
        {/* Main tabs (will appear in tab bar) */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        {/* Add School screen (won't appear in tab bar) */}
        <Stack.Screen
          name="schools/add"
          options={{
            title: "Add School",
            headerBackTitle: "Back",
            headerTintColor: modifiedTheme.colors.primary,
            headerStyle: {
              backgroundColor: modifiedTheme.colors.card,
            },
            headerTitleStyle: {
              fontWeight: "600",
            },
            presentation: "modal", // Optional: makes it slide up on iOS
            headerShown: false,
          }}
        />

        {/* Pending Requests screen (won't appear in tab bar) */}
        <Stack.Screen
          name="schools/requests"
          options={{
            title: "Pending Requests",
            headerBackTitle: "Back",
            headerTintColor: modifiedTheme.colors.primary,
          }}
        />

        <Stack.Screen
          name="subjects"
          options={{
            title: "",
            headerBackTitle: "Schools",
            headerTintColor: modifiedTheme.colors.primary,
          }}
        />

         <Stack.Screen
          name="settings"
          options={{
            title: "Settings",
            headerBackTitle: "Back",
            headerTintColor: modifiedTheme.colors.primary,
            headerStyle: {
              backgroundColor: modifiedTheme.colors.card,
            },
            headerTitleStyle: {
              fontWeight: "600",
            },
            presentation: "modal", // Optional: makes it slide up on iOS
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="marks/exams"
          options={{
            title: "",
            headerBackTitle: "Classes",
            headerTintColor: modifiedTheme.colors.primary,
          }}
        />

        <Stack.Screen
          name="settings/edit-profile"
          options={{
            title: "",
            headerBackTitle: "Classes",
            headerTintColor: modifiedTheme.colors.primary,
            headerShown: false,

          }}
        />

         <Stack.Screen
          name="settings/change-password"
          options={{
            title: "",
            headerBackTitle: "",
            headerTintColor: modifiedTheme.colors.primary,
            headerShown: false,

          }}
        />

         <Stack.Screen
          name="support/help"
          options={{
            title: "",
            headerBackTitle: "",
            headerTintColor: modifiedTheme.colors.primary,
            headerShown: false,

          }}
        />

         <Stack.Screen
          name="support/contact"
          options={{
            title: "",
            headerBackTitle: "",
            headerTintColor: modifiedTheme.colors.primary,
            headerShown: false,

          }}
        />

         <Stack.Screen
          name="support/about"
          options={{
            title: "",
            headerBackTitle: "",
            headerTintColor: modifiedTheme.colors.primary,
            headerShown: false,

          }}
        />

        <Stack.Screen
          name="attendance/students"
          options={{
            title: "Attendance",
            headerBackTitle: "Schools",
            headerTintColor: modifiedTheme.colors.primary,
          }}
        />
        

        <Stack.Screen
          name="marks/classes"
          options={{
            title: "",
            headerBackTitle: "subjects",
            headerTintColor: modifiedTheme.colors.primary,
          }}
        />

        <Stack.Screen
          name="marks/students"
          options={{
            title: "",
            headerBackTitle: "classes",
            headerTintColor: modifiedTheme.colors.primary,
          }}
        />

        <Stack.Screen
          name="auth/index"
          options={{
            title: "login",
            headerBackTitle: "login",
            headerTintColor: modifiedTheme.colors.primary,
            headerShown: false
          }}
        />

        <Stack.Screen
          name="setup"
          options={{
            title: "setup",
            headerBackTitle: "setup",
            headerTintColor: modifiedTheme.colors.primary,
            headerShown: false
          }}
        />

        <Stack.Screen
          name="index"
          options={{
            title: "index",
            headerBackTitle: "setup",
            headerTintColor: modifiedTheme.colors.primary,
            headerShown: false
          }}
        />

        {/* Other modal screens */}
        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
