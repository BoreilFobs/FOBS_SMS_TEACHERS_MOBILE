import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ColorValue, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import AuthWrapper from "@/components/AuthWrapper";
import SetupWrapper from "@/components/SetupWrapper";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { spacing } from "@/constants/theme";
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
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
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
            tabBarLabelStyle: { fontSize: 11, lineHeight: 15, fontWeight: "600" },
            tabBarItemStyle: { minHeight: 52 },
            sceneStyle: { backgroundColor: colors.background },
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: t("home"),
              tabBarAccessibilityLabel: t("home"),
              tabBarIcon: (props) => (
                <TabIcon {...props} active="home" outline="home-outline" />
              ),
            }}
          />
          <Tabs.Screen
            name="network"
            options={{
              title: t("network"),
              tabBarAccessibilityLabel: t("network"),
              tabBarIcon: (props) => (
                <TabIcon {...props} active="people" outline="people-outline" />
              ),
            }}
          />
          <Tabs.Screen
            name="create"
            options={{
              title: t("create"),
              tabBarAccessibilityLabel: t("create"),
              tabBarButton: () => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("create")}
                  onPress={() => router.push("/social/compose")}
                  style={styles.createWrap}
                >
                  <View
                    style={[
                      styles.createButton,
                      {
                        backgroundColor: colors.primary,
                        borderColor: colors.tabBar,
                      },
                    ]}
                  >
                    <Ionicons name="add" size={30} color={colors.onPrimary} />
                  </View>
                  <Text style={[styles.createLabel, { color: colors.textMuted }]}>
                    {t("create")}
                  </Text>
                </Pressable>
              ),
            }}
          />
          <Tabs.Screen
            name="jobs"
            options={{
              title: t("jobs"),
              tabBarAccessibilityLabel: t("jobs"),
              tabBarIcon: (props) => (
                <TabIcon {...props} active="briefcase" outline="briefcase-outline" />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: t("profile"),
              tabBarAccessibilityLabel: t("profile"),
              tabBarIcon: (props) => (
                <TabIcon {...props} active="person" outline="person-outline" />
              ),
            }}
          />
          <Tabs.Screen name="classes" options={{ href: null }} />
          <Tabs.Screen name="updates" options={{ href: null }} />
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
  createWrap: {
    flex: 1,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: -19,
  },
  createButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  createLabel: { fontSize: 11, fontWeight: "600", marginTop: spacing.xxs },
});
