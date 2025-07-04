import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Link } from "expo-router";
import { handleLogout } from '@/utils/auth';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === "dark");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // In a real app, you would update the app's theme here
  };

  type SettingsItem = {
    title: string;
    icon: keyof typeof Feather.glyphMap;
  } & (
    | { action: () => void; component?: never }
    | { component: React.ReactElement; action?: never }
  );

  const settingsOptions: Array<{
    title: string;
    icon: keyof typeof Feather.glyphMap;
    items: SettingsItem[];
  }> = [
    {
      title: "Account",
      icon: "user" as const,
      items: [
        {
          title: "Edit Profile",
          icon: "edit",
          action: () => console.log("Navigate to edit profile"),
        },
        {
          title: "Change Password",
          icon: "lock",
          action: () => console.log("Navigate to change password"),
        },
      ],
    },
    {
      title: "Preferences",
      icon: "settings" as const,
      items: [
        {
          title: "Dark Mode",
          icon: "moon",
          component: (
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.card}
            />
          ),
        },
        {
          title: "Notifications",
          icon: "bell",
          component: (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.card}
            />
          ),
        },
        {
          title: "Biometric Login",
          icon: "key",
          component: (
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.card}
            />
          ),
        },
      ],
    },
    {
      title: "Support",
      icon: "help-circle" as const,
      items: [
        {
          title: "Help Center",
          icon: "help-circle",
          action: () => console.log("Navigate to help center"),
        },
        {
          title: "Contact Us",
          icon: "mail",
          action: () => console.log("Navigate to contact us"),
        },
        {
          title: "About",
          icon: "info",
          action: () => console.log("Navigate to about"),
        },
      ],
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      {settingsOptions.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name={section.icon} size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {section.title}
            </Text>
          </View>

          <View
            style={[styles.sectionContent, { backgroundColor: colors.card }]}
          >
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.option,
                  itemIndex !== section.items.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
                onPress={item?.action}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <Feather
                    name={item.icon}
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.optionText, { color: colors.text }]}>
                    {item.title}
                  </Text>
                </View>

                {item.component ? (
                  item.component
                ) : (
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.textSecondary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.error + "20" }]}
        onPress={() => handleLogout()}
      >
        <FontAwesome name="sign-out" size={20} color={colors.error} />
        <Text style={[styles.logoutText, { color: colors.error }]}>
          Log Out
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
    marginTop: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionContent: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
