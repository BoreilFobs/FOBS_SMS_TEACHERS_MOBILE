import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ColorValue, Platform, StyleSheet, View } from "react-native";
import AuthWrapper from "@/components/AuthWrapper";
import SetupWrapper from "@/components/SetupWrapper";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useUpdates } from "@/contexts/UpdatesContext";
import { radii } from "@/constants/theme";
import { useSchools } from "@/hooks/useSchools";
import useSchoolStore from "@/utils/stores/schoolStore";

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

export default function TabLayout() {
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const { unreadCount } = useUpdates();
  const { schoolData, loading: schoolsLoading } = useSchools();
  const setSchools = useSchoolStore((state) => state.setSchools);

  useEffect(() => {
    if (schoolsLoading) return;

    setSchools(
      schoolData.map((item) => ({
        id: item.school.id,
        name: item.school.name,
        code: item.school.acronym || item.school.code || "",
        logo: item.school.logo_url || undefined,
        address: item.school.address,
        phone: item.school.phone,
        email: item.school.email,
        academic_year: item.school.academic_year,
        academic_year_id: item.school.academic_year_id,
        status: "active" as const,
        pivot: {
          is_approved: Boolean(item.teacher_school.isActive),
          created_at: item.teacher_school.created_at,
        },
      })),
    );
  }, [schoolData, schoolsLoading, setSchools]);

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
            tabBarLabelStyle: {
              fontSize: 11,
              lineHeight: 15,
              fontWeight: "600",
            },
            tabBarItemStyle: { minHeight: 52 },
            sceneStyle: { backgroundColor: colors.background },
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: language === "fr" ? "Accueil" : "Home",
              tabBarIcon: (props) => (
                <TabIcon
                  {...props}
                  active="home"
                  outline="home-outline"
                />
              ),
            }}
          />
          <Tabs.Screen
            name="classes"
            options={{
              title: language === "fr" ? "Classes" : "Classes",
              tabBarIcon: (props) => (
                <TabIcon
                  {...props}
                  active="people"
                  outline="people-outline"
                />
              ),
            }}
          />
          <Tabs.Screen
            name="updates"
            options={{
              title: language === "fr" ? "Actualités" : "Updates",
              tabBarBadge: unreadCount > 0 ? Math.min(unreadCount, 99) : undefined,
              tabBarBadgeStyle: {
                backgroundColor: colors.error,
                color: "#FFFFFF",
                fontSize: 10,
                minWidth: 18,
                height: 18,
                borderRadius: radii.pill,
              },
              tabBarIcon: (props) => (
                <TabIcon
                  {...props}
                  active="notifications"
                  outline="notifications-outline"
                />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: language === "fr" ? "Profil" : "Profile",
              tabBarIcon: (props) => (
                <TabIcon
                  {...props}
                  active="person"
                  outline="person-outline"
                />
              ),
            }}
          />
          <Tabs.Screen name="subjects" options={{ href: null }} />
          <Tabs.Screen name="attendance" options={{ href: null }} />
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
