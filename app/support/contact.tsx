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
  TextInput,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { BlurView } from "expo-blur";
import { StatusBar } from "expo-status-bar";
import { useLanguage } from "@/contexts/LanguageContext";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

// Developer contact information
const DEVELOPER_EMAIL = "fobsboreil@gmail.com";
const DEVELOPER_PHONE = "+237671820738";
const DEVELOPER_WHATSAPP = "+237671820738";
const DEVELOPER_WEBSITE = "https://fobs-tech.com";
const FACEBOOK_URL = "https://facebook.com/BoreilFobs";
const GITHUB_URL = "https://github.com/BoreilFobs";

export default function ContactUsScreen() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme ?? "light"];
  const { t, language } = useLanguage();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Contact methods with bilingual support
  const contactMethods = [
    {
      id: 'whatsapp',
      title: language === 'en' ? 'WhatsApp' : 'WhatsApp',
      icon: 'whatsapp',
      iconType: 'ionicons',
      description: language === 'en' 
        ? 'Quick response via WhatsApp' 
        : 'Réponse rapide via WhatsApp',
      color: '#25D366',
      action: () => Linking.openURL(`https://wa.me/${DEVELOPER_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(
        language === 'en' 
          ? 'Hello, I need help with the FOBS Teachers App...' 
          : 'Bonjour, j\'ai besoin d\'aide avec l\'application FOBS Enseignants...'
      )}`)
    },
    {
      id: 'email',
      title: language === 'en' ? 'Email Support' : 'Support Email',
      icon: 'email',
      iconType: 'material',
      description: language === 'en' 
        ? 'Send us a detailed message' 
        : 'Envoyez-nous un message détaillé',
      color: colors.primary,
      action: () => Linking.openURL(`mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent(
        language === 'en' ? 'FOBS Teachers App Support' : 'Support Application FOBS Enseignants'
      )}`)
    },
    {
      id: 'phone',
      title: language === 'en' ? 'Phone Support' : 'Support Téléphonique',
      icon: 'phone',
      iconType: 'material',
      description: DEVELOPER_PHONE,
      color: '#4CAF50',
      action: () => Linking.openURL(`tel:${DEVELOPER_PHONE}`)
    },
    {
      id: 'website',
      title: language === 'en' ? 'Visit Website' : 'Visiter le Site Web',
      icon: 'web',
      iconType: 'material',
      description: language === 'en' 
        ? 'Browse our documentation & guides' 
        : 'Parcourez notre documentation',
      color: '#2196F3',
      action: () => Linking.openURL(DEVELOPER_WEBSITE)
    }
  ];

  // Support hours
  const supportInfo = {
    hours: language === 'en' 
      ? 'Monday - Saturday: 8:00 AM - 6:00 PM (GMT+1)' 
      : 'Lundi - Samedi: 8h00 - 18h00 (GMT+1)',
    response: language === 'en'
      ? 'Average response time: 2-4 hours'
      : 'Temps de réponse moyen: 2-4 heures',
  };

  const handleSendMessage = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert(
        language === 'en' ? 'Missing Information' : 'Informations Manquantes',
        language === 'en' 
          ? 'Please fill in your name, email, and message.' 
          : 'Veuillez remplir votre nom, email et message.'
      );
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(
        language === 'en' ? 'Invalid Email' : 'Email Invalide',
        language === 'en' 
          ? 'Please enter a valid email address.' 
          : 'Veuillez entrer une adresse email valide.'
      );
      return;
    }

    setIsSending(true);

    // Compose email
    const emailSubject = subject.trim() || (language === 'en' ? 'FOBS Teachers App - Support Request' : 'Application FOBS Enseignants - Demande de Support');
    const emailBody = `
${language === 'en' ? 'Name' : 'Nom'}: ${name}
${language === 'en' ? 'Email' : 'Email'}: ${email}
${language === 'en' ? 'Subject' : 'Sujet'}: ${emailSubject}

${language === 'en' ? 'Message' : 'Message'}:
${message}

---
${language === 'en' ? 'Sent from FOBS Teachers Mobile App' : 'Envoyé depuis l\'application mobile FOBS Enseignants'}
    `.trim();

    try {
      await Linking.openURL(`mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`);
      
      // Clear form after opening email client
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      
      Alert.alert(
        language === 'en' ? 'Email Client Opened' : 'Client Email Ouvert',
        language === 'en' 
          ? 'Please send the email from your email app to complete your support request.' 
          : 'Veuillez envoyer l\'email depuis votre application de messagerie pour compléter votre demande.'
      );
    } catch (error) {
      Alert.alert(
        language === 'en' ? 'Error' : 'Erreur',
        language === 'en' 
          ? 'Unable to open email client. Please try contacting us via WhatsApp.' 
          : 'Impossible d\'ouvrir le client email. Veuillez nous contacter via WhatsApp.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const renderContactMethod = (method: typeof contactMethods[0]) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.contactCard,
        { 
          backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
          borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
        }
      ]}
      onPress={method.action}
      activeOpacity={0.7}
    >
      <View style={[styles.contactIconContainer, { backgroundColor: method.color + '20' }]}>
        {method.iconType === 'ionicons' ? (
          <Ionicons name={method.icon as any} size={24} color={method.color} />
        ) : (
          <MaterialCommunityIcons name={method.icon as any} size={24} color={method.color} />
        )}
      </View>
      <View style={styles.contactTextContainer}>
        <Text style={[styles.contactTitle, { color: colors.text }]}>{method.title}</Text>
        <Text style={[styles.contactDescription, { color: colors.textSecondary }]}>
          {method.description}
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("@/assets/images/auth-bg2.jpg")}
        style={StyleSheet.absoluteFill}
        blurRadius={10}
      />
      <BlurView 
        intensity={Platform.OS === 'ios' ? 80 : 100} 
        style={StyleSheet.absoluteFill} 
        tint={colorScheme === 'dark' ? 'dark' : 'light'} 
      />
      
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <LinearGradient
        colors={colorScheme === 'dark' 
          ? ['rgba(30,30,30,0.95)', 'rgba(30,30,30,0.8)', 'transparent'] 
          : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.8)', 'transparent']
        }
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
            ]}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {language === 'en' ? 'Contact Us' : 'Nous Contacter'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {language === 'en' ? 'We\'re here to help' : 'Nous sommes là pour vous aider'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Support Info Card */}
          <View style={[
            styles.infoCard,
            { 
              backgroundColor: colorScheme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
              borderColor: colorScheme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
            }
          ]}>
            <View style={styles.infoIconContainer}>
              <MaterialCommunityIcons name="clock-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                {language === 'en' ? 'Support Hours' : 'Heures de Support'}
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>{supportInfo.hours}</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>{supportInfo.response}</Text>
            </View>
          </View>

          {/* Contact Methods */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === 'en' ? 'Quick Contact' : 'Contact Rapide'}
          </Text>
          
          {contactMethods.map(renderContactMethod)}

          {/* Social Media */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
            {language === 'en' ? 'Connect With Us' : 'Suivez-nous'}
          </Text>
          
          <View style={[
            styles.socialCard,
            { 
              backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
              borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
            }
          ]}>
            <View style={styles.socialIcons}>
              <TouchableOpacity 
                style={[styles.socialIconButton, { backgroundColor: '#1877F2' + '20' }]}
                onPress={() => Linking.openURL(FACEBOOK_URL)}
              >
                <Ionicons name="logo-facebook" size={28} color="#1877F2" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.socialIconButton, { backgroundColor: '#25D366' + '20' }]}
                onPress={() => Linking.openURL(`https://wa.me/${DEVELOPER_WHATSAPP.replace('+', '')}`)}
              >
                <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.socialIconButton, { backgroundColor: colors.text + '15' }]}
                onPress={() => Linking.openURL(GITHUB_URL)}
              >
                <Ionicons name="logo-github" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.socialHint, { color: colors.textSecondary }]}>
              {language === 'en' 
                ? 'Follow us for updates and announcements' 
                : 'Suivez-nous pour les mises à jour et annonces'}
            </Text>
          </View>

          {/* Contact Form */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
            {language === 'en' ? 'Send a Message' : 'Envoyer un Message'}
          </Text>

          <View style={[
            styles.formCard,
            { 
              backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
              borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
            }
          ]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === 'en' ? 'Your Name' : 'Votre Nom'} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    color: colors.text,
                    borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  }
                ]}
                placeholder={language === 'en' ? 'Enter your name' : 'Entrez votre nom'}
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === 'en' ? 'Email Address' : 'Adresse Email'} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    color: colors.text,
                    borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  }
                ]}
                placeholder={language === 'en' ? 'Enter your email' : 'Entrez votre email'}
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === 'en' ? 'Subject' : 'Sujet'}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    color: colors.text,
                    borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  }
                ]}
                placeholder={language === 'en' ? 'e.g., Issue with attendance' : 'ex: Problème avec les présences'}
                placeholderTextColor={colors.textSecondary}
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === 'en' ? 'Message' : 'Message'} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { 
                    backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    color: colors.text,
                    borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  }
                ]}
                placeholder={language === 'en' 
                  ? 'Describe your issue or question in detail...' 
                  : 'Décrivez votre problème ou question en détail...'}
                placeholderTextColor={colors.textSecondary}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: colors.primary },
                isSending && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={isSending}
              activeOpacity={0.8}
            >
              {isSending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.sendButtonText}>
                    {language === 'en' ? 'Send Message' : 'Envoyer le Message'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* FAQ Link */}
          <TouchableOpacity
            style={[
              styles.faqLink,
              { 
                backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
                borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
              }
            ]}
            onPress={() => router.push('/support/help')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="frequently-asked-questions" size={24} color={colors.primary} />
            <View style={styles.faqTextContainer}>
              <Text style={[styles.faqTitle, { color: colors.text }]}>
                {language === 'en' ? 'Check our FAQs' : 'Consultez notre FAQ'}
              </Text>
              <Text style={[styles.faqDescription, { color: colors.textSecondary }]}>
                {language === 'en' 
                  ? 'Find quick answers to common questions' 
                  : 'Trouvez des réponses rapides aux questions courantes'}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              {language === 'en' 
                ? 'We typically respond within 2-4 hours during support hours.' 
                : 'Nous répondons généralement sous 2-4 heures pendant les heures de support.'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 35,
    paddingBottom: 20,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactDescription: {
    fontSize: 13,
  },
  socialCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  socialIconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialHint: {
    fontSize: 13,
    textAlign: 'center',
  },
  formCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  faqLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 24,
  },
  faqTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  faqDescription: {
    fontSize: 13,
  },
  footer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
