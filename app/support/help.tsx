import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Linking,
  Platform,
  useColorScheme
} from "react-native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
// import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { BlurView } from "expo-blur";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from 'expo-linear-gradient';

const helpTopics = [
  {
    title: "Getting Started",
    icon: "rocket",
    items: [
      "How to set up your profile",
      "Navigating the app",
      "Understanding your dashboard"
    ]
  },
  {
    title: "Attendance",
    icon: "calendar",
    items: [
      "Taking attendance",
      "Correcting attendance mistakes",
      "Viewing attendance reports"
    ]
  },
  // {
  //   title: "Classes & Subjects",
  //   icon: "book",
  //   items: [
  //     "Adding new classes",
  //     "Managing your subjects",
  //     "Student enrollment"
  //   ]
  // },
  {
    title: "Account Settings",
    icon: "settings",
    items: [
      "Updating your profile",
      "Changing your password",
      "Notification preferences"
    ]
  }
];

export default function HelpCenterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const openFAQ = () => {
    Linking.openURL('https://your-school.edu/faq');
  };

  return (
    <ImageBackground
      source={require("@/assets/images/auth-bg2.jpg")}
      style={styles.container}
      blurRadius={10}
    >
      <BlurView intensity={330} style={StyleSheet.absoluteFill} tint={colorScheme} />
      <BlurView intensity={Platform.OS == 'ios' ? 330 : 0} style={StyleSheet.absoluteFill} tint={colorScheme} />
      
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <View style={[styles.header, { marginTop: StatusBar.currentHeight }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Help Center</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Find answers to common questions
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <Text style={[styles.searchText, { color: colors.textSecondary }]}>
              Search help articles...
            </Text>
          </View>
        </View>

        {helpTopics.map((topic, index) => (
          <View key={index} style={[styles.topicCard, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}>
            <View style={styles.topicHeader}>
              <Feather name={topic.icon} size={24} color={colors.primary} />
              <Text style={[styles.topicTitle, { color: colors.text }]}>{topic.title}</Text>
            </View>
            <View style={styles.topicItems}>
              {topic.items.map((item, itemIndex) => (
                <TouchableOpacity 
                  key={itemIndex} 
                  style={[styles.topicItem, itemIndex !== topic.items.length - 1 && { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.topicItemText, { color: colors.text }]}>{item}</Text>
                  <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity 
          style={[styles.faqButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
          onPress={openFAQ}
        >
          <MaterialIcons name="help-center" size={24} color={colors.primary} />
          <Text style={[styles.faqButtonText, { color: colors.primary }]}>Visit Full FAQ Website</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  searchText: {
    marginLeft: 12,
    fontSize: 16,
  },
  topicCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  topicItems: {
    paddingHorizontal: 8,
  },
  topicItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  topicItemText: {
    fontSize: 16,
    flex: 1,
    marginRight: 12,
  },
  faqButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
    gap: 12,
  },
  faqButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});