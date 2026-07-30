import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { EmptyState } from "@/components/ui";
import { SocialScreenHeader } from "@/social/components/ScreenHeader";
import { PostCard } from "@/social/components/PostCard";
import { useSocial } from "@/social/hooks/useSocial";

export default function SavedPostsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { snapshot } = useSocial();
  const posts = snapshot.posts.filter((post) => post.saved);
  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <SocialScreenHeader title={t("saved_posts")} />
      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={<EmptyState icon="bookmark" title={t("feed_empty")} message={t("saved_posts")} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 } });
