import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  AppHeader,
  Button,
  Card,
  FormField,
  PressableScale,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { radii, spacing, typography } from "@/constants/theme";

// Developer contact information
const DEVELOPER_EMAIL = "fobsboreil@gmail.com";
const DEVELOPER_PHONE = "+237671820738";
const DEVELOPER_WHATSAPP = "+237671820738";
const DEVELOPER_WEBSITE = "https://fobs-tech.com";
const FACEBOOK_URL = "https://facebook.com/BoreilFobs";
const GITHUB_URL = "https://github.com/BoreilFobs";

export default function ContactUsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { language } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const en = language === "en";

  const contactMethods = [
    {
      id: "whatsapp",
      title: "WhatsApp",
      icon: "logo-whatsapp",
      iconType: "ionicons" as const,
      description: en ? "Quick response via WhatsApp" : "Réponse rapide via WhatsApp",
      color: "#25D366",
      action: () =>
        Linking.openURL(
          `https://wa.me/${DEVELOPER_WHATSAPP.replace("+", "")}?text=${encodeURIComponent(
            en
              ? "Hello, I need help with the FOBS Teachers App..."
              : "Bonjour, j'ai besoin d'aide avec l'application FOBS Enseignants...",
          )}`,
        ),
    },
    {
      id: "email",
      title: en ? "Email support" : "Support email",
      icon: "email",
      iconType: "material" as const,
      description: en ? "Send us a detailed message" : "Envoyez-nous un message détaillé",
      color: colors.primary,
      action: () =>
        Linking.openURL(
          `mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent(
            en ? "FOBS Teachers App Support" : "Support Application FOBS Enseignants",
          )}`,
        ),
    },
    {
      id: "phone",
      title: en ? "Phone support" : "Support téléphonique",
      icon: "phone",
      iconType: "material" as const,
      description: DEVELOPER_PHONE,
      color: "#4CAF50",
      action: () => Linking.openURL(`tel:${DEVELOPER_PHONE}`),
    },
    {
      id: "website",
      title: en ? "Visit website" : "Visiter le site web",
      icon: "web",
      iconType: "material" as const,
      description: en
        ? "Browse our documentation & guides"
        : "Parcourez notre documentation",
      color: "#2196F3",
      action: () => Linking.openURL(DEVELOPER_WEBSITE),
    },
  ];

  const supportInfo = {
    hours: en
      ? "Monday - Saturday: 8:00 AM - 6:00 PM (GMT+1)"
      : "Lundi - Samedi: 8h00 - 18h00 (GMT+1)",
    response: en
      ? "Average response time: 2-4 hours"
      : "Temps de réponse moyen: 2-4 heures",
  };

  const handleSendMessage = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert(
        en ? "Missing information" : "Informations manquantes",
        en
          ? "Please fill in your name, email, and message."
          : "Veuillez remplir votre nom, email et message.",
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(
        en ? "Invalid email" : "Email invalide",
        en
          ? "Please enter a valid email address."
          : "Veuillez entrer une adresse email valide.",
      );
      return;
    }

    setIsSending(true);

    const emailSubject =
      subject.trim() ||
      (en
        ? "FOBS Teachers App - Support Request"
        : "Application FOBS Enseignants - Demande de Support");
    const emailBody = `
${en ? "Name" : "Nom"}: ${name}
${en ? "Email" : "Email"}: ${email}
${en ? "Subject" : "Sujet"}: ${emailSubject}

${en ? "Message" : "Message"}:
${message}

---
${en ? "Sent from FOBS Teachers Mobile App" : "Envoyé depuis l'application mobile FOBS Enseignants"}
    `.trim();

    try {
      await Linking.openURL(
        `mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent(
          emailSubject,
        )}&body=${encodeURIComponent(emailBody)}`,
      );

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");

      Alert.alert(
        en ? "Email client opened" : "Client email ouvert",
        en
          ? "Please send the email from your email app to complete your support request."
          : "Veuillez envoyer l'email depuis votre application de messagerie pour compléter votre demande.",
      );
    } catch {
      Alert.alert(
        en ? "Error" : "Erreur",
        en
          ? "Unable to open email client. Please try contacting us via WhatsApp."
          : "Impossible d'ouvrir le client email. Veuillez nous contacter via WhatsApp.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <Screen scroll bottomInset={false}>
        <AppHeader
          title={en ? "Contact us" : "Nous contacter"}
          subtitle={en ? "We're here to help" : "Nous sommes là pour vous aider"}
          back
        />

        <Card style={[styles.infoCard, { backgroundColor: colors.infoSoft }]}>
          <View style={[styles.infoIcon, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>
              {en ? "Support hours" : "Heures de support"}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {supportInfo.hours}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {supportInfo.response}
            </Text>
          </View>
        </Card>

        <SectionHeader title={en ? "Quick contact" : "Contact rapide"} />
        <View style={styles.list}>
          {contactMethods.map((method) => (
            <Card key={method.id} onPress={method.action} accessibilityLabel={method.title}>
              <View style={styles.methodRow}>
                <View style={[styles.methodIcon, { backgroundColor: `${method.color}1F` }]}>
                  {method.iconType === "ionicons" ? (
                    <Ionicons name={method.icon as never} size={21} color={method.color} />
                  ) : (
                    <MaterialCommunityIcons
                      name={method.icon as never}
                      size={21}
                      color={method.color}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>
                    {method.title}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    {method.description}
                  </Text>
                </View>
                <Feather name="chevron-right" size={19} color={colors.textMuted} />
              </View>
            </Card>
          ))}
        </View>

        <SectionHeader title={en ? "Connect with us" : "Suivez-nous"} />
        <Card style={styles.socialCard}>
          <View style={styles.socialRow}>
            <SocialButton
              icon="logo-facebook"
              label="Facebook"
              tint="#1877F2"
              onPress={() => Linking.openURL(FACEBOOK_URL)}
            />
            <SocialButton
              icon="logo-whatsapp"
              label="WhatsApp"
              tint="#25D366"
              onPress={() =>
                Linking.openURL(`https://wa.me/${DEVELOPER_WHATSAPP.replace("+", "")}`)
              }
            />
            <SocialButton
              icon="logo-github"
              label="GitHub"
              tint={colors.text}
              onPress={() => Linking.openURL(GITHUB_URL)}
            />
          </View>
          <Text
            style={[
              typography.caption,
              { color: colors.textSecondary, textAlign: "center" },
            ]}
          >
            {en
              ? "Follow us for updates and announcements"
              : "Suivez-nous pour les mises à jour et annonces"}
          </Text>
        </Card>

        <SectionHeader title={en ? "Send a message" : "Envoyer un message"} />
        <Card style={{ gap: spacing.sm }}>
          <FormField
            label={en ? "Your name" : "Votre nom"}
            value={name}
            onChangeText={setName}
            placeholder={en ? "Enter your name" : "Entrez votre nom"}
          />
          <FormField
            label={en ? "Email address" : "Adresse email"}
            value={email}
            onChangeText={setEmail}
            placeholder={en ? "Enter your email" : "Entrez votre email"}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormField
            label={en ? "Subject" : "Sujet"}
            optional
            value={subject}
            onChangeText={setSubject}
            placeholder={
              en ? "e.g. Issue with attendance" : "ex : Problème avec les présences"
            }
          />
          <FormField
            label="Message"
            multiline
            value={message}
            onChangeText={setMessage}
            placeholder={
              en
                ? "Describe your issue or question in detail..."
                : "Décrivez votre problème ou question en détail..."
            }
          />
          <Button
            label={en ? "Send message" : "Envoyer le message"}
            icon="send"
            loading={isSending}
            onPress={() => void handleSendMessage()}
          />
        </Card>

        <Card onPress={() => router.push("/support/help")}>
          <View style={styles.methodRow}>
            <View style={[styles.methodIcon, { backgroundColor: colors.primarySoft }]}>
              <MaterialCommunityIcons
                name="frequently-asked-questions"
                size={21}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>
                {en ? "Check our FAQs" : "Consultez notre FAQ"}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {en
                  ? "Answers to the most common questions"
                  : "Réponses aux questions les plus fréquentes"}
              </Text>
            </View>
            <Feather name="chevron-right" size={19} color={colors.textMuted} />
          </View>
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function SocialButton({
  icon,
  label,
  tint,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  tint: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.socialButton, { backgroundColor: `${tint}1F` }]}
    >
      <Ionicons name={icon} size={24} color={tint} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  infoCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { gap: spacing.xs },
  methodRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  socialCard: { gap: spacing.sm },
  socialRow: { flexDirection: "row", justifyContent: "center", gap: spacing.md },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
