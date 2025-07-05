import React from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import AuthWrapper from "@/components/AuthWrapper";
import { BlurView } from "expo-blur";
import { StyleSheet, View } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const currentColors = Colors[colorScheme ?? "light"];

  return (
    <AuthWrapper>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: currentColors.tint,
          tabBarInactiveTintColor: currentColors.tabIconDefault,
          tabBarStyle: { 
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            height: 80,
          },
          tabBarBackground: () => (
            <BlurView 
              intensity={80}
              tint={colorScheme}
              style={StyleSheet.absoluteFill}
            />
          ), 
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginBottom: 4,
          },
          headerShown: false,
        }}
      >
          <Tabs.Screen
            name="index"
            options={{
              title: "home",
              tabBarIcon: ({ color }) => (
                <Feather name="home" size={24} color={color} />
              ),
            }}
          />
         <Tabs.Screen
            name="submit"
            options={{
              title: "Submit",
              tabBarIcon: ({ color }) => (
                <Feather name="upload" size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: "settings",
              tabBarIcon: ({ color }) => (
                <Feather name="settings" size={24} color={color} />
              ),
            }}
         />
      </Tabs>
    </AuthWrapper>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  
});