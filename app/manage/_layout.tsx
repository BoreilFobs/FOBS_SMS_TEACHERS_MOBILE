import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ColorValue, Platform, StyleSheet, View } from "react-native";
import AuthWrapper from "@/components/AuthWrapper";
import SetupWrapper from "@/components/SetupWrapper";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/hooks/useAppTheme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  focused,
  color,
  active,
  outline,
}: {
  focused: boolean;
  color: ColorValue;
  active: IconName;
  outline: IconName;
}) {
  return (
    <View style={styles.iconContainer}>
      <Ionicons name={focused ? active : outline} size={23} color={color} />
    </View>
  );
}

/**
 * The school-management section. It carries its own tab bar so the social tabs
 * never leak into an academic screen — the two sections are separate contexts,
 * and each screen header offers a way back to the social feed.
 */
export default function ManageLayout() {
  const { colors } = useAppTheme();
  const { language } = useLanguage();

  const labels =
    language === "fr"
      ? {
          overview: "Classes",
          attendance: "Présences",
          marks: "Notes",
          reports: "Rapports",
        }
      : {
          overview: "Classes",
          attendance: "Attendance",
          marks: "Marks",
          reports: "Reports",
        };

  return (
    <AuthWrapper>
      <SetupWrapper>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarHideOnKeyboard: true,
            tabBarStyle: {
              height: Platform.OS === "ios" ? 84 : 70,
              paddingTop: 7,
              paddingBottom: Platform.OS === "ios" ? 22 : 9,
              backgroundColor: colors.tabBar,
              borderTopColor: colors.border,
              borderTopWidth: StyleSheet.hairlineWidth,
              elevation: 8,
            },
            tabBarLabelStyle: { fontSize: 11, lineHeight: 15, fontWeight: "600" },
            tabBarItemStyle: { minHeight: 52 },
            sceneStyle: { backgroundColor: colors.background },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: labels.overview,
              tabBarAccessibilityLabel: labels.overview,
              tabBarIcon: (props) => (
                <TabIcon {...props} active="layers" outline="layers-outline" />
              ),
            }}
          />
          <Tabs.Screen
            name="attendance"
            options={{
              title: labels.attendance,
              tabBarAccessibilityLabel: labels.attendance,
              tabBarIcon: (props) => (
                <TabIcon {...props} active="checkbox" outline="checkbox-outline" />
              ),
            }}
          />
          <Tabs.Screen
            name="marks"
            options={{
              title: labels.marks,
              tabBarAccessibilityLabel: labels.marks,
              tabBarIcon: (props) => (
                <TabIcon {...props} active="create" outline="create-outline" />
              ),
            }}
          />
          <Tabs.Screen
            name="reports"
            options={{
              title: labels.reports,
              tabBarAccessibilityLabel: labels.reports,
              tabBarIcon: (props) => (
                <TabIcon {...props} active="bar-chart" outline="bar-chart-outline" />
              ),
            }}
          />
        </Tabs>
      </SetupWrapper>
    </AuthWrapper>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    minWidth: 40,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
