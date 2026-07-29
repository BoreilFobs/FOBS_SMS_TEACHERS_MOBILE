import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AuthWrapper from "@/components/AuthWrapper";
import { AppHeader, Card, Screen, StatusChip } from "@/components/ui";
import { useProfessionalProfile } from "@/contexts/ProfessionalProfileContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { radii, spacing, typography } from "@/constants/theme";
import type { ProfileSectionKey } from "@/models/professionalProfile";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export default function EditProfileRoute() {
  return (
    <AuthWrapper>
      <EditProfileIndex />
    </AuthWrapper>
  );
}

function EditProfileIndex() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const { completion } = useProfessionalProfile();

  const sections: Array<{
    key: ProfileSectionKey | "personal";
    icon: IconName;
    title: string;
    subtitle: string;
    private?: boolean;
  }> =
    language === "fr"
      ? [
          { key: "personal", icon: "person-outline", title: "Informations personnelles", subtitle: "Nom, photo, téléphone et adresse privée", private: true },
          { key: "summary", icon: "document-text-outline", title: "Résumé professionnel", subtitle: "Titre, ville et biographie" },
          { key: "qualifications", icon: "school-outline", title: "Qualifications", subtitle: "Diplômes et études" },
          { key: "certifications", icon: "ribbon-outline", title: "Certifications", subtitle: "Certificats et accréditations" },
          { key: "experience", icon: "briefcase-outline", title: "Expérience", subtitle: "Parcours et réalisations" },
          { key: "specializations", icon: "library-outline", title: "Spécialisations", subtitle: "Matières, niveaux et expertises" },
          { key: "skills", icon: "sparkles-outline", title: "Compétences", subtitle: "Compétences professionnelles" },
          { key: "languages", icon: "language-outline", title: "Langues", subtitle: "Niveaux oral, écrit et enseignement" },
          { key: "documents", icon: "folder-outline", title: "Documents privés", subtitle: "CV et métadonnées des justificatifs", private: true },
          { key: "visibility", icon: "eye-outline", title: "Visibilité et préférences", subtitle: "Contrôler les informations partagées" },
        ]
      : [
          { key: "personal", icon: "person-outline", title: "Personal details", subtitle: "Name, photo, phone, and private address", private: true },
          { key: "summary", icon: "document-text-outline", title: "Professional summary", subtitle: "Headline, city, and biography" },
          { key: "qualifications", icon: "school-outline", title: "Qualifications", subtitle: "Degrees and education" },
          { key: "certifications", icon: "ribbon-outline", title: "Certifications", subtitle: "Certificates and credentials" },
          { key: "experience", icon: "briefcase-outline", title: "Experience", subtitle: "Roles, responsibilities, and achievements" },
          { key: "specializations", icon: "library-outline", title: "Specializations", subtitle: "Subjects, levels, and expertise" },
          { key: "skills", icon: "sparkles-outline", title: "Skills", subtitle: "Professional competencies" },
          { key: "languages", icon: "language-outline", title: "Languages", subtitle: "Spoken, written, and teaching proficiency" },
          { key: "documents", icon: "folder-outline", title: "Private documents", subtitle: "CV and evidence metadata", private: true },
          { key: "visibility", icon: "eye-outline", title: "Visibility and preferences", subtitle: "Control information shared with users" },
        ];

  return (
    <Screen scroll bottomInset={false}>
      <AppHeader
        title={language === "fr" ? "Gérer le profil" : "Manage profile"}
        subtitle={`${completion}% ${
          language === "fr" ? "complété" : "complete"
        }`}
        onBack={() => router.back()}
      />
      <Card>
        <View style={styles.guidance}>
          <View
            style={[styles.guidanceIcon, { backgroundColor: colors.primarySoft }]}
          >
            <Feather name="shield" size={21} color={colors.primary} />
          </View>
          <Text style={[typography.body, { color: colors.textSecondary, flex: 1 }]}>
            {language === "fr"
              ? "Les documents, coordonnées privées et informations de sécurité ne sont jamais affichés sur le profil partagé."
              : "Documents, private contact details, and security information are never shown on the shared profile."}
          </Text>
        </View>
      </Card>
      <View style={styles.list}>
        {sections.map((section) => (
          <Card
            key={section.key}
            onPress={() =>
              section.key === "personal"
                ? router.push("/settings/edit-profile")
                : router.push(`/profile/edit/${section.key}`)
            }
          >
            <View style={styles.row}>
              <View
                style={[styles.icon, { backgroundColor: colors.surfaceMuted }]}
              >
                <Ionicons name={section.icon} size={21} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>
                    {section.title}
                  </Text>
                  {section.private ? (
                    <StatusChip
                      label={language === "fr" ? "Privé" : "Private"}
                      icon="lock"
                    />
                  ) : null}
                </View>
                <Text
                  style={[typography.caption, { color: colors.textSecondary }]}
                >
                  {section.subtitle}
                </Text>
              </View>
              <Feather name="chevron-right" size={19} color={colors.textMuted} />
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  guidance: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  guidanceIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
});

