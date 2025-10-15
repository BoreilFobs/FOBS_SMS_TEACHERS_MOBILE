import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Linking,
  useColorScheme,
  Platform
} from "react-native";
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { BlurView } from "expo-blur";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from 'expo-linear-gradient';

const features = [
  {
    title: "AI-Powered Management",
    icon: "robot",
    description: "Leverage artificial intelligence for student registration, timetable generation, and predictive analytics"
  },
  {
    title: "Comprehensive Student Tracking",
    icon: "user-graduate",
    description: "Manage the complete student lifecycle from admission to graduation"
  },
  {
    title: "Smart Attendance",
    icon: "user-check",
    description: "Automated attendance tracking with real-time notifications"
  },
  {
    title: "Automated Grading",
    icon: "clipboard-check",
    description: "Flexible grading system with performance analytics"
  },
  {
    title: "Parent Communication",
    icon: "comments",
    description: "Integrated portal for parent-teacher communication"
  },
  {
    title: "Mobile Access",
    icon: "mobile-alt",
    description: "Full functionality available on mobile devices"
  }
];

const teamMembers = [
  {
    name: "Boreil Fobasso",
    role: "Web & Mobile dev AI engineer",
    bio: "Boreil is a full-stack developer with a passion for AI and education technology. He leads the development of our mobile applications.",
  },
];

export default function AboutScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const openWebsite = () => {
    Linking.openURL('https://your-school.edu');
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://your-school.edu/privacy');
  };

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

      <View style={[styles.header, { marginTop: StatusBar.currentHeight }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>About FOBS SMS</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Introduction */}
        <View style={[styles.card, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}>
          <LinearGradient
            colors={[colors.primary + '40', colors.primary + '10']}
            style={styles.appIcon}
          >
            <Ionicons name="school" size={48} color={colors.primary} />
          </LinearGradient>
          <Text style={[styles.appName, { color: colors.text }]}>FOBS SMS</Text>
          <Text style={[styles.appVersion, { color: colors.textSecondary }]}>Version 1.0.0</Text>
          <Text style={[styles.appDescription, { color: colors.textSecondary }]}>
            The Future of School Management powered by AI and modern technology
          </Text>
        </View>

        {/* Mission Statement */}
        <View style={[styles.card, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Our Mission</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            To revolutionize school administration through intelligent automation, data-driven insights, 
            and seamless communication between educators, students, and parents.
          </Text>
        </View>

        {/* Key Features */}
        <View style={[styles.card, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Features</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                  <FontAwesome5 name={feature.icon} size={20} color={colors.primary} />
                </View>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Development Team */}
        <View style={[styles.card, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Development Team</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Our team combines expertise in education, artificial intelligence, and software development 
            to create solutions that truly meet the needs of modern schools.
          </Text>
          
          {teamMembers.map((member, index) => (
            <View key={index} style={styles.teamMember}>
              <View style={[styles.teamPhoto, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="person" size={32} color={colors.primary} />
              </View>
              <View style={styles.teamInfo}>
                <Text style={[styles.teamName, { color: colors.text }]}>{member.name}</Text>
                <Text style={[styles.teamRole, { color: colors.primary }]}>{member.role}</Text>
                <Text style={[styles.teamBio, { color: colors.textSecondary }]}>{member.bio}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Legal Links */}
        <View style={[styles.card, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Legal Information</Text>
          <TouchableOpacity 
            style={styles.legalLink}
            onPress={openPrivacyPolicy}
          >
            <Text style={[styles.legalLinkText, { color: colors.primary }]}>Privacy Policy</Text>
            <Feather name="external-link" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.legalLink}
            onPress={openWebsite}
          >
            <Text style={[styles.legalLinkText, { color: colors.primary }]}>Visit Our Website</Text>
            <Feather name="external-link" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            © {new Date().getFullYear()} FOBS SMS. All rights reserved.
          </Text>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Version 1.0.0 (Build 01)
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
    paddingBottom: 100,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  featureCard: {
    width: '48%',
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 13,
    lineHeight: 18,
  },
  teamMember: {
    flexDirection: 'row',
    marginTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  teamPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  teamRole: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  teamBio: {
    fontSize: 13,
    lineHeight: 18,
  },
  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  legalLinkText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    marginBottom: 4,
  },
});