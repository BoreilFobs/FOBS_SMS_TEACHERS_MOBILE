import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Config from "@/constants/Config";
import {
  AppHeader,
  Card,
  EmptyState,
  SchoolSelector,
  SectionHeader,
  StatusChip,
} from "@/components/ui";
import { AnnouncementCard, ForumPostCard } from "@/components/updates/Cards";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUpdates } from "@/contexts/UpdatesContext";
import { useProfessionalProfile } from "@/contexts/ProfessionalProfileContext";
import useSchoolStore from "@/utils/stores/schoolStore";
import useUserStore from "@/utils/stores/userStore";
import { radii, spacing, typography } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authFetch } from "@/services/authFetch";

interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  totalSubjects: number;
  overallPassRate: number;
}

interface RecentActivity {
  id: number;
  type: "marks" | "attendance" | "report";
  description: string;
  descriptionFr?: string;
  time: string;
}

const initialStats: DashboardStats = {
  totalClasses: 0,
  totalStudents: 0,
  totalSubjects: 0,
  overallPassRate: 0,
};

export default function SchoolWorkspaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const activeSchool = useSchoolStore((store) => store.activeSchool);
  const { user, teacher, loadUserData } = useUserStore();
  const updates = useUpdates();
  const { completion } = useProfessionalProfile();
  const [stats, setStats] = useState(initialStats);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !teacher) void loadUserData();
  }, [loadUserData, teacher, user]);

  const loadDashboard = useCallback(async () => {
    if (!activeSchool || !teacher) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setDashboardError(null);
    try {
      const response = await authFetch(
        `${Config.apiBaseUrl}/teacher/dashboard?school_id=${activeSchool.id}&teacher_id=${teacher.id}`,
      );
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to load dashboard data.");
      }
      setStats({
        totalClasses: Number(payload.stats?.totalClasses ?? 0),
        totalStudents: Number(payload.stats?.totalStudents ?? 0),
        totalSubjects: Number(payload.stats?.totalSubjects ?? 0),
        overallPassRate: Number(payload.stats?.overallPassRate ?? 0),
      });
      setActivity(payload.recentActivity ?? []);
    } catch (loadError) {
      setDashboardError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to refresh school information.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSchool, teacher]);

  useEffect(() => {
    setLoading(true);
    void loadDashboard();
  }, [loadDashboard]);

  const copy =
    language === "fr"
      ? {
          title: "Accueil",
          schoolContext: "Contexte de travail",
          overview: "Aujourd’hui",
          classes: "Classes",
          students: "Élèves",
          subjects: "Matières",
          actions: "Actions prioritaires",
          attendance: "Faire l’appel",
          attendanceHelp: "Choisir une classe",
          marks: "Saisir les notes",
          marksHelp: "Choisir matière et séquence",
          assignments: "Voir mes classes",
          assignmentsHelp: "Classes et matières assignées",
          updates: "À ne pas manquer",
          notifications: "Voir les notifications",
          recent: "Activité scolaire récente",
          profile: "Compléter le profil",
          profileMessage:
            "Ajoutez vos qualifications et spécialisations professionnelles.",
          noSchool: "Sélectionnez une école",
          noSchoolMessage:
            "Choisissez votre école actuelle pour séparer correctement classes, présences et notes.",
          liveUnavailable: "Les données scolaires en direct ne sont pas disponibles.",
        }
      : {
          title: "Home",
          schoolContext: "Working context",
          overview: "Today",
          classes: "Classes",
          students: "Students",
          subjects: "Subjects",
          actions: "Priority actions",
          attendance: "Take attendance",
          attendanceHelp: "Choose a class",
          marks: "Enter marks",
          marksHelp: "Choose subject and sequence",
          assignments: "View my classes",
          assignmentsHelp: "Assigned classes and subjects",
          updates: "Don’t miss",
          notifications: "View notifications",
          recent: "Recent school activity",
          profile: "Complete your profile",
          profileMessage:
            "Add professional qualifications and teaching specializations.",
          noSchool: "Select a school",
          noSchoolMessage:
            "Choose your current school so classes, attendance, and marks stay safely separated.",
          liveUnavailable: "Live school data is currently unavailable.",
        };

  const greeting = getGreeting(language);
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? "Teacher";
  const latestAnnouncement = [...updates.announcements]
    .filter(
      (item) => !activeSchool || item.schoolId === activeSchool.id,
    )
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))[0];
  const latestForum = [...updates.forumPosts].sort(
    (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt),
  )[0];
  const marksAttention = updates.notifications.filter(
    (item) => item.category === "marks" && !item.isRead,
  ).length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + 92 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void Promise.all([loadDashboard(), updates.reload()]);
            }}
            tintColor={colors.primary}
          />
        }
      >
        <AppHeader
          title={`${greeting}, ${firstName}`}
          subtitle={new Intl.DateTimeFormat(
            language === "fr" ? "fr-FR" : "en-GB",
            { weekday: "long", day: "numeric", month: "long" },
          ).format(new Date())}
          action={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.notifications}
              onPress={() => router.push("/(tabs)/updates?tab=notifications")}
              style={[
                styles.notificationButton,
                { backgroundColor: colors.surface },
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={colors.text}
              />
              {updates.unreadCount > 0 ? (
                <View
                  style={[styles.notificationDot, { backgroundColor: colors.error }]}
                >
                  <Text style={styles.notificationCount}>
                    {Math.min(updates.unreadCount, 9)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          }
        />

        <SectionHeader title={copy.schoolContext} />
        <SchoolSelector />

        {!activeSchool ? (
          <EmptyState
            icon="home"
            title={copy.noSchool}
            message={copy.noSchoolMessage}
          />
        ) : (
          <>
            <SectionHeader title={copy.overview} />
            {dashboardError ? (
              <View
                style={[
                  styles.inlineNotice,
                  { backgroundColor: colors.warningSoft },
                ]}
              >
                <Feather name="wifi-off" size={17} color={colors.warning} />
                <Text
                  style={[
                    typography.caption,
                    { color: colors.warning, flex: 1 },
                  ]}
                >
                  {copy.liveUnavailable}
                </Text>
                <Pressable onPress={() => void loadDashboard()} hitSlop={8}>
                  <Text style={[typography.label, { color: colors.warning }]}>
                    {language === "fr" ? "Réessayer" : "Retry"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.stats}>
              <Stat
                icon="users"
                value={loading ? "—" : String(stats.totalClasses)}
                label={copy.classes}
              />
              <Stat
                icon="user"
                value={loading ? "—" : String(stats.totalStudents)}
                label={copy.students}
              />
              <Stat
                icon="book-open"
                value={loading ? "—" : String(stats.totalSubjects)}
                label={copy.subjects}
              />
            </View>

            <SectionHeader title={copy.actions} />
            <View style={styles.actions}>
              <ActionRow
                icon="check-square"
                title={copy.attendance}
                subtitle={copy.attendanceHelp}
                onPress={() => router.push("/(tabs)/attendance")}
              />
              <ActionRow
                icon="edit-3"
                title={copy.marks}
                subtitle={
                  marksAttention
                    ? `${marksAttention} ${
                        language === "fr"
                          ? "élément à vérifier"
                          : "item needs attention"
                      }`
                    : copy.marksHelp
                }
                status={
                  marksAttention ? (
                    <StatusChip
                      label={language === "fr" ? "À faire" : "To do"}
                      tone="warning"
                    />
                  ) : undefined
                }
                onPress={() => router.push("/(tabs)/subjects")}
              />
              <ActionRow
                icon="layers"
                title={copy.assignments}
                subtitle={copy.assignmentsHelp}
                onPress={() => router.push("/(tabs)/classes")}
              />
            </View>

            {(latestAnnouncement || latestForum) && (
              <SectionHeader
                title={copy.updates}
                actionLabel={language === "fr" ? "Tout voir" : "See all"}
                onAction={() => router.push("/(tabs)/updates")}
              />
            )}
            {latestAnnouncement ? (
              <AnnouncementCard
                announcement={latestAnnouncement}
                onPress={() =>
                  router.push(
                    `/updates/announcements/${latestAnnouncement.id}`,
                  )
                }
              />
            ) : null}
            {latestForum ? (
              <ForumPostCard
                post={latestForum}
                onPress={() => router.push(`/updates/forum/${latestForum.id}`)}
              />
            ) : null}

            {completion < 100 ? (
              <Card
                onPress={() => router.push("/profile/edit")}
                accessibilityLabel={copy.profile}
              >
                <View style={styles.profilePrompt}>
                  <View
                    style={[
                      styles.actionIcon,
                      { backgroundColor: colors.primarySoft },
                    ]}
                  >
                    <Feather name="user-check" size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[typography.bodyStrong, { color: colors.text }]}
                    >
                      {copy.profile} · {completion}%
                    </Text>
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {copy.profileMessage}
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={19}
                    color={colors.textMuted}
                  />
                </View>
              </Card>
            ) : null}

            {activity.length > 0 ? (
              <>
                <SectionHeader title={copy.recent} />
                <Card>
                  <View style={styles.activityList}>
                    {activity.slice(0, 3).map((item) => (
                      <View key={item.id} style={styles.activityRow}>
                        <View
                          style={[
                            styles.activityDot,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[typography.body, { color: colors.text }]}
                          >
                            {language === "fr" && item.descriptionFr
                              ? item.descriptionFr
                              : item.description}
                          </Text>
                          <Text
                            style={[
                              typography.caption,
                              { color: colors.textMuted },
                            ]}
                          >
                            {item.time}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </Card>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  value: string;
  label: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Card style={styles.stat}>
      <Feather name={icon} size={19} color={colors.primary} />
      <Text style={[typography.heading, { color: colors.text }]}>{value}</Text>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </Card>
  );
}

function ActionRow({
  icon,
  title,
  subtitle,
  status,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  subtitle: string;
  status?: React.ReactNode;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Card onPress={onPress}>
      <View style={styles.actionRow}>
        <View
          style={[styles.actionIcon, { backgroundColor: colors.primarySoft }]}
        >
          <Feather name={icon} size={21} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>
            {title}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        </View>
        {status ?? (
          <Feather name="chevron-right" size={19} color={colors.textMuted} />
        )}
      </View>
    </Card>
  );
}

function getGreeting(language: "en" | "fr") {
  const hour = new Date().getHours();
  if (language === "fr") {
    return hour < 18 ? "Bonjour" : "Bonsoir";
  }
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDot: {
    position: "absolute",
    top: 5,
    right: 5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notificationCount: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  stats: { flexDirection: "row", gap: spacing.xs },
  stat: { flex: 1, minHeight: 104, gap: 3, justifyContent: "center" },
  inlineNotice: {
    minHeight: 44,
    borderRadius: radii.md,
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  actions: { gap: spacing.sm },
  actionRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  profilePrompt: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  activityList: { gap: spacing.md },
  activityRow: { flexDirection: "row", gap: spacing.sm },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
});
