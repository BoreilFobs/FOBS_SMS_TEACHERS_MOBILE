import { FontAwesome } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import {
  DarkTheme as RouterDarkTheme,
  DefaultTheme as RouterDefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Platform, View, StyleSheet } from 'react-native';
import UpdateModal from "@/components/UpdateModal";
import SchoolsSync from "@/components/SchoolsSync";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider as AppThemeProvider } from "@/components/ThemeContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { UpdatesProvider } from "@/contexts/UpdatesContext";
import { ProfessionalProfileProvider } from "@/contexts/ProfessionalProfileContext";
import { SocialProvider } from "@/social/hooks/useSocial";
import { installWebAlertShim } from "@/utils/alertShim";
export { ErrorBoundary } from "expo-router";

// Runs at module evaluation, before any screen can raise a dialog.
installWebAlertShim();

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

  return (
    <AppThemeProvider>
      <LanguageProvider>
        <UpdatesProvider>
          <ProfessionalProfileProvider>
            <SocialProvider>
              <RootLayoutNav />
            </SocialProvider>
          </ProfessionalProfileProvider>
        </UpdatesProvider>
      </LanguageProvider>
    </AppThemeProvider>
  );
}

function RootLayoutNav() {
  const { resolvedTheme, colors } = useAppTheme();
  const theme =
    resolvedTheme === "dark" ? RouterDarkTheme : RouterDefaultTheme;
  const [, setUpdateRequired] = useState(false);

  const modifiedTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavigationThemeProvider value={modifiedTheme}>
      <View style={styles.root}>
        {/* Update Modal - will block navigation if update is required */}
        <UpdateModal onUpdateChecked={setUpdateRequired} />

        {/* Both sections read the school store, so it is synced once here. */}
        <SchoolsSync />
        
        {/* Web App Update Modal - only shows on web platform */}
        {/* <WebAppUpdateModal /> */}
        
        {/*
          Every screen renders its own in-app header (AppHeader / ScreenHeader),
          so the native navigation header stays off globally. Turning it on for
          a single screen would stack two headers on top of each other.
        */}
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="social" />
          <Stack.Screen name="schools/add" />
          <Stack.Screen name="schools/requests" />
          <Stack.Screen name="manage" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="settings/edit-profile" />
          <Stack.Screen name="settings/change-password" />
          <Stack.Screen name="support/help" />
          <Stack.Screen name="support/contact" />
          <Stack.Screen name="support/about" />
          <Stack.Screen name="attendance/students" />
          <Stack.Screen name="marks/classes" />
          <Stack.Screen name="marks/exams" />
          <Stack.Screen name="marks/students" />
          <Stack.Screen name="profile/public" />
          <Stack.Screen name="profile/edit/index" />
          <Stack.Screen name="profile/edit/[section]" />
          <Stack.Screen name="auth/index" options={{ animation: "fade" }} />
          <Stack.Screen name="auth/verify-email" />
          <Stack.Screen name="auth/account-help" />
          <Stack.Screen name="setup" options={{ animation: "fade" }} />
          <Stack.Screen name="index" options={{ animation: "fade" }} />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
      </View>
    </NavigationThemeProvider>
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
