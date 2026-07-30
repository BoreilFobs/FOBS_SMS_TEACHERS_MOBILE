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
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { spacing, typography } from "@/constants/theme";
import { SocialHeader } from "@/social/components/SocialHeader";
import { PostCard } from "@/social/components/PostCard";
import { useFeed } from "@/social/hooks/useFeed";
import { useSocial } from "@/social/hooks/useSocial";
import { Avatar } from "@/social/components/Avatar";
import { CURRENT_TEACHER_ID } from "@/social/models";

export default function SocialHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { snapshot } = useSocial();
  const current = snapshot.teachers.find((teacher) => teacher.id === CURRENT_TEACHER_ID);
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
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <SocialHeader />
      {loading ? (
        <View style={styles.loading}>
          <LoadingState rows={5} />
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
              <Pressable
                accessibilityRole="search"
                accessibilityLabel={t("global_search")}
                onPress={() => router.push("/social/search")}
                style={[
                  styles.search,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Feather name="search" size={20} color={colors.textMuted} />
                <Text style={[typography.body, { color: colors.textMuted, flex: 1 }]}>
                  {t("discover")}
                </Text>
              </Pressable>
              <View
                style={[
                  styles.composer,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Avatar name={current?.name ?? "Teacher"} uri={current?.photoUrl} size={42} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("write_post")}
                  onPress={() => router.push("/social/compose")}
                  style={[styles.prompt, { backgroundColor: colors.surfaceMuted }]}
                >
                  <Text style={[typography.body, { color: colors.textSecondary }]}>
                    {t("write_post")}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("add_images")}
                  onPress={() =>
                    router.push({ pathname: "/social/compose", params: { type: "image" } })
                  }
                  style={styles.imageButton}
                >
                  <Feather name="image" size={21} color={colors.primary} />
                </Pressable>
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { flex: 1, padding: spacing.md },
  list: { paddingBottom: 110 },
  feedHeader: { gap: spacing.sm, paddingVertical: spacing.sm },
  search: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 25,
    marginHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  composer: {
    minHeight: 68,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  prompt: {
    flex: 1,
    minHeight: 46,
    borderRadius: 23,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  imageButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  footer: { padding: spacing.lg, alignItems: "center" },
});
