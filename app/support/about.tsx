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
  Platform,
  Dimensions
} from "react-native";
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { BlurView } from "expo-blur";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { useLanguage } from "@/contexts/LanguageContext";
import Config from "@/constants/Config";

const { width } = Dimensions.get('window');

const features = [
  {
    title: "Marks Entry",
    titleFr: "Saisie des notes",
    icon: "edit",
    description: "Quick and easy marks entry for all your subjects and classes",
    descriptionFr: "Saisie rapide et facile des notes pour tous vos cours et classes"
  },
  {
    title: "Attendance Tracking",
    titleFr: "Suivi des présences",
    icon: "calendar-check",
    description: "Take attendance effortlessly with real-time sync across devices",
    descriptionFr: "Prenez les présences facilement avec synchronisation en temps réel"
  },
  {
    title: "Performance Reports",
    titleFr: "Rapports de performance",
    icon: "chart-line",
    description: "View detailed analytics and reports for your students' progress",
    descriptionFr: "Consultez des analyses détaillées des progrès de vos élèves"
  },
  {
    title: "Multi-School Support",
    titleFr: "Multi-écoles",
    icon: "school",
    description: "Manage classes across multiple schools from one account",
    descriptionFr: "Gérez vos cours dans plusieurs écoles depuis un seul compte"
  },
  {
    title: "Offline Mode",
    titleFr: "Mode hors-ligne",
    icon: "wifi-off",
    description: "Work offline and sync when connected to the internet",
    descriptionFr: "Travaillez hors ligne et synchronisez une fois connecté"
  },
  {
    title: "Bilingual Support",
    titleFr: "Support bilingue",
    icon: "language",
    description: "Full English and French language support for all features",
    descriptionFr: "Support complet en anglais et français pour toutes les fonctionnalités"
  }
];

export default function AboutScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { language } = useLanguage();

  const openPortfolio = () => {
    Linking.openURL('https://fobs.dev');
  };

  const openWebsite = () => {
    Linking.openURL('https://fobssms.com');
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://fobssms.com/privacy');
  };

  const callDeveloper = () => {
    Linking.openURL('tel:+237671820738');
  };

  const emailDeveloper = () => {
    Linking.openURL('mailto:fobsboreil@gmail.com');
  };

  const openWhatsApp = () => {
    Linking.openURL('https://wa.me/237671820738');
  };

  return (
    <ImageBackground
      source={require("@/assets/images/auth-bg2.jpg")}
      style={styles.container}
      blurRadius={10}
    >
      <BlurView 
        intensity={Platform.OS === 'ios' ? 80 : 100} 
        style={StyleSheet.absoluteFill} 
        tint={colorScheme === 'dark' ? 'dark' : 'light'} 
      />
      
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.card + 'CC' }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {language === 'fr' ? 'À propos' : 'About'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Hero Section */}
        <View style={[styles.heroCard, { backgroundColor: colors.card + 'E6' }]}>
          <LinearGradient
            colors={[colors.primary, colors.tint]}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.appIconGradient}
          >
            <Ionicons name="school" size={44} color="white" />
          </LinearGradient>
          <Text style={[styles.appName, { color: colors.text }]}>FOBS SMS Teachers</Text>
          <View style={[styles.versionBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.versionText, { color: colors.primary }]}>
              v{Config.appVersion || '1.0.0'}
            </Text>
          </View>
          <Text style={[styles.appTagline, { color: colors.textSecondary }]}>
            {language === 'fr' 
              ? "Simplifiez votre vie d'enseignant"
              : "Simplify your teaching life"
            }
          </Text>
        </View>

        {/* Description */}
        <View style={[styles.descriptionCard, { backgroundColor: colors.card + 'E6' }]}>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            {language === 'fr' 
              ? "L'application FOBS SMS Teachers est conçue pour aider les enseignants à gérer leurs classes, suivre les performances des élèves et simplifier les tâches administratives quotidiennes."
              : "The FOBS SMS Teachers app is designed to help teachers manage their classes, track student performance, and simplify daily administrative tasks."
            }
          </Text>
        </View>

        {/* Features Grid */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {language === 'fr' ? 'Fonctionnalités' : 'Features'}
        </Text>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View 
              key={index} 
              style={[styles.featureCard, { backgroundColor: colors.card + 'E6' }]}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <FontAwesome5 name={feature.icon} size={20} color={colors.primary} />
              </View>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                {language === 'fr' ? feature.titleFr : feature.title}
              </Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                {language === 'fr' ? feature.descriptionFr : feature.description}
              </Text>
            </View>
          ))}
        </View>

        {/* Developer Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {language === 'fr' ? 'Développeur' : 'Developer'}
        </Text>
        <View style={[styles.developerCard, { backgroundColor: colors.card + 'E6' }]}>
          <View style={styles.developerHeader}>
            <View style={[styles.developerAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.developerInitials}>BF</Text>
            </View>
            <View style={styles.developerInfo}>
              <Text style={[styles.developerName, { color: colors.text }]}>
                Boreil Fobasso
              </Text>
              <Text style={[styles.developerRole, { color: colors.primary }]}>
                Full-Stack & AI Engineer
              </Text>
            </View>
          </View>
          <Text style={[styles.developerBio, { color: colors.textSecondary }]}>
            {language === 'fr' 
              ? "Passionné par l'éducation et la technologie, je développe des solutions innovantes pour transformer la gestion scolaire."
              : "Passionate about education and technology, I build innovative solutions to transform school management."
            }
          </Text>

          {/* Contact Buttons */}
          <View style={styles.contactButtons}>
            <TouchableOpacity 
              style={[styles.contactButton, { backgroundColor: colors.primary + '15' }]}
              onPress={openPortfolio}
            >
              <Ionicons name="globe-outline" size={20} color={colors.primary} />
              <Text style={[styles.contactButtonText, { color: colors.primary }]}>
                {language === 'fr' ? 'Portfolio' : 'Portfolio'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.contactButton, { backgroundColor: '#25D366' + '20' }]}
              onPress={openWhatsApp}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              <Text style={[styles.contactButtonText, { color: '#25D366' }]}>
                WhatsApp
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.contactButton, { backgroundColor: colors.error + '15' }]}
              onPress={emailDeveloper}
            >
              <Ionicons name="mail-outline" size={20} color={colors.error} />
              <Text style={[styles.contactButtonText, { color: colors.error }]}>
                Email
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Links Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {language === 'fr' ? 'Liens utiles' : 'Useful Links'}
        </Text>
        <View style={[styles.linksCard, { backgroundColor: colors.card + 'E6' }]}>
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={openWebsite}
          >
            <View style={styles.linkLeft}>
              <Ionicons name="globe-outline" size={22} color={colors.primary} />
              <Text style={[styles.linkText, { color: colors.text }]}>
                {language === 'fr' ? 'Site Web' : 'Website'}
              </Text>
            </View>
            <Feather name="external-link" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.linkDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={openPrivacyPolicy}
          >
            <View style={styles.linkLeft}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
              <Text style={[styles.linkText, { color: colors.text }]}>
                {language === 'fr' ? 'Politique de confidentialité' : 'Privacy Policy'}
              </Text>
            </View>
            <Feather name="external-link" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.linkDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={callDeveloper}
          >
            <View style={styles.linkLeft}>
              <Ionicons name="call-outline" size={22} color={colors.primary} />
              <Text style={[styles.linkText, { color: colors.text }]}>
                {language === 'fr' ? 'Appeler le support' : 'Call Support'}
              </Text>
            </View>
            <Feather name="phone" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            © {new Date().getFullYear()} FOBS SMS
          </Text>
          <Text style={[styles.footerSubtext, { color: colors.textSecondary }]}>
            {language === 'fr' 
              ? 'Tous droits réservés'
              : 'All rights reserved'
            }
          </Text>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  appIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  appTagline: {
    fontSize: 15,
    textAlign: 'center',
  },
  descriptionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  featureCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  developerCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  developerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  developerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  developerInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  developerInfo: {
    flex: 1,
  },
  developerName: {
    fontSize: 18,
    fontWeight: '700',
  },
  developerRole: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  developerBio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  contactButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  linksCard: {
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
  },
  linkDivider: {
    height: 1,
    marginLeft: 46,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
});
