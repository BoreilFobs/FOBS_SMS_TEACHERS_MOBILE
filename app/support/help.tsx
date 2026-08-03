import React, { useState } from "react";
import {
  LayoutAnimation,
  Linking,
  Platform,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader, Card, Divider, PressableScale, Screen, SectionHeader } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { radii, spacing, typography } from "@/constants/theme";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const faqItems = [
  {
    question: "How is the app organised?",
    questionFr: "Comment l'application est-elle organisée ?",
    answer:
      "The app has two sections. The main section is your professional network: feed, teachers, jobs, messages and announcements. Tap 'My schools' at the top right to switch to the school management section, which is only for classes, attendance, marks and reports. The people icon in its header brings you back.",
    answerFr:
      "L'application a deux sections. La section principale est votre réseau professionnel : fil, enseignants, emplois, messages et annonces. Appuyez sur « Mes écoles » en haut à droite pour passer à la section de gestion scolaire, réservée aux classes, présences, notes et rapports. L'icône avec les personnes dans son en-tête vous ramène en arrière.",
  },
  {
    question: "How do I join a school?",
    questionFr: "Comment rejoindre une école ?",
    answer:
      "Open 'My schools'. If no school is connected yet, tap 'Send a request', enter the school code from your administrator, confirm the school that appears, then send. The administrator reviews it, and the school appears once approved.",
    answerFr:
      "Ouvrez « Mes écoles ». Si aucune école n'est connectée, appuyez sur « Envoyer une demande », entrez le code fourni par votre administrateur, confirmez l'école affichée, puis envoyez. L'administrateur l'examine et l'école apparaît une fois approuvée.",
  },
  {
    question: "How do I enter marks for my students?",
    questionFr: "Comment saisir les notes de mes élèves ?",
    answer:
      "In the school management section, open the Marks tab. Choose a subject, then a class, then the exam sequence, and enter the marks.",
    answerFr:
      "Dans la section de gestion scolaire, ouvrez l'onglet Notes. Choisissez une matière, puis une classe, puis la séquence d'examen, et saisissez les notes.",
  },
  {
    question: "How do I take attendance?",
    questionFr: "Comment prendre les présences ?",
    answer:
      "In the school management section, open the Attendance tab and pick a class. Tap the green check or red cross for each student — a small spinner shows while it saves, and the tick confirms it reached the server.",
    answerFr:
      "Dans la section de gestion scolaire, ouvrez l'onglet Présences et choisissez une classe. Appuyez sur la coche verte ou la croix rouge pour chaque élève — un indicateur s'affiche pendant l'enregistrement et confirme l'envoi au serveur.",
  },
  {
    question: "Can I teach at multiple schools?",
    questionFr: "Puis-je enseigner dans plusieurs écoles ?",
    answer:
      "Yes. You can be linked to several schools. In the school management section, tap the small school chip under the page title to switch. Attendance and marks always stay separated per school.",
    answerFr:
      "Oui. Vous pouvez être lié à plusieurs écoles. Dans la section de gestion scolaire, appuyez sur la petite puce sous le titre pour changer d'école. Les présences et les notes restent toujours séparées par école.",
  },
  {
    question: "How do I view student performance reports?",
    questionFr: "Comment voir les rapports de performance des élèves ?",
    answer:
      "In the school management section, open the Reports tab for performance analytics across your classes and subjects.",
    answerFr:
      "Dans la section de gestion scolaire, ouvrez l'onglet Rapports pour les analyses de performance de vos classes et matières.",
  },
  {
    question: "How do I change my profile picture?",
    questionFr: "Comment changer ma photo de profil ?",
    answer:
      "Go to Settings > Personal information and tap your photo. Pick an image, then tap 'Save changes'. It works on Android, iOS and the web app.",
    answerFr:
      "Allez dans Paramètres > Informations personnelles et appuyez sur votre photo. Choisissez une image, puis appuyez sur « Enregistrer ». Cela fonctionne sur Android, iOS et l'application web.",
  },
  {
    question: "Where did notifications go?",
    questionFr: "Où sont passées les notifications ?",
    answer:
      "They now live in the main social section, so all communication is in one place. Notifications are the bell in the top bar; announcements are the shortcut just under the composer on the home feed.",
    answerFr:
      "Elles se trouvent désormais dans la section sociale principale, pour regrouper toute la communication. Les notifications sont la cloche en haut ; les annonces sont le raccourci sous la zone de publication du fil d'accueil.",
  },
  {
    question: "What if I forget my password?",
    questionFr: "Que faire si j'oublie mon mot de passe ?",
    answer:
      "Go to Settings > Change Password and tap 'Forgot Password?'. You'll receive an OTP via WhatsApp to reset your password.",
    answerFr:
      "Allez dans Paramètres > Changer le mot de passe et appuyez sur 'Mot de passe oublié ?'. Vous recevrez un OTP via WhatsApp pour réinitialiser votre mot de passe.",
  },
  {
    question: "How do I change the app language?",
    questionFr: "Comment changer la langue de l'application ?",
    answer:
      "Go to Settings and tap on Language. You can switch between English and French at any time.",
    answerFr:
      "Allez dans Paramètres et appuyez sur Langue. Vous pouvez basculer entre l'anglais et le français à tout moment.",
  },
  {
    question: "Is my data secure?",
    questionFr: "Mes données sont-elles sécurisées ?",
    answer:
      "Yes, all data is encrypted and stored securely. We use industry-standard security protocols to protect your information.",
    answerFr:
      "Oui, toutes les données sont cryptées et stockées de manière sécurisée. Nous utilisons des protocoles de sécurité standards de l'industrie pour protéger vos informations.",
  },
];

const contactOptions = [
  {
    id: "whatsapp",
    title: "WhatsApp",
    titleFr: "WhatsApp",
    subtitle: "+237 671 820 738",
    icon: "logo-whatsapp",
    color: "#25D366",
    action: () => Linking.openURL("https://wa.me/237671820738"),
  },
  {
    id: "email",
    title: "Email support",
    titleFr: "Support par email",
    subtitle: "fobsboreil@gmail.com",
    icon: "mail-outline",
    color: "#EA4335",
    action: () =>
      Linking.openURL(
        "mailto:fobsboreil@gmail.com?subject=FOBS SMS Teachers App Support",
      ),
  },
  {
    id: "phone",
    title: "Call us",
    titleFr: "Appelez-nous",
    subtitle: "+237 671 820 738",
    icon: "call-outline",
    color: "#3B82F6",
    action: () => Linking.openURL("tel:+237671820738"),
  },
] as const;

export default function HelpCenterScreen() {
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const copy =
    language === "fr"
      ? {
          title: "Aide",
          subtitle: "Réponses aux questions fréquentes",
          heroTitle: "Comment pouvons-nous vous aider ?",
          heroSubtitle:
            "Parcourez les questions fréquentes ou contactez directement notre équipe.",
          faq: "Questions fréquentes",
          contact: "Contactez-nous",
          tips: "Conseils rapides",
        }
      : {
          title: "Help",
          subtitle: "Answers to frequently asked questions",
          heroTitle: "How can we help you?",
          heroSubtitle:
            "Browse frequently asked questions or reach our team directly.",
          faq: "Frequently asked questions",
          contact: "Contact us",
          tips: "Quick tips",
        };

  const tips =
    language === "fr"
      ? [
          "Tirez vers le bas pour actualiser les données sur n'importe quel écran",
          "Appuyez longuement sur « Réagir » pour choisir une réaction précise",
          "La puce sous le titre indique l'école active en gestion scolaire",
          "Les notes sont automatiquement sauvegardées lors de la saisie",
        ]
      : [
          "Pull down to refresh data on any screen",
          "Long-press the react button to choose a specific reaction",
          "The chip under the title shows which school you are managing",
          "Marks are automatically saved as you enter them",
        ];

  return (
    <Screen scroll bottomInset={false}>
      <AppHeader title={copy.title} subtitle={copy.subtitle} back />

      <Card variant="raised" style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="help-circle" size={32} color={colors.onPrimary} />
        </View>
        <Text style={[typography.heading, { color: colors.text, textAlign: "center" }]}>
          {copy.heroTitle}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, textAlign: "center" },
          ]}
        >
          {copy.heroSubtitle}
        </Text>
      </Card>

      <SectionHeader title={copy.faq} />
      <Card style={styles.flush}>
        {faqItems.map((item, index) => {
          const expanded = expandedFaq === index;
          return (
            <View key={item.question}>
              <PressableScale
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel={language === "fr" ? item.questionFr : item.question}
                onPress={() => toggleFaq(index)}
                scaleTo={0.99}
                style={styles.faqRow}
              >
                <View
                  style={[
                    styles.faqIcon,
                    { backgroundColor: expanded ? colors.primary : colors.primarySoft },
                  ]}
                >
                  <Ionicons
                    name={expanded ? "remove" : "add"}
                    size={16}
                    color={expanded ? colors.onPrimary : colors.primary}
                  />
                </View>
                <Text style={[typography.bodyStrong, { color: colors.text, flex: 1 }]}>
                  {language === "fr" ? item.questionFr : item.question}
                </Text>
              </PressableScale>
              {expanded ? (
                <View style={styles.faqAnswer}>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>
                    {language === "fr" ? item.answerFr : item.answer}
                  </Text>
                </View>
              ) : null}
              {index < faqItems.length - 1 ? <Divider inset={spacing.md} /> : null}
            </View>
          );
        })}
      </Card>

      <SectionHeader title={copy.contact} />
      <View style={styles.contactList}>
        {contactOptions.map((option) => (
          <Card key={option.id} onPress={option.action} accessibilityLabel={option.title}>
            <View style={styles.contactRow}>
              <View style={[styles.contactIcon, { backgroundColor: `${option.color}1F` }]}>
                <Ionicons name={option.icon} size={21} color={option.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>
                  {language === "fr" ? option.titleFr : option.title}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {option.subtitle}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </Card>
        ))}
      </View>

      <SectionHeader title={copy.tips} />
      <Card>
        <View style={styles.tipList}>
          {tips.map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <View style={[styles.tipIcon, { backgroundColor: colors.warningSoft }]}>
                <Ionicons name="bulb-outline" size={16} color={colors.warning} />
              </View>
              <Text style={[typography.body, { color: colors.textSecondary, flex: 1 }]}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: spacing.xs },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxs,
  },
  flush: { padding: 0, overflow: "hidden" },
  faqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    minHeight: 60,
  },
  faqIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  faqAnswer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingLeft: spacing.md + 30 + spacing.sm,
  },
  contactList: { gap: spacing.xs },
  contactRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tipList: { gap: spacing.md },
  tipRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
