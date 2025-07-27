import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  StatusBar,
  Platform,
} from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { BlurView } from "expo-blur";
import { handleLogout } from '@/utils/auth';
import { Link, useRouter } from "expo-router";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  type SettingsItem = {
    title: string;
    icon: keyof typeof Feather.glyphMap;
    action: () => void;
  };

  const settingsOptions: Array<{
    title: string;
    icon: keyof typeof Feather.glyphMap;
    items: SettingsItem[];
  }> = [
    {
      title: "Account",
      icon: "user",
      items: [
        {
          title: "Edit Profile",
          icon: "edit",
          action: () => router.push('/settings/edit-profile'),
        },
        {
          title: "Change Password",
          icon: "lock",
          action: () => router.push('/settings/change-password'),
        },
      ],
    },
    {
      title: "Support",
      icon: "help-circle",
      items: [
        {
          title: "Help Center",
          icon: "help-circle",
          action: () => router.push('/support/help'),
        },
        {
          title: "Contact Us",
          icon: "mail",
          action: () => router.push('/support/contact'),
        },
        {
          title: "About",
          icon: "info",
          action: () => router.push('/support/about'),
        },
      ],
    },
  ];

  return (
    <ImageBackground
      source={require("@/assets/images/auth-bg2.jpg")}
      style={styles.container}
      blurRadius={10}
    >
      <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={colorScheme} />
      <BlurView intensity={Platform.OS == 'ios' ? 300 : 0} style={StyleSheet.absoluteFill} tint={colorScheme} />
      
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <View style={[styles.header, { marginTop: StatusBar.currentHeight }]}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Manage your account and preferences
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {settingsOptions.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name={section.icon} size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {section.title}
              </Text>
            </View>

            <View style={[styles.sectionContent, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}>
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
                  onPress={item.action}
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
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error + '50', borderColor: colors.error + '50' }]}
          onPress={() => handleLogout()}
        >
          <FontAwesome name="sign-out" size={18} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>
            Log Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
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
    borderWidth: 1,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
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
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});