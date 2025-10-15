import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ImageBackground,
  StatusBar,
  Platform,
  useColorScheme,
  Animated,
} from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { handleLogout } from '@/utils/auth';
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const withOpacity = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
      <BlurView intensity={Platform.OS === 'ios' ? 330 : 100} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
      
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <LinearGradient
        colors={
          colorScheme === 'dark'
            ? ['rgba(0,0,0,0.6)', 'transparent']
            : ['rgba(255,255,255,0.8)', 'transparent']
        }
        style={styles.headerGradient}
        pointerEvents="none"
      />

      <View style={[styles.header, { paddingTop: 10 }]}>
        {/* <Text style={[styles.title, { color: colors.text }]}>Settings</Text> */}
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
              <LinearGradient
                colors={
                  colorScheme === 'dark'
                    ? [withOpacity(colors.primary, 0.2), withOpacity(colors.primary, 0.05)]
                    : [withOpacity(colors.primary, 0.15), withOpacity(colors.primary, 0.08)]
                }
                style={styles.sectionIconContainer}
              >
                <Feather name={section.icon} size={18} color={colors.primary} />
              </LinearGradient>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {section.title}
              </Text>
            </View>

            <BlurView
              intensity={Platform.OS === 'ios' ? 12 : 100}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={[
                styles.sectionContent,
                {
                  backgroundColor: colorScheme === 'dark' 
                    ? withOpacity(colors.card, 0.6)
                    : withOpacity(colors.card, 0.85),
                  borderColor: colorScheme === 'dark'
                    ? withOpacity(colors.border, 0.3)
                    : withOpacity(colors.border, 0.5),
                }
              ]}
            >
              {section.items.map((item, itemIndex) => (
                <Pressable
                  key={itemIndex}
                  style={[
                    styles.option,
                    itemIndex !== section.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: withOpacity(colors.border, 0.3),
                    },
                  ]}
                  onPress={item.action}
                  android_ripple={{ color: withOpacity(colors.primary, 0.12) }}
                >
                  <View style={styles.optionLeft}>
                    <View style={[styles.optionIconContainer, { backgroundColor: withOpacity(colors.primary, 0.1) }]}>
                      <Feather
                        name={item.icon}
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={[styles.optionText, { color: colors.text }]}>
                      {item.title}
                    </Text>
                  </View>
                  <View style={[styles.chevronContainer, { backgroundColor: withOpacity(colors.primary, 0.08) }]}>
                    <Feather
                      name="chevron-right"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                </Pressable>
              ))}
            </BlurView>
          </View>
        ))}

        <Pressable
          style={[
            styles.logoutButton,
            {
              backgroundColor: withOpacity(colors.error, 0.15),
              borderColor: withOpacity(colors.error, 0.3),
            }
          ]}
          onPress={() => handleLogout()}
          android_ripple={{ color: withOpacity(colors.error, 0.2) }}
        >
          <LinearGradient
            colors={[withOpacity(colors.error, 0.08), withOpacity(colors.error, 0.02)]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.logoutIconContainer, { backgroundColor: withOpacity(colors.error, 0.15) }]}>
            <FontAwesome name="sign-out" size={18} color={colors.error} />
          </View>
          <Text style={[styles.logoutText, { color: colors.error }]}>
            Log Out
          </Text>
        </Pressable>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    zIndex: 2,
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
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  chevronContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
    overflow: 'hidden',
  },
  logoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});