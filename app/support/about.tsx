import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Linking
} from "react-native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { BlurView } from "expo-blur";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from 'expo-linear-gradient';

const appVersion = "1.2.0";
const features = [
  "Attendance tracking",
  "Class management",
  "Student progress reports",
  "Secure messaging",
  "Cloud storage for documents",
  "Multi-device sync"
];

export default function AboutScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <ImageBackground
      source={require("@/assets/images/auth-bg2.jpg")}
      style={styles.container}
      blurRadius={10}
    >
      <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={colorScheme} />
      <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={colorScheme} />
      
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <View style={[styles.header, { marginTop: StatusBar.currentHeight }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>About</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileCard, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}>
          <LinearGradient
            colors={[colors.primary + '40', colors.primary + '10']}
            style={styles.appIcon}
          >
            <Ionicons name="school" size={48} color={colors.primary} />
          </LinearGradient>
          <Text style={[styles.appName, { color: colors.text }]}>SchoolConnect</Text>
          <Text style={[styles.appVersion, { color: colors.textSecondary }]}>Version {appVersion}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Our Mission</Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            To empower educators with intuitive tools that simplify classroom management
            and enhance student engagement through technology.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Features</Text>
          <View style={styles.featuresList}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Legal</Text>
          <TouchableOpacity 
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://your-school.edu/privacy')}
          >
            <Text style={[styles.legalLinkText, { color: colors.primary }]}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://your-school.edu/terms')}
          >
            <Text style={[styles.legalLinkText, { color: colors.primary }]}>Terms of Service</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.footer, { borderColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            © 2023 Your School Name. All rights reserved.
          </Text>
        </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
  },
  featuresList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    marginLeft: 12,
  },
  legalLink: {
    paddingVertical: 12,
  },
  legalLinkText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    paddingTop: 20,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    opacity: 0.7,
  },
});