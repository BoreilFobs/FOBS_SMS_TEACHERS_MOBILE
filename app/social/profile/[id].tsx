import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button, EmptyState, ErrorState, LoadingState, StatusChip } from "@/components/ui";
import { CURRENT_TEACHER_ID } from "@/social/models";
import { useSocial } from "@/social/hooks/useSocial";
import { useSocialResource } from "@/social/hooks/useSocialResource";
import { Avatar } from "@/social/components/Avatar";
import { PostCard } from "@/social/components/PostCard";
import { radii, spacing, typography } from "@/constants/theme";

type ProfileFeed = "posts" | "reshares";

export default function SocialProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { repository, snapshot } = useSocial();
  const [feed, setFeed] = useState<ProfileFeed>("posts");
  const teacher = snapshot.teachers.find((candidate) => candidate.id === id);
  const isOwn = id === CURRENT_TEACHER_ID;

  // The profile and its posts are both server-side now. The posts endpoint is
  // per-tab, so switching between posts and reshares refetches.
  const { loading, error, retry } = useSocialResource(
    async () => {
      await repository.getTeacher(id);
      await repository.getTeacherPosts(id, feed);
    },
    { enabled: Boolean(id) },
  );

  const mutual = teacher?.followedByCurrentUser && teacher.followsCurrentUser;
  const posts = useMemo(
    () =>
      snapshot.posts.filter(
        (post) =>
          post.authorId === id &&
          (feed === "reshares"
            ? post.type === "reshare" || post.type === "quote"
            : post.type !== "reshare" && post.type !== "quote"),
      ),
    [feed, id, snapshot.posts],
  );

  if (loading && !teacher) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.feedBackground, paddingTop: insets.top }]}>
        <ProfileHeader onBack={() => router.back()} />
        <LoadingState rows={3} />
      </View>
    );
  }

  if (error && !teacher) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.feedBackground, paddingTop: insets.top }]}>
        <ProfileHeader onBack={() => router.back()} />
        <ErrorState message={error.message} onRetry={() => void retry()} />
      </View>
    );
  }

  if (!teacher || (teacher.blocked && !isOwn)) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.feedBackground, paddingTop: insets.top }]}>
        <ProfileHeader onBack={() => router.back()} />
        <EmptyState
          icon="slash"
          title={t("blocked_accounts")}
          message={t("mutual_required")}
          actionLabel={t("unblock")}
          onAction={() => teacher && void repository.unblock(teacher.id)}
        />
      </View>
    );
  }

  const messageTeacher = async () => {
    try {
      const conversation = await repository.startConversation(teacher.id);
      router.push(`/social/conversation/${conversation.id}`);
    } catch {
      Alert.alert(t("messages"), t("mutual_required"));
    }
  };

  const blockTeacher = () =>
    Alert.alert(t("block"), t("block_confirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("block"),
        style: "destructive",
        onPress: () => void repository.block(teacher.id).then(() => router.back()),
      },
    ]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.feedBackground, paddingTop: insets.top }]}>
      <ProfileHeader
        onBack={() => router.back()}
        onShare={() =>
          router.push({ pathname: "/social/share", params: { kind: "profile", id: teacher.id } })
        }
        onBlock={!isOwn ? blockTeacher : undefined}
      />
      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={{ paddingBottom: 110 }}
        ListHeaderComponent={
          <>
            <View style={[styles.hero, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <Avatar name={teacher.name} uri={teacher.photoUrl} size={92} />
              <View style={styles.nameRow}>
                <Text style={[typography.title, { color: colors.text }]}>{teacher.name}</Text>
                {teacher.verified ? <Feather name="check-circle" size={19} color={colors.primary} /> : null}
              </View>
              <Text style={[typography.body, { color: colors.textSecondary, textAlign: "center" }]}>
                {teacher.headline}
              </Text>
              <View style={styles.location}>
                <Feather name="map-pin" size={14} color={colors.textMuted} />
                <Text style={[typography.caption, { color: colors.textMuted }]}>{teacher.city}</Text>
              </View>
              <View style={styles.stats}>
                <ProfileStat value={teacher.followerCount} label={t("followers")} />
                <ProfileStat value={teacher.followingCount} label={t("following")} />
                <ProfileStat value={teacher.yearsExperience} label={t("years_experience")} />
              </View>
              <View style={styles.actionRow}>
                {isOwn ? (
                  <View style={{ flex: 1 }}>
                    <Button label={t("edit_profile")} icon="edit-2" onPress={() => router.push("/profile/edit")} />
                  </View>
                ) : (
                  <>
                    <View style={{ flex: 1 }}>
                      <Button
                        label={teacher.followedByCurrentUser ? t("following") : t("follow")}
                        variant={teacher.followedByCurrentUser ? "secondary" : "primary"}
                        onPress={() => void repository.follow(teacher.id)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        label={t("message")}
                        variant="secondary"
                        disabled={!mutual}
                        onPress={messageTeacher}
                      />
                    </View>
                  </>
                )}
              </View>
              {!isOwn && !mutual ? (
                <Text style={[typography.caption, { color: colors.textMuted, textAlign: "center" }]}>
                  {t("mutual_required")}
                </Text>
              ) : null}
            </View>
            <View style={styles.profileDetails}>
              <Text style={[typography.heading, { color: colors.text }]}>{t("professional_profile")}</Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>{teacher.biography}</Text>
              <DetailRow icon="book-open" title={t("subjects")} values={teacher.subjects} />
              <DetailRow icon="layers" title={t("educational_level")} values={teacher.levels} />
              <DetailRow icon="award" title={t("qualification")} values={teacher.qualifications} />
              <DetailRow icon="check-circle" title={t("skills")} values={teacher.skills} />
              <DetailRow icon="globe" title={t("language")} values={teacher.languages} />
              {teacher.schoolNames.length ? (
                <DetailRow icon="home" title={t("my_schools")} values={teacher.schoolNames} />
              ) : null}
              <View style={styles.chips}>
                <StatusChip
                  label={`${teacher.profileCompletion}% ${t("profile")}`}
                  tone={teacher.profileCompletion >= 80 ? "success" : "warning"}
                />
                {mutual ? <StatusChip label={t("mutual_follow")} tone="info" /> : null}
              </View>
            </View>
            <View style={[styles.feedTabs, { borderBottomColor: colors.border }]}>
              {(["posts", "reshares"] as ProfileFeed[]).map((item) => {
                const selected = feed === item;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    onPress={() => setFeed(item)}
                    style={[styles.feedTab, selected && { borderBottomColor: colors.primary }]}
                  >
                    <Text style={[typography.label, { color: selected ? colors.primary : colors.textSecondary }]}>
                      {item === "posts" ? t("posts") : t("my_reshares")}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState icon="file-text" title={t("feed_empty")} message={t("write_post")} />
        }
      />
    </View>
  );
}

function ProfileHeader({
  onBack,
  onShare,
  onBlock,
}: {
  onBack: () => void;
  onShare?: () => void;
  onBlock?: () => void;
}) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t("back")} onPress={onBack} style={styles.iconButton}>
        <Feather name="arrow-left" size={22} color={colors.text} />
      </Pressable>
      <Text style={[typography.heading, { color: colors.text }]}>{t("professional_profile")}</Text>
      <View style={styles.headerActions}>
        {onShare ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t("share")} onPress={onShare} style={styles.iconButton}>
            <Feather name="send" size={20} color={colors.text} />
          </Pressable>
        ) : null}
        {onBlock ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t("block")} onPress={onBlock} style={styles.iconButton}>
            <Ionicons name="ban-outline" size={21} color={colors.error} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ProfileStat({ value, label }: { value: number; label: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.stat}>
      <Text style={[typography.heading, { color: colors.text }]}>{value}</Text>
      <Text numberOfLines={2} style={[typography.caption, { color: colors.textMuted, textAlign: "center" }]}>
        {label}
      </Text>
    </View>
  );
}

function DetailRow({
  icon,
  title,
  values,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  values: string[];
}) {
  const { colors } = useAppTheme();
  if (!values.length) return null;
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: colors.surfaceMuted }]}>
        <Feather name={icon} size={17} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.label, { color: colors.text }]}>{title}</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>{values.join(" · ")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 58, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerActions: { flexDirection: "row" },
  iconButton: { width: 50, height: 50, alignItems: "center", justifyContent: "center" },
  hero: { alignItems: "center", padding: spacing.lg, gap: spacing.xs, borderBottomWidth: StyleSheet.hairlineWidth },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  location: { flexDirection: "row", gap: 4, alignItems: "center" },
  stats: { alignSelf: "stretch", flexDirection: "row", justifyContent: "space-around", paddingVertical: spacing.sm },
  stat: { flex: 1, alignItems: "center" },
  actionRow: { alignSelf: "stretch", flexDirection: "row", gap: spacing.sm },
  profileDetails: { padding: spacing.md, gap: spacing.sm },
  detailRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  detailIcon: { width: 36, height: 36, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  feedTabs: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  feedTab: { flex: 1, minHeight: 50, alignItems: "center", justifyContent: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
});
