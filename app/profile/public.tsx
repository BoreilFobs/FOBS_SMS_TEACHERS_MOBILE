import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AuthWrapper from "@/components/AuthWrapper";
import {
  AppHeader,
  Card,
  EmptyState,
  LoadingState,
  Screen,
  SectionHeader,
  StatusChip,
} from "@/components/ui";
import { useProfessionalProfile } from "@/contexts/ProfessionalProfileContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { radii, spacing, typography } from "@/constants/theme";
import useUserStore from "@/utils/stores/userStore";
import useSchoolStore from "@/utils/stores/schoolStore";
import Config from "@/constants/Config";

export default function PublicProfileRoute() {
  return (
    <AuthWrapper>
      <PublicProfessionalProfile />
    </AuthWrapper>
  );
}

function PublicProfessionalProfile() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const user = useUserStore((store) => store.user);
  const teacher = useUserStore((store) => store.teacher);
  const schools = useSchoolStore((store) => store.schools);
  const activeSchools = schools.filter(
    (school) =>
      school.status === "active" && school.pivot?.is_approved !== false,
  );
  const { profile, state, totalExperience } = useProfessionalProfile();

  if (state === "idle" || state === "loading") {
    return (
      <Screen bottomInset={false}>
        <LoadingState rows={6} />
      </Screen>
    );
  }
  if (!profile) {
    return (
      <Screen bottomInset={false}>
        <EmptyState
          icon="user"
          title={language === "fr" ? "Profil indisponible" : "Profile unavailable"}
          message={
            language === "fr"
              ? "Ce profil professionnel ne peut pas être affiché."
              : "This professional profile cannot be displayed."
          }
        />
      </Screen>
    );
  }

  const imageUri = teacher?.profile_photo
    ? teacher.profile_photo.startsWith("http")
      ? teacher.profile_photo
      : `${Config.webBaseUrl}/storage/${teacher.profile_photo}`
    : null;

  return (
    <Screen scroll bottomInset={false}>
      <AppHeader
        title={language === "fr" ? "Profil professionnel" : "Professional profile"}
        subtitle={
          language === "fr"
            ? "Visible par les utilisateurs FobsSMS authentifiés"
            : "Visible to authenticated FobsSMS users"
        }
        onBack={() => router.back()}
      />
      <View style={styles.hero}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, { backgroundColor: colors.primarySoft }]}>
            <Feather name="user" size={40} color={colors.primary} />
          </View>
        )}
        <Text style={[typography.title, { color: colors.text, textAlign: "center" }]}>
          {user?.name ?? (language === "fr" ? "Enseignant" : "Teacher")}
        </Text>
        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, textAlign: "center" },
          ]}
        >
          {profile.headline}
        </Text>
        <View style={styles.inline}>
          <Feather name="map-pin" size={15} color={colors.textMuted} />
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {profile.city}
          </Text>
          {profile.verified ? (
            <StatusChip
              label={language === "fr" ? "Vérifié" : "Verified"}
              tone="success"
              icon="check-circle"
            />
          ) : null}
        </View>
      </View>

      <Card>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {profile.biography}
        </Text>
      </Card>

      <View style={styles.stats}>
        <Stat
          value={`${totalExperience}`}
          label={language === "fr" ? "Années d’expérience" : "Years’ experience"}
        />
        <Stat
          value={`${profile.subjects.length}`}
          label={language === "fr" ? "Matières" : "Subjects"}
        />
        <Stat
          value={`${profile.qualifications.length}`}
          label={language === "fr" ? "Qualifications" : "Qualifications"}
        />
      </View>

      <SectionHeader
        title={language === "fr" ? "Spécialisations" : "Teaching specializations"}
      />
      <Card>
        <View style={styles.chips}>
          {[
            profile.primaryField,
            ...profile.additionalFields,
            ...profile.expertise,
          ].map((item) => (
            <StatusChip key={item} label={item} tone="info" />
          ))}
        </View>
        <LabelValue
          label={language === "fr" ? "Matières" : "Subjects"}
          value={profile.subjects.join(", ")}
        />
        <LabelValue
          label={language === "fr" ? "Niveaux" : "Levels"}
          value={profile.levels.join(", ")}
        />
      </Card>

      <SectionHeader
        title={language === "fr" ? "Qualifications" : "Qualifications"}
      />
      {profile.qualifications.map((item) => (
        <TimelineCard
          key={item.id}
          title={item.degree}
          subtitle={`${item.field} · ${item.institution}`}
          detail={`${item.location} · ${item.graduationYear}`}
        />
      ))}

      <SectionHeader
        title={language === "fr" ? "Certifications" : "Certifications"}
      />
      {profile.certifications.map((item) => (
        <TimelineCard
          key={item.id}
          title={item.name}
          subtitle={item.issuer}
          detail={new Intl.DateTimeFormat(
            language === "fr" ? "fr-FR" : "en-GB",
            { year: "numeric", month: "short" },
          ).format(new Date(item.issueDate))}
        />
      ))}

      <SectionHeader
        title={language === "fr" ? "Expérience" : "Professional experience"}
      />
      {profile.experience.map((item) => (
        <TimelineCard
          key={item.id}
          title={item.role}
          subtitle={item.organization}
          detail={`${item.startDate.slice(0, 4)} – ${
            item.current
              ? language === "fr"
                ? "Aujourd’hui"
                : "Present"
              : item.endDate?.slice(0, 4)
          }`}
          body={item.responsibilities}
        />
      ))}

      <SectionHeader
        title={language === "fr" ? "Compétences" : "Skills and competencies"}
      />
      <Card>
        <View style={styles.chips}>
          {profile.skills.map((skill) => (
            <StatusChip key={skill} label={skill} />
          ))}
        </View>
      </Card>

      <SectionHeader title={language === "fr" ? "Langues" : "Languages"} />
      <Card>
        <View style={styles.list}>
          {profile.languages.map((item) => (
            <View key={item.id} style={styles.languageRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text
                  style={[typography.caption, { color: colors.textSecondary }]}
                >
                  {language === "fr" ? "Oral" : "Spoken"}: {item.spoken} ·{" "}
                  {language === "fr" ? "Écrit" : "Written"}: {item.written}
                </Text>
              </View>
              {item.usedForTeaching ? (
                <StatusChip
                  label={language === "fr" ? "Enseignement" : "Teaching"}
                  tone="info"
                />
              ) : null}
            </View>
          ))}
        </View>
      </Card>

      {profile.visibility.currentSchools && activeSchools.length > 0 ? (
        <>
          <SectionHeader
            title={language === "fr" ? "Établissements actuels" : "Current schools"}
          />
          <Card>
            <View style={styles.list}>
              {activeSchools.map((school) => (
                <View key={school.id} style={styles.languageRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyStrong, { color: colors.text }]}>
                      {school.name}
                    </Text>
                    <Text
                      style={[typography.caption, { color: colors.textSecondary }]}
                    >
                      {school.code}
                    </Text>
                  </View>
                  <StatusChip label="Active" tone="success" />
                </View>
              ))}
            </View>
          </Card>
        </>
      ) : null}

      {(profile.visibility.professionalEmail && profile.professionalEmail) ||
      (profile.visibility.professionalPhone && profile.professionalPhone) ? (
        <>
          <SectionHeader
            title={language === "fr" ? "Contact professionnel" : "Professional contact"}
          />
          <Card>
            {profile.visibility.professionalEmail && profile.professionalEmail ? (
              <LabelValue label="Email" value={profile.professionalEmail} />
            ) : null}
            {profile.visibility.professionalPhone && profile.professionalPhone ? (
              <LabelValue
                label={language === "fr" ? "Téléphone" : "Phone"}
                value={profile.professionalPhone}
              />
            ) : null}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const { colors } = useAppTheme();
  return (
    <Card style={styles.stat}>
      <Text style={[typography.title, { color: colors.primary }]}>{value}</Text>
      <Text
        style={[typography.caption, { color: colors.textSecondary, textAlign: "center" }]}
      >
        {label}
      </Text>
    </Card>
  );
}

function LabelValue({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.labelValue}>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[typography.body, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function TimelineCard({
  title,
  subtitle,
  detail,
  body,
}: {
  title: string;
  subtitle: string;
  detail: string;
  body?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Card>
      <Text style={[typography.bodyStrong, { color: colors.text }]}>{title}</Text>
      <Text style={[typography.body, { color: colors.textSecondary }]}>
        {subtitle}
      </Text>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{detail}</Text>
      {body ? (
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          {body}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.sm },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  inline: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.xs },
  stats: { flexDirection: "row", gap: spacing.xs },
  stat: { flex: 1, minHeight: 110, alignItems: "center", justifyContent: "center", gap: spacing.xxs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  labelValue: { gap: 2, marginTop: spacing.md },
  list: { gap: spacing.sm },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
  },
});
