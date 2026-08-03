import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import {
  AppHeader,
  Card,
  Chip,
  Divider,
  PressableScale,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { radii, spacing, typography } from "@/constants/theme";
import Config from "@/constants/Config";

const features = [
  {
    title: "Marks entry",
    titleFr: "Saisie des notes",
    icon: "edit",
    description: "Quick and easy marks entry for all your subjects and classes",
    descriptionFr: "Saisie rapide et facile des notes pour tous vos cours et classes",
  },
  {
    title: "Attendance tracking",
    titleFr: "Suivi des présences",
    icon: "calendar-check",
    description: "Take attendance effortlessly with real-time sync across devices",
    descriptionFr: "Prenez les présences facilement avec synchronisation en temps réel",
  },
  {
    title: "Performance reports",
    titleFr: "Rapports de performance",
    icon: "chart-line",
    description: "View detailed analytics and reports for your students' progress",
    descriptionFr: "Consultez des analyses détaillées des progrès de vos élèves",
  },
  {
    title: "Multi-school support",
    titleFr: "Multi-écoles",
    icon: "school",
    description: "Manage classes across multiple schools from one account",
    descriptionFr: "Gérez vos cours dans plusieurs écoles depuis un seul compte",
  },
  {
    title: "Offline mode",
    titleFr: "Mode hors-ligne",
    icon: "wifi",
    description: "Work offline and sync when connected to the internet",
    descriptionFr: "Travaillez hors ligne et synchronisez une fois connecté",
  },
  {
    title: "Bilingual support",
    titleFr: "Support bilingue",
    icon: "language",
    description: "Full English and French language support for all features",
    descriptionFr: "Support complet en anglais et français pour toutes les fonctionnalités",
  },
] as const;

export default function AboutScreen() {
  const { colors } = useAppTheme();
  const { language } = useLanguage();

  const open = (url: string) => () => void Linking.openURL(url);

  const copy =
    language === "fr"
      ? {
          title: "À propos",
          subtitle: "Application et équipe",
          tagline: "Simplifiez votre vie d'enseignant",
          description:
            "L'application FOBS SMS Teachers est conçue pour aider les enseignants à gérer leurs classes, suivre les performances des élèves et simplifier les tâches administratives quotidiennes.",
          features: "Fonctionnalités",
          developer: "Développeur",
          bio: "Passionné par l'éducation et la technologie, je développe des solutions innovantes pour transformer la gestion scolaire.",
          links: "Liens utiles",
          website: "Site web",
          privacy: "Politique de confidentialité",
          call: "Appeler le support",
          rights: "Tous droits réservés",
        }
      : {
          title: "About",
          subtitle: "The app and the team",
          tagline: "Simplify your teaching life",
          description:
            "The FOBS SMS Teachers app is designed to help teachers manage their classes, track student performance, and simplify daily administrative tasks.",
          features: "Features",
          developer: "Developer",
          bio: "Passionate about education and technology, I build innovative solutions to transform school management.",
          links: "Useful links",
          website: "Website",
          privacy: "Privacy policy",
          call: "Call support",
          rights: "All rights reserved",
        };

  return (
    <Screen scroll bottomInset={false}>
      <AppHeader title={copy.title} subtitle={copy.subtitle} back />

      <Card variant="raised" style={styles.hero}>
        <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="school" size={36} color={colors.onPrimary} />
        </View>
        <Text style={[typography.heading, { color: colors.text }]}>
          FOBS SMS Teachers
        </Text>
        <Chip label={`v${Config.appVersion || "1.0.0"}`} tone="primary" />
        <Text
          style={[typography.caption, { color: colors.textSecondary, textAlign: "center" }]}
        >
          {copy.tagline}
        </Text>
      </Card>

      <Card>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {copy.description}
        </Text>
      </Card>

      <SectionHeader title={copy.features} />
      <View style={styles.featureGrid}>
        {features.map((feature) => (
          <Card key={feature.title} style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: colors.primarySoft }]}>
              <FontAwesome5 name={feature.icon} size={17} color={colors.primary} />
            </View>
            <Text style={[typography.label, { color: colors.text }]}>
              {language === "fr" ? feature.titleFr : feature.title}
            </Text>
            <Text style={[typography.micro, { color: colors.textSecondary }]}>
              {language === "fr" ? feature.descriptionFr : feature.description}
            </Text>
          </Card>
        ))}
      </View>

      <SectionHeader title={copy.developer} />
      <Card style={{ gap: spacing.sm }}>
        <View style={styles.developerHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[typography.heading, { color: colors.onPrimary }]}>BF</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>
              Boreil Fobasso
            </Text>
            <Text style={[typography.caption, { color: colors.primary }]}>
              Full-Stack &amp; AI Engineer
            </Text>
          </View>
        </View>
        <Text style={[typography.body, { color: colors.textSecondary }]}>{copy.bio}</Text>
        <View style={styles.contactButtons}>
          <ContactButton
            icon="globe-outline"
            label="Portfolio"
            tint={colors.primary}
            onPress={open("https://fobs.dev")}
          />
          <ContactButton
            icon="logo-whatsapp"
            label="WhatsApp"
            tint="#25D366"
            onPress={open("https://wa.me/237671820738")}
          />
          <ContactButton
            icon="mail-outline"
            label="Email"
            tint={colors.error}
            onPress={open("mailto:fobsboreil@gmail.com")}
          />
        </View>
      </Card>

      <SectionHeader title={copy.links} />
      <Card style={styles.flush}>
        <LinkRow
          icon="globe-outline"
          label={copy.website}
          trailing="external-link"
          onPress={open("https://fobssms.com")}
        />
        <Divider inset={spacing.md} />
        <LinkRow
          icon="shield-checkmark-outline"
          label={copy.privacy}
          trailing="external-link"
          onPress={open("https://fobssms.com/privacy")}
        />
        <Divider inset={spacing.md} />
        <LinkRow
          icon="call-outline"
          label={copy.call}
          trailing="phone"
          onPress={open("tel:+237671820738")}
        />
      </Card>

      <View style={styles.footer}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          © {new Date().getFullYear()} FOBS SMS
        </Text>
        <Text style={[typography.micro, { color: colors.textMuted }]}>{copy.rights}</Text>
      </View>
    </Screen>
  );
}

function ContactButton({
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
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.contactButton, { backgroundColor: `${tint}1F` }]}
    >
      <Ionicons name={icon} size={18} color={tint} />
      <Text numberOfLines={1} style={[typography.micro, { color: tint }]}>
        {label}
      </Text>
    </PressableScale>
  );
}

function LinkRow({
  icon,
  label,
  trailing,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  trailing: React.ComponentProps<typeof Feather>["name"];
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <PressableScale
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      scaleTo={0.99}
      style={styles.linkRow}
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{label}</Text>
      <Feather name={trailing} size={17} color={colors.textMuted} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: spacing.xs },
  appIcon: {
    width: 68,
    height: 68,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxs,
  },
  featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  featureCard: { flexBasis: "47%", flexGrow: 1, gap: 5, padding: spacing.sm },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  developerHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  contactButtons: { flexDirection: "row", gap: spacing.xs },
  contactButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: spacing.xs,
  },
  flush: { padding: 0, overflow: "hidden" },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  footer: { alignItems: "center", gap: 2, paddingVertical: spacing.lg },
});
