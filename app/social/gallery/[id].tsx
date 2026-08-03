import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewToken,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { EmptyState } from "@/components/ui";
import { Avatar } from "@/social/components/Avatar";
import { useSocial } from "@/social/hooks/useSocial";
import { formatRelativeTime } from "@/social/utils/format";
import { radii, spacing, typography } from "@/constants/theme";

/** Used until the real dimensions of an image are known. */
const FALLBACK_RATIO = 4 / 3;

/** How far past the end you must pull before the gallery closes. */
const OVERSCROLL_EXIT = 90;

/**
 * A post's images, read top to bottom: author, description, the post's overall
 * engagement, then every image in turn with its own action row.
 *
 * This is a normal pushed screen rather than a Modal. Modals on react-native-web
 * proved unreliable as scroll containers here, whereas the feed and post detail
 * screens use exactly this structure and scroll correctly on every platform.
 *
 * NOTE ON COUNTS: reactions and comments exist per *post* in the API — a
 * post_image row carries only its path and alt text. The row under each image
 * therefore acts on, and reports, the post's engagement.
 */
export default function PostGalleryScreen() {
  const params = useLocalSearchParams<{ id: string; index?: string }>();
  const startIndex = Math.max(0, Number(params.index ?? 0) || 0);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const router = useRouter();
  const { snapshot } = useSocial();
  const listRef = useRef<FlatList<string>>(null);
  const [index, setIndex] = useState(startIndex);
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const exiting = useRef(false);

  const post = snapshot.posts.find((item) => item.id === params.id);
  const author = snapshot.teachers.find((teacher) => teacher.id === post?.authorId);
  // Stable identities: a fresh `?? []` each render would re-run the measuring
  // effect on every render and re-request the size of every image.
  const images = useMemo(() => post?.images ?? [], [post?.images]);
  const descriptions = useMemo(
    () => post?.imageDescriptions ?? [],
    [post?.imageDescriptions],
  );

  useEffect(() => {
    let cancelled = false;
    images.forEach((uri) => {
      Image.getSize(
        uri,
        (imageWidth, imageHeight) => {
          if (cancelled || !imageHeight) return;
          setRatios((current) =>
            current[uri] ? current : { ...current, [uri]: imageWidth / imageHeight },
          );
        },
        () => {
          // Unreachable image: the fallback ratio keeps the row a sane size.
        },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [images]);

  const scrollToStart = useCallback(() => {
    if (startIndex <= 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: startIndex, animated: false, viewPosition: 0 });
    });
  }, [startIndex]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems.find((item) => item.index != null);
      if (first?.index != null) setIndex(first.index);
    },
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55 }).current;

  /** Pulling beyond the last image leaves the gallery. */
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

      // Only meaningful when there is something to scroll. For a post whose
      // content is shorter than the screen the "distance past the end" is
      // positive while sitting still, which would close the screen instantly.
      const scrollable = contentSize.height > layoutMeasurement.height + 1;
      if (!scrollable || exiting.current) return;

      const distancePastEnd =
        contentOffset.y + layoutMeasurement.height - contentSize.height;
      if (distancePastEnd > OVERSCROLL_EXIT) {
        exiting.current = true;
        router.back();
      }
    },
    [router],
  );

  const copy =
    language === "fr"
      ? {
          reactions: "réactions",
          comments: "commentaires",
          shares: "partages",
          exit: "Continuez pour fermer",
          imageOf: (n: number, total: number) => `Image ${n} sur ${total}`,
          missing: "Publication introuvable",
        }
      : {
          reactions: "reactions",
          comments: "comments",
          shares: "shares",
          exit: "Keep scrolling to close",
          imageOf: (n: number, total: number) => `Image ${n} of ${total}`,
          missing: "Post unavailable",
        };

  if (!post) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <EmptyState icon="image" title={copy.missing} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        ref={listRef}
        data={images}
        keyExtractor={(uri, position) => `${uri}-${position}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 56,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        onLayout={scrollToStart}
        onScroll={onScroll}
        scrollEventThrottle={32}
        onScrollToIndexFailed={({ index: target, averageItemLength }) => {
          listRef.current?.scrollToOffset({
            offset: target * (averageItemLength || height),
            animated: false,
          });
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListHeaderComponent={
          <View style={styles.postHeader}>
            {author ? (
              <View style={styles.authorRow}>
                <Avatar name={author.name} uri={author.photoUrl} size={44} />
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text
                      numberOfLines={1}
                      style={[typography.bodyStrong, { color: colors.text, flexShrink: 1 }]}
                    >
                      {author.name}
                    </Text>
                    {author.verified ? (
                      <Feather name="check-circle" size={14} color={colors.primary} />
                    ) : null}
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[typography.caption, { color: colors.textSecondary }]}
                  >
                    {author.headline}
                  </Text>
                  <Text style={[typography.micro, { color: colors.textMuted }]}>
                    {formatRelativeTime(post.createdAt, language)}
                  </Text>
                </View>
              </View>
            ) : null}

            {post.text ? (
              <Text style={[typography.body, { color: colors.text }]}>{post.text}</Text>
            ) : null}

            {post.hashtags.length ? (
              <Text style={[typography.bodyStrong, { color: colors.primary }]}>
                {post.hashtags.map((tag) => `#${tag}`).join(" ")}
              </Text>
            ) : null}

            <View style={[styles.totals, { borderColor: colors.divider }]}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {post.reactions.total} {copy.reactions}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {post.commentCount} {copy.comments}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {post.reshareCount} {copy.shares}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item, index: position }) => {
          const ratio = ratios[item] ?? FALLBACK_RATIO;
          return (
            <View style={styles.slide}>
              <Image
                accessibilityLabel={descriptions[position] || `Image ${position + 1}`}
                source={{ uri: item }}
                style={{
                  width,
                  height: Math.min(width / ratio, height * 1.4),
                  backgroundColor: colors.surfaceMuted,
                }}
                resizeMode="contain"
              />
              {descriptions[position] ? (
                <Text
                  style={[
                    typography.caption,
                    styles.slideCaption,
                    { color: colors.textSecondary },
                  ]}
                >
                  {descriptions[position]}
                </Text>
              ) : null}

              {/* Position only. Engagement lives once at the top of the page:
                  repeating the post's like/comment/share row under every image
                  implied per-image counts that do not exist. */}
              {images.length > 1 ? (
                <View style={[styles.imageMeta, { borderBottomColor: colors.divider }]}>
                  <Text style={[typography.micro, { color: colors.textMuted }]}>
                    {copy.imageOf(position + 1, images.length)}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        }}
        ListFooterComponent={
          <View style={styles.footerHint}>
            <Feather name="chevrons-down" size={18} color={colors.textMuted} />
            <Text style={[typography.caption, { color: colors.textMuted }]}>{copy.exit}</Text>
          </View>
        }
      />

      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.xs,
            backgroundColor: colors.headerSurface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={language === "fr" ? "Retour" : "Back"}
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: colors.surfaceMuted, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>

        <View style={styles.identity}>
          {author ? (
            <>
              <Avatar name={author.name} uri={author.photoUrl} size={30} />
              <Text
                numberOfLines={1}
                style={[typography.label, { color: colors.text, flex: 1 }]}
              >
                {author.name}
              </Text>
            </>
          ) : null}
        </View>

        {images.length > 1 ? (
          <View style={[styles.counter, { backgroundColor: colors.surfaceMuted }]}>
            <Text style={[typography.micro, { color: colors.textSecondary }]}>
              {index + 1}/{images.length}
            </Text>
          </View>
        ) : (
          <View style={styles.iconButton} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  postHeader: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  authorRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  totals: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.xs,
    marginTop: spacing.xxs,
  },
  slide: { marginBottom: spacing.lg },
  slideCaption: { paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  imageMeta: {
    marginHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  footerHint: {
    alignItems: "center",
    gap: 4,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  identity: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.xs },
  counter: {
    minWidth: 44,
    height: 28,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
});
