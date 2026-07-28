import { FontAwesome } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { BlurView } from 'expo-blur';
import { Platform, Text, View, StyleSheet, useColorScheme } from 'react-native';
// import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import AuthWrapper from "@/components/AuthWrapper";
import UpdateModal from "@/components/UpdateModal";
import WebAppUpdateModal from "@/components/WebAppUpdateModal";
import { LanguageProvider } from "@/contexts/LanguageContext";
if (Platform.OS === 'web') {
  
}
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
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const [updateRequired, setUpdateRequired] = useState(false);

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
    <LanguageProvider>
    <ThemeProvider value={modifiedTheme}>
      <View style={styles.root}>
        {/* Update Modal - will block navigation if update is required */}
        <UpdateModal onUpdateChecked={setUpdateRequired} />
        
        {/* Web App Update Modal - only shows on web platform */}
        {/* <WebAppUpdateModal /> */}
        
        <Stack>
          {/* Main tabs (will appear in tab bar) */}
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              presentation: 'card'
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
              headerShown: Platform.OS === "ios" ? false : true,
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
              title: Platform.OS === "ios" ? "" : "Subjects",
              headerBackTitle: "Schools",
              headerTintColor: modifiedTheme.colors.primary,
              presentation: 'card'
            }}
          />

          <Stack.Screen
            name="settings"
            options={{
              title: Platform.OS === "ios" ? "" : "Settings",
              headerBackTitle: "Back",
              headerTintColor: modifiedTheme.colors.primary,
              headerStyle: {
                backgroundColor: modifiedTheme.colors.card,
              },
              headerTitleStyle: {
                fontWeight: "600",
              },
              presentation: "modal", // Optional: makes it slide up on iOS
              headerShown: Platform.OS === "ios" ? false : true,
            }}
          />

          <Stack.Screen
            name="marks/exams"
            options={{
              title: Platform.OS === "ios" ? "" : "Exams",
              headerBackTitle: "Classes",
              headerTintColor: modifiedTheme.colors.primary,
              presentation: 'card'
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
              title: Platform.OS === "ios" ? "" : "Help",
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
            name="reports/index"
            options={{
              title: "Reports",
              headerBackTitle: "Back",
              headerTintColor: modifiedTheme.colors.primary,
              headerShown: false,
              presentation: 'card'
            }}
          />

          <Stack.Screen
            name="attendance/students"
            options={{
              title: "Attendance",
              headerBackTitle: "Schools",
              headerTintColor: modifiedTheme.colors.primary,
              presentation: 'card'
            }}
          />
          

          <Stack.Screen
            name="marks/classes"
            options={{
              title: Platform.OS === "ios" ? "" : "Classes",
              headerBackTitle: "subjects",
              headerTintColor: modifiedTheme.colors.primary,
              presentation: 'card'
            }}
          />

          <Stack.Screen
            name="marks/students"
            options={{
              title: Platform.OS === "ios" ? "" : "Students",
              headerBackTitle: "classes",
              headerTintColor: modifiedTheme.colors.primary,
              presentation: 'card'
            }}
          />

          <Stack.Screen
            name="auth/index"
            options={{
              title: "login",
              headerBackTitle: "login",
              headerTintColor: modifiedTheme.colors.primary,
              headerShown: false,
              presentation: 'card'
            }}
          />

          <Stack.Screen
            name="setup"
            options={{
              title: "setup",
              headerBackTitle: "setup",
              headerTintColor: modifiedTheme.colors.primary,
              headerShown: false,
              presentation: 'card'
            }}
          />

          <Stack.Screen
            name="index"
            options={{
              title: "",
              headerBackTitle: "",
              headerTintColor: modifiedTheme.colors.primary,
              headerShown: false,
              presentation: 'card'
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
      </View>
    </ThemeProvider>
    </LanguageProvider>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      position: 'fixed' as any,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw' as any,
      height: '100vh' as any,
    }),
  },
});
