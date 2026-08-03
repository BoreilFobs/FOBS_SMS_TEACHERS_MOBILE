import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { EmptyState, ErrorState, LoadingState, PressableScale } from "@/components/ui";
import { elevation, layout, radii, spacing, typography } from "@/constants/theme";
import { SocialHeader } from "@/social/components/SocialHeader";
import { PostCard } from "@/social/components/PostCard";
import { UploadBanner } from "@/social/components/UploadBanner";
import { useFeed } from "@/social/hooks/useFeed";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Avatar } from "@/social/components/Avatar";

export default function SocialHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const currentUser = useCurrentUser();
  const {
    items,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
  } = useFeed();

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.feedBackground, paddingTop: insets.top },
      ]}
    >
      <SocialHeader />
      {loading ? (
        <View style={styles.loading}>
          <LoadingState rows={3} variant="post" />
        </View>
      ) : error && !items.length ? (
        <View style={styles.loading}>
          <ErrorState message={t("feed_error")} onRetry={refresh} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(post) => post.id}
          renderItem={({ item }) => <PostCard post={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.45}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={4}
          maxToRenderPerBatch={5}
          windowSize={7}
          ListHeaderComponent={
            <View style={styles.feedHeader}>
              {/* Posts still uploading appear here, above the composer. */}
              <UploadBanner onPublished={refresh} />
              <PressableScale
                accessibilityRole="search"
                accessibilityLabel={t("global_search")}
                onPress={() => router.push("/social/search")}
                style={[
                  styles.search,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Feather name="search" size={18} color={colors.textMuted} />
                <Text style={[typography.body, { color: colors.textMuted, flex: 1 }]}>
                  {t("discover")}
                </Text>
              </PressableScale>

              <View
                style={[
                  styles.composer,
                  { backgroundColor: colors.feedCard, borderColor: colors.border },
                  elevation.raised,
                ]}
              >
                <View style={styles.composerTop}>
                  <Avatar name={currentUser.name} uri={currentUser.photoUri} size={40} />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("write_post")}
                    onPress={() => router.push("/social/compose")}
                    style={({ pressed }) => [
                      styles.prompt,
                      {
                        backgroundColor: colors.surfaceMuted,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text style={[typography.body, { color: colors.textSecondary }]}>
                      {t("write_post")}
                    </Text>
                  </Pressable>
                </View>
                <View style={[styles.composerDivider, { backgroundColor: colors.divider }]} />
                <View style={styles.composerActions}>
                  <ComposerAction
                    icon="image"
                    label={t("add_images")}
                    tint="#22C55E"
                    onPress={() =>
                      router.push({ pathname: "/social/compose", params: { type: "image" } })
                    }
                  />
                  <ComposerAction
                    icon="bar-chart-2"
                    label={t("poll")}
                    tint="#F59E0B"
                    onPress={() =>
                      router.push({ pathname: "/social/compose", params: { type: "poll" } })
                    }
                  />
                  <ComposerAction
                    icon="help-circle"
                    label={t("professional_question")}
                    tint={colors.primary}
                    onPress={() =>
                      router.push({ pathname: "/social/compose", params: { type: "question" } })
                    }
                  />
                </View>
              </View>

              {/* Entry points for the communication surfaces that used to live
                  in the management section. */}
              <View style={styles.railRow}>
                <RailLink
                  icon="volume-2"
                  label={t("announcements")}
                  onPress={() => router.push("/social/announcements")}
                />
                <RailLink
                  icon="bookmark"
                  label={t("saved")}
                  onPress={() => router.push("/social/saved")}
                />
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="users"
              title={t("feed_empty")}
              actionLabel={t("create")}
              onAction={() => router.push("/social/compose")}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.primary} style={styles.footer} />
            ) : error && items.length ? (
              <Pressable
                accessibilityRole="button"
                onPress={loadMore}
                style={styles.footer}
              >
                <Text style={[typography.label, { color: colors.error }]}>
                  {t("operation_failed")} · {t("retry")}
                </Text>
              </Pressable>
            ) : null
          }
        />
      )}
    </View>
  );
}

function ComposerAction({
  icon,
  label,
  tint,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  tint: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      scaleTo={0.93}
      style={styles.composerAction}
    >
      <Feather name={icon} size={17} color={tint} />
      <Text numberOfLines={1} style={[typography.micro, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </PressableScale>
  );
}

function RailLink({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      scaleTo={0.95}
      style={[
        styles.railLink,
        { backgroundColor: colors.feedCard, borderColor: colors.border },
      ]}
    >
      <Feather name={icon} size={15} color={colors.primary} />
      <Text numberOfLines={1} style={[typography.micro, { color: colors.text }]}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { flex: 1, padding: layout.gutter },
  list: { paddingBottom: layout.tabBarClearance },
  feedHeader: { gap: layout.cardGap, paddingVertical: layout.cardGap },
  search: {
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.pill,
    marginHorizontal: layout.gutter,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  composer: {
    marginHorizontal: layout.gutter,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
  },
  composerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  prompt: {
    flex: 1,
    minHeight: 42,
    borderRadius: radii.pill,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  composerDivider: { height: StyleSheet.hairlineWidth, marginTop: spacing.sm },
  railRow: { flexDirection: "row", gap: spacing.xs, paddingHorizontal: layout.gutter },
  railLink: {
    flex: 1,
    minHeight: 40,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: spacing.xs,
  },
  composerActions: { flexDirection: "row", paddingHorizontal: spacing.xxs },
  composerAction: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  footer: { padding: spacing.lg, alignItems: "center" },
});
