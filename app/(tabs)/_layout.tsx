import React from "react";
import { Tabs } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import AuthWrapper from "@/components/AuthWrapper";
import SetupWrapper from "@/components/SetupWrapper";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useLanguage } from "@/contexts/LanguageContext";


export default function TabLayout() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const currentColors = Colors[colorScheme ?? "light"];
  const { language } = useLanguage();
  
  return (
    <AuthWrapper>
      <SetupWrapper>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: currentColors.tint,
          tabBarInactiveTintColor: currentColors.tabIconDefault,
          tabBarStyle: { 
            marginBottom: Platform.OS === 'web' ? 50 : 0,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            height: 85,
            paddingTop: 8,
          },
          tabBarBackground: () => (
            <BlurView 
              intensity={Platform.OS === 'ios' ? 100 : 140}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ), 
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginBottom: Platform.OS === 'ios' ? 0 : 8,
          },
          headerShown: false,
        }}
      >
          {/* Home Tab - Dashboard */}
          <Tabs.Screen
            name="home"
            options={{
              title: language === 'fr' ? 'Accueil' : 'Home',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name={focused ? "home" : "home-outline"} 
                    size={24} 
                    color={color} 
                  />
                  {focused && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
                </View>
              ),
            }}
          />

          {/* Marks Tab */}
          <Tabs.Screen
            name="subjects"
            options={{
              title: language === 'fr' ? 'Notes' : 'Marks',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.iconContainer}>
                  <Feather 
                    name="edit-3" 
                    size={22} 
                    color={color} 
                  />
                  {focused && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
                </View>
              ),
            }}
          />

          {/* Attendance Tab */}
          <Tabs.Screen
            name="attendance"
            options={{
              title: language === 'fr' ? 'Présences' : 'Attendance',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name={focused ? "checkmark-circle" : "checkmark-circle-outline"} 
                    size={24} 
                    color={color} 
                  />
                  {focused && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
                </View>
              ),
            }}
          />

          {/* Profile Tab */}
          <Tabs.Screen
            name="profile"
            options={{
              title: language === 'fr' ? 'Profil' : 'Profile',
              tabBarIcon: ({ color, focused }) => (
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name={focused ? "person" : "person-outline"} 
                    size={24} 
                    color={color} 
                  />
                  {focused && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
                </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  activeIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 4,
  },
});