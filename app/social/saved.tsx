import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { SocialScreenHeader } from "@/social/components/ScreenHeader";
import { PostCard } from "@/social/components/PostCard";
import { useSocial } from "@/social/hooks/useSocial";
import { useSocialResource } from "@/social/hooks/useSocialResource";

export default function SavedPostsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { repository, snapshot } = useSocial();
  // Saves live server-side now, so the list is fetched rather than filtered out of
  // an in-memory copy of every post.
  const { loading, refreshing, error, refresh, retry } = useSocialResource(
    () => repository.getSavedPosts(),
  );
  const posts = snapshot.posts.filter((post) => post.saved);

  if (loading && posts.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.feedBackground, paddingTop: insets.top }]}>
        <SocialScreenHeader title={t("saved_posts")} />
        <LoadingState />
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.feedBackground, paddingTop: insets.top }]}>
        <SocialScreenHeader title={t("saved_posts")} />
        <ErrorState message={error.message} onRetry={() => void retry()} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.feedBackground, paddingTop: insets.top }]}>
      <SocialScreenHeader title={t("saved_posts")} />
      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshing={refreshing}
        onRefresh={() => void refresh()}
        ListEmptyComponent={<EmptyState icon="bookmark" title={t("feed_empty")} message={t("saved_posts")} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 } });
