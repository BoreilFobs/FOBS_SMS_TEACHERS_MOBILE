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
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { BlurView } from "expo-blur";
import { StatusBar } from "expo-status-bar";

const contactMethods = [
  {
    title: "Email Support",
    icon: "email",
    description: "Get direct help from our support team",
    action: () => Linking.openURL('mailto:fobsboreil@gmail.com')
  },
  {
    title: "Live Chat",
    icon: "chat-processing",
    description: "Chat with us in real-time (9am-5pm)",
    action: () => console.log("Open live chat")
  },
  {
    title: "Phone Support",
    icon: "phone",
    description: "Call us at +237-690-383-299",
    action: () => Linking.openURL('tel:+237690383299')
  },
  {
    title: "Visit Office",
    icon: "office-building",
    description: "Yaounde, Cameroon",
    action: () => Linking.openURL('https://maps.google.com')
  }
];

export default function ContactUsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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
          <Text style={[styles.title, { color: colors.text }]}>Contact Us</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          We're here to help with any questions
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>How can we help you?</Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            Choose the most convenient way to contact our support team.
          </Text>
        </View>

        {contactMethods.map((method, index) => (
          <TouchableOpacity 
            key={index} 
            style={[styles.contactCard, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}
            onPress={method.action}
          >
            <View style={styles.contactIcon}>
              <MaterialCommunityIcons 
                name={method.icon} 
                size={28} 
                color={colors.primary} 
              />
            </View>
            <View style={styles.contactText}>
              <Text style={[styles.contactTitle, { color: colors.text }]}>{method.title}</Text>
              <Text style={[styles.contactDesc, { color: colors.textSecondary }]}>{method.description}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}

        <View style={[styles.socialCard, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}>
          <Text style={[styles.socialTitle, { color: colors.text }]}>Connect With Us</Text>
          <View style={styles.socialIcons}>
            <TouchableOpacity 
              style={[styles.socialIcon, { backgroundColor: colors.primary + '20' }]}
              onPress={() => Linking.openURL('https://facebook.com/BoreilFobs')}
            >
              <Ionicons name="logo-facebook" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.socialIcon, { backgroundColor: colors.primary + '20' }]}
              onPress={() => Linking.openURL('https://wa.me/237690383299')}
            >
              <Ionicons name="logo-whatsapp" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.socialIcon, { backgroundColor: colors.primary + '20' }]}
              onPress={() => Linking.openURL('https://github.com/BoreilFobs')}
            >
              <Ionicons name="logo-github" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 35
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
    paddingBottom: 100,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
  },
  contactCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    marginRight: 16,
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactDesc: {
    fontSize: 14,
    opacity: 0.8,
  },
  socialCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginTop: 20,
  },
  socialTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});