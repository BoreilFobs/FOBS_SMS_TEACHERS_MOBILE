import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  AppHeader,
  Button,
  Card,
  ErrorState,
  LoadingState,
  SchoolSelector,
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
import { useSocial } from "@/social/hooks/useSocial";
import { CURRENT_TEACHER_ID } from "@/social/models";

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { language, t } = useLanguage();
  const user = useUserStore((store) => store.user);
  const teacher = useUserStore((store) => store.teacher);
  const schools = useSchoolStore((store) => store.schools);
  const activeSchools = schools.filter(
    (school) =>
      school.status === "active" && school.pivot?.is_approved !== false,
  );
  const { snapshot } = useSocial();
  const socialProfile = snapshot.teachers.find(
    (candidate) => candidate.id === CURRENT_TEACHER_ID,
  );
  const {
    profile,
    state,
    error,
    reload,
    completion,
    totalExperience,
  } = useProfessionalProfile();

  const copy =
    language === "fr"
      ? {
          title: "Profil",
          subtitle: "Identité professionnelle et compte",
          complete: "Profil complété",
          experience: "années d’expérience",
          view: "Voir le profil partagé",
          edit: "Gérer le profil",
          overview: "Aperçu professionnel",
          schools: "Affectations scolaires actuelles",
          managed: "Géré par l’établissement",
          account: "Compte et préférences",
          personal: "Informations personnelles",
          personalHelp: "Nom, photo, téléphone et informations privées",
          settings: "Paramètres",
          settingsHelp: "Langue, thème, sécurité et assistance",
        }
      : {
          title: "Profile",
          subtitle: "Professional identity and account",
          complete: "Profile complete",
          experience: "years of experience",
          view: "View shared profile",
          edit: "Manage profile",
          overview: "Professional overview",
          schools: "Current school assignments",
          managed: "Managed by the school",
          account: "Account and preferences",
          personal: "Personal information",
          personalHelp: "Name, photo, phone, and private information",
          settings: "Settings",
          settingsHelp: "Language, theme, security, and support",
        };

  if (state === "loading" || state === "idle") {
    return (
      <Screen>
        <LoadingState rows={6} />
      </Screen>
    );
  }
  if (state === "error" || !profile) {
    return (
      <Screen>
        <ErrorState
          message={error ?? "Unable to load profile."}
          onRetry={reload}
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
    <Screen scroll>
      <AppHeader
        title={copy.title}
        subtitle={copy.subtitle}
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.settings}
            onPress={() => router.push("/settings")}
            style={[styles.settings, { backgroundColor: colors.surfaceMuted }]}
          >
            <Ionicons name="settings-outline" size={21} color={colors.text} />
          </Pressable>
        }
      />
      <Card style={styles.hero}>
        <View style={styles.identity}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photo} />
          ) : (
            <View
              style={[styles.photo, { backgroundColor: colors.primarySoft }]}
            >
              <Feather name="user" size={32} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1, gap: 3 }}>
            <View style={styles.inline}>
              <Text
                numberOfLines={2}
                style={[typography.heading, { color: colors.text, flexShrink: 1 }]}
              >
                {user?.name ?? (language === "fr" ? "Enseignant" : "Teacher")}
              </Text>
              {profile.verified ? (
                <Feather name="check-circle" size={17} color={colors.primary} />
              ) : null}
            </View>
            <Text
              style={[typography.body, { color: colors.textSecondary }]}
              numberOfLines={3}
            >
              {profile.headline}
            </Text>
            <View style={styles.inline}>
              <Feather name="map-pin" size={14} color={colors.textMuted} />
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {profile.city}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.progressHeader}>
          <Text style={[typography.label, { color: colors.text }]}>
            {completion}% {copy.complete}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {totalExperience} {copy.experience}
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${completion}%` },
            ]}
          />
        </View>
        <View style={styles.buttonRow}>
          <View style={{ flex: 1 }}>
            <Button
              label={copy.view}
              variant="secondary"
              onPress={() => router.push("/profile/public")}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={copy.edit}
              onPress={() => router.push("/profile/edit")}
            />
          </View>
        </View>
      </Card>

      <View style={styles.socialStats}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: "/social/connections", params: { type: "followers" } })}
          style={styles.socialStat}
        >
          <Text style={[typography.heading, { color: colors.text }]}>
            {socialProfile?.followerCount ?? 0}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {t("followers")}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: "/social/connections", params: { type: "following" } })}
          style={styles.socialStat}
        >
          <Text style={[typography.heading, { color: colors.text }]}>
            {socialProfile?.followingCount ?? 0}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {t("following")}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: "/social/profile/[id]", params: { id: CURRENT_TEACHER_ID } })}
          style={styles.socialStat}
        >
          <Text style={[typography.heading, { color: colors.text }]}>
            {snapshot.posts.filter((post) => post.authorId === CURRENT_TEACHER_ID).length}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {t("posts")}
          </Text>
        </Pressable>
      </View>

      <SectionHeader title={t("social_feed")} />
      <ProfileLink
        icon="document-text-outline"
        title={t("profile_posts")}
        subtitle={t("professional_profile")}
        onPress={() => router.push({ pathname: "/social/profile/[id]", params: { id: CURRENT_TEACHER_ID } })}
      />
      <ProfileLink
        icon="bookmark-outline"
        title={t("saved_posts")}
        subtitle={t("saved")}
        onPress={() => router.push("/social/saved")}
      />
      <ProfileLink
        icon="briefcase-outline"
        title={t("my_applications")}
        subtitle={t("jobs")}
        onPress={() => router.push("/social/applications")}
      />
      <ProfileLink
        icon="ban-outline"
        title={t("blocked_accounts")}
        subtitle={t("account_settings")}
        onPress={() => router.push("/social/blocked")}
      />

      <SectionHeader title={copy.overview} />
      <Card>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {profile.biography}
        </Text>
        <View style={styles.chips}>
          {[profile.primaryField, ...profile.additionalFields]
            .filter(Boolean)
            .map((field) => (
              <StatusChip key={field} label={field} tone="info" />
            ))}
        </View>
      </Card>

      <SectionHeader title={copy.schools} />
      <SchoolSelector />
      <View style={styles.list}>
        {activeSchools.map((school) => (
          <Card key={school.id}>
            <View style={styles.assignment}>
              <View
                style={[
                  styles.schoolIcon,
                  { backgroundColor: colors.primarySoft },
                ]}
              >
                <Feather name="home" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>
                  {school.name}
                </Text>
                <Text
                  style={[typography.caption, { color: colors.textSecondary }]}
                >
                  {school.code} · {copy.managed}
                </Text>
              </View>
              <StatusChip
                label={language === "fr" ? "Active" : "Active"}
                tone="success"
                icon="check"
              />
            </View>
          </Card>
        ))}
      </View>
      <ProfileLink
        icon="add-circle-outline"
        title={language === "fr" ? "Ajouter une école" : "Add a school"}
        subtitle={
          language === "fr"
            ? "Demander une nouvelle affectation"
            : "Request a new school assignment"
        }
        onPress={() => router.push("/schools/add")}
      />

      <SectionHeader title={copy.account} />
      <ProfileLink
        icon="person-outline"
        title={copy.personal}
        subtitle={copy.personalHelp}
        onPress={() => router.push("/settings/edit-profile")}
      />
      <ProfileLink
        icon="settings-outline"
        title={copy.settings}
        subtitle={copy.settingsHelp}
        onPress={() => router.push("/settings")}
      />
    </Screen>
  );
}

function ProfileLink({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Card onPress={onPress}>
      <View style={styles.assignment}>
        <View
          style={[styles.schoolIcon, { backgroundColor: colors.surfaceMuted }]}
        >
          <Ionicons name={icon} size={21} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>
            {title}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        </View>
        <Feather name="chevron-right" size={19} color={colors.textMuted} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  settings: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { gap: spacing.md },
  identity: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  photo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  inline: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  buttonRow: { flexDirection: "row", gap: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.md },
  list: { gap: spacing.sm },
  assignment: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  socialStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: spacing.xs,
  },
  socialStat: {
    minWidth: 88,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  schoolIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
