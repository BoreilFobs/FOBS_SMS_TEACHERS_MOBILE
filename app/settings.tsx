import React, { useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AuthWrapper from "@/components/AuthWrapper";
import {
  AppHeader,
  Button,
  Card,
  FilterChips,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { handleLogout } from "@/utils/auth";
import Config from "@/constants/Config";
import { radii, spacing, typography } from "@/constants/theme";
import type { ThemeType } from "@/components/ThemeContext";

export default function SettingsRoute() {
  return (
    <AuthWrapper>
      <SettingsScreen />
    </AuthWrapper>
  );
}

function SettingsScreen() {
  const router = useRouter();
  const { colors, theme, setTheme } = useAppTheme();
  const { language, setLanguage } = useLanguage();
  const [loggingOut, setLoggingOut] = useState(false);

  const copy =
    language === "fr"
      ? {
          title: "Paramètres",
          subtitle: "Compte, préférences et assistance",
          preferences: "Préférences",
          language: "Langue",
          appearance: "Apparence",
          system: "Système",
          light: "Clair",
          dark: "Sombre",
          account: "Compte",
          profile: "Informations personnelles",
          profileHelp: "Mettre à jour les données existantes du compte",
          password: "Changer le mot de passe",
          passwordHelp: "Sécurité du compte",
          notifications: "Notifications",
          notificationsHelp: "Consulter les alertes et informations",
          support: "Assistance",
          help: "Aide et FAQ",
          about: "À propos de FobsSMS",
          logout: "Se déconnecter",
          logoutTitle: "Se déconnecter ?",
          logoutMessage: "Vous devrez vous reconnecter pour continuer.",
          cancel: "Annuler",
        }
      : {
          title: "Settings",
          subtitle: "Account, preferences, and support",
          preferences: "Preferences",
          language: "Language",
          appearance: "Appearance",
          system: "System",
          light: "Light",
          dark: "Dark",
          account: "Account",
          profile: "Personal details",
          profileHelp: "Update existing account information",
          password: "Change password",
          passwordHelp: "Account security",
          notifications: "Notifications",
          notificationsHelp: "View alerts and information",
          support: "Support",
          help: "Help and FAQ",
          about: "About FobsSMS",
          logout: "Log out",
          logoutTitle: "Log out?",
          logoutMessage: "You’ll need to sign in again to continue.",
          cancel: "Cancel",
        };

  const logout = async () => {
    setLoggingOut(true);
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        await fetch(`${Config.apiBaseUrl}/logout`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Local sign-out must still be possible when offline.
    } finally {
      setLoggingOut(false);
      handleLogout();
    }
  };

  const confirmLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm(copy.logoutMessage)) void logout();
      return;
    }
    Alert.alert(copy.logoutTitle, copy.logoutMessage, [
      { text: copy.cancel, style: "cancel" },
      { text: copy.logout, style: "destructive", onPress: () => void logout() },
    ]);
  };

  return (
    <Screen scroll bottomInset={false}>
      <AppHeader
        title={copy.title}
        subtitle={copy.subtitle}
        onBack={() => router.back()}
      />
      <SectionHeader title={copy.preferences} />
      <Card>
        <View style={styles.preference}>
          <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="language-outline" size={21} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>
              {copy.language}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              English / Français
            </Text>
          </View>
          <FilterChips
            options={[
              { value: "en", label: "EN" },
              { value: "fr", label: "FR" },
            ]}
            selected={language}
            onSelect={(value) => void setLanguage(value)}
          />
        </View>
      </Card>
      <Card>
        <View style={styles.stack}>
          <View style={styles.preference}>
            <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="contrast-outline" size={21} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>
                {copy.appearance}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {copy.system} / {copy.light} / {copy.dark}
              </Text>
            </View>
          </View>
          <FilterChips
            options={[
              { value: "system", label: copy.system },
              { value: "light", label: copy.light },
              { value: "dark", label: copy.dark },
            ]}
            selected={theme}
            onSelect={(value: ThemeType) => void setTheme(value)}
          />
        </View>
      </Card>

      <SectionHeader title={copy.account} />
      <SettingLink
        icon="person-outline"
        title={copy.profile}
        subtitle={copy.profileHelp}
        onPress={() => router.push("/settings/edit-profile")}
      />
      <SettingLink
        icon="lock-closed-outline"
        title={copy.password}
        subtitle={copy.passwordHelp}
        onPress={() => router.push("/settings/change-password")}
      />
      <SettingLink
        icon="notifications-outline"
        title={copy.notifications}
        subtitle={copy.notificationsHelp}
        onPress={() => router.push("/(tabs)/updates?tab=notifications")}
      />

      <SectionHeader title={copy.support} />
      <SettingLink
        icon="help-circle-outline"
        title={copy.help}
        onPress={() => router.push("/support/help")}
      />
      <SettingLink
        icon="information-circle-outline"
        title={copy.about}
        subtitle={`Version ${Config.appVersion}`}
        onPress={() => router.push("/support/about")}
      />
      <Button
        label={copy.logout}
        icon="log-out"
        variant="danger"
        loading={loggingOut}
        onPress={confirmLogout}
      />
    </Screen>
  );
}

function SettingLink({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Card onPress={onPress}>
      <View style={styles.preference}>
        <View style={[styles.icon, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name={icon} size={21} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Feather name="chevron-right" size={19} color={colors.textMuted} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  preference: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  stack: { gap: spacing.sm },
});
