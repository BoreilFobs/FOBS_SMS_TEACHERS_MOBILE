import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Linking,
  Platform,
  useColorScheme,
  LayoutAnimation,
  UIManager
} from "react-native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { BlurView } from "expo-blur";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { useLanguage } from "@/contexts/LanguageContext";

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const faqItems = [
  {
    question: "How do I enter marks for my students?",
    questionFr: "Comment saisir les notes de mes élèves ?",
    answer: "Go to the Subjects tab, select a class, then choose a subject. You can enter marks for the current exam sequence.",
    answerFr: "Allez dans l'onglet Matières, sélectionnez une classe, puis choisissez une matière. Vous pouvez saisir les notes pour la séquence d'examen en cours."
  },
  {
    question: "How do I take attendance?",
    questionFr: "Comment prendre les présences ?",
    answer: "Navigate to the Attendance tab, select your class, and mark students as present or absent. Changes are saved automatically.",
    answerFr: "Accédez à l'onglet Présences, sélectionnez votre classe et marquez les élèves comme présents ou absents. Les modifications sont enregistrées automatiquement."
  },
  {
    question: "Can I teach at multiple schools?",
    questionFr: "Puis-je enseigner dans plusieurs écoles ?",
    answer: "Yes! You can be linked to multiple schools. Use the school switcher in the home screen to switch between schools.",
    answerFr: "Oui ! Vous pouvez être lié à plusieurs écoles. Utilisez le sélecteur d'école sur l'écran d'accueil pour changer d'école."
  },
  {
    question: "How do I view student performance reports?",
    questionFr: "Comment voir les rapports de performance des élèves ?",
    answer: "Tap on Reports from the Quick Actions on the home screen. You'll see performance analytics for all your classes and subjects.",
    answerFr: "Appuyez sur Rapports depuis les Actions rapides sur l'écran d'accueil. Vous verrez les analyses de performance pour toutes vos classes et matières."
  },
  {
    question: "What if I forget my password?",
    questionFr: "Que faire si j'oublie mon mot de passe ?",
    answer: "Go to Settings > Change Password and tap 'Forgot Password?'. You'll receive an OTP via WhatsApp to reset your password.",
    answerFr: "Allez dans Paramètres > Changer le mot de passe et appuyez sur 'Mot de passe oublié ?'. Vous recevrez un OTP via WhatsApp pour réinitialiser votre mot de passe."
  },
  {
    question: "How do I change the app language?",
    questionFr: "Comment changer la langue de l'application ?",
    answer: "Go to Settings and tap on Language. You can switch between English and French at any time.",
    answerFr: "Allez dans Paramètres et appuyez sur Langue. Vous pouvez basculer entre l'anglais et le français à tout moment."
  },
  {
    question: "Is my data secure?",
    questionFr: "Mes données sont-elles sécurisées ?",
    answer: "Yes, all data is encrypted and stored securely. We use industry-standard security protocols to protect your information.",
    answerFr: "Oui, toutes les données sont cryptées et stockées de manière sécurisée. Nous utilisons des protocoles de sécurité standards de l'industrie pour protéger vos informations."
  }
];

const contactOptions = [
  {
    id: 'whatsapp',
    title: 'WhatsApp',
    titleFr: 'WhatsApp',
    subtitle: '+237 671 820 738',
    icon: 'logo-whatsapp',
    color: '#25D366',
    action: () => Linking.openURL('https://wa.me/237671820738')
  },
  {
    id: 'email',
    title: 'Email Support',
    titleFr: 'Email Support',
    subtitle: 'fobsboreil@gmail.com',
    icon: 'mail-outline',
    color: '#EA4335',
    action: () => Linking.openURL('mailto:fobsboreil@gmail.com?subject=FOBS SMS Teachers App Support')
  },
  {
    id: 'phone',
    title: 'Call Us',
    titleFr: 'Appelez-nous',
    subtitle: '+237 671 820 738',
    icon: 'call-outline',
    color: '#3B82F6',
    action: () => Linking.openURL('tel:+237671820738')
  }
];

export default function HelpCenterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { language } = useLanguage();
  
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaq(expandedFaq === index ? null : index);
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
          {language === 'fr' ? 'Aide' : 'Help'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={[styles.heroCard, { backgroundColor: colors.card + 'E6' }]}>
          <LinearGradient
            colors={[colors.primary, colors.tint]}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.heroIcon}
          >
            <Ionicons name="help-circle" size={40} color="white" />
          </LinearGradient>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            {language === 'fr' ? 'Comment pouvons-nous vous aider ?' : 'How can we help you?'}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            {language === 'fr' 
              ? 'Trouvez des réponses aux questions fréquentes'
              : 'Find answers to frequently asked questions'
            }
          </Text>
        </View>

        {/* FAQ Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {language === 'fr' ? 'Questions fréquentes' : 'Frequently Asked Questions'}
        </Text>
        <View style={[styles.faqCard, { backgroundColor: colors.card + 'E6' }]}>
          {faqItems.map((item, index) => (
            <View key={index}>
              <TouchableOpacity
                style={styles.faqItem}
                onPress={() => toggleFaq(index)}
                activeOpacity={0.7}
              >
                <View style={styles.faqQuestion}>
                  <View style={[styles.faqIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons 
                      name={expandedFaq === index ? "remove" : "add"} 
                      size={18} 
                      color={colors.primary} 
                    />
                  </View>
                  <Text style={[styles.faqQuestionText, { color: colors.text }]}>
                    {language === 'fr' ? item.questionFr : item.question}
                  </Text>
                </View>
              </TouchableOpacity>
              {expandedFaq === index && (
                <View style={[styles.faqAnswer, { backgroundColor: colors.primary + '08' }]}>
                  <Text style={[styles.faqAnswerText, { color: colors.textSecondary }]}>
                    {language === 'fr' ? item.answerFr : item.answer}
                  </Text>
                </View>
              )}
              {index < faqItems.length - 1 && (
                <View style={[styles.faqDivider, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>

        {/* Contact Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {language === 'fr' ? 'Contactez-nous' : 'Contact Us'}
        </Text>
        <View style={styles.contactGrid}>
          {contactOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.contactCard, { backgroundColor: colors.card + 'E6' }]}
              onPress={option.action}
              activeOpacity={0.7}
            >
              <View style={[styles.contactIcon, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon as any} size={24} color={option.color} />
              </View>
              <Text style={[styles.contactTitle, { color: colors.text }]}>
                {language === 'fr' ? option.titleFr : option.title}
              </Text>
              <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>
                {option.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Tips */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {language === 'fr' ? 'Conseils rapides' : 'Quick Tips'}
        </Text>
        <View style={[styles.tipsCard, { backgroundColor: colors.card + 'E6' }]}>
          <View style={styles.tipItem}>
            <View style={[styles.tipIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="bulb-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              {language === 'fr' 
                ? "Tirez vers le bas pour actualiser les données sur n'importe quel écran"
                : "Pull down to refresh data on any screen"
              }
            </Text>
          </View>
          <View style={styles.tipItem}>
            <View style={[styles.tipIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="bulb-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              {language === 'fr' 
                ? "Utilisez le sélecteur d'école pour basculer rapidement entre les écoles"
                : "Use the school switcher to quickly switch between schools"
              }
            </Text>
          </View>
          <View style={styles.tipItem}>
            <View style={[styles.tipIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="bulb-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              {language === 'fr' 
                ? "Les notes sont automatiquement sauvegardées lors de la saisie"
                : "Marks are automatically saved as you enter them"
              }
            </Text>
          </View>
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
    marginBottom: 24,
  },
  heroIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  faqCard: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  faqItem: {
    padding: 16,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  faqAnswer: {
    paddingHorizontal: 56,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  faqDivider: {
    height: 1,
    marginLeft: 56,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  contactCard: {
    width: '31%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  contactSubtitle: {
    fontSize: 10,
    textAlign: 'center',
  },
  tipsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
