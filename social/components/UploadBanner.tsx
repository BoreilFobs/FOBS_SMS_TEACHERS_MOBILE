import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { elevation, layout, motion, radii, spacing, typography } from "@/constants/theme";
import { UploadJob } from "@/social/store/uploadQueue";
import { useSocial } from "@/social/hooks/useSocial";
import { useUploadActions, useUploadJobs } from "@/social/hooks/useUploadQueue";

/**
 * In-feed status for posts still uploading, so publishing can return the
 * teacher to the feed straight away instead of blocking on the network.
 */
export function UploadBanner({ onPublished }: { onPublished?: () => void }) {
  const jobs = useUploadJobs();
  const { repository } = useSocial();
  const { retry, dismiss } = useUploadActions(repository, onPublished);

  if (jobs.length === 0) return null;

  return (
    <View style={styles.stack}>
      {jobs.map((job) => (
        <UploadRow
          key={job.id}
          job={job}
          onRetry={() => retry(job.id)}
          onDismiss={() => dismiss(job.id)}
        />
      ))}
    </View>
  );
}

function UploadRow({
  job,
  onRetry,
  onDismiss,
}: {
  job: UploadJob;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const width = useRef(new Animated.Value(0)).current;
  const failed = job.status === "failed";

  useEffect(() => {
    Animated.timing(width, {
      toValue: job.progress,
      duration: motion.normal,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [job.progress, width]);

  const copy =
    language === "fr"
      ? {
          uploading: job.kind === "edit" ? "Mise à jour…" : "Publication…",
          failed: "Échec de la publication",
          retry: "Réessayer",
          dismiss: "Ignorer",
        }
      : {
          uploading: job.kind === "edit" ? "Updating…" : "Posting…",
          failed: "Post failed",
          retry: "Retry",
          dismiss: "Dismiss",
        };

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.feedCard, borderColor: colors.border },
        elevation.raised,
      ]}
    >
      <View style={styles.main}>
        {job.previewUri ? (
          <Image
            source={{ uri: job.previewUri }}
            style={[styles.thumb, { backgroundColor: colors.surfaceMuted }]}
          />
        ) : (
          <View style={[styles.thumb, { backgroundColor: colors.primarySoft }]}>
            <Feather name="edit-3" size={18} color={colors.primary} />
          </View>
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            numberOfLines={1}
            style={[typography.label, { color: failed ? colors.error : colors.text }]}
          >
            {failed ? copy.failed : copy.uploading}
          </Text>
          {failed ? (
            <Text numberOfLines={2} style={[typography.micro, { color: colors.textMuted }]}>
              {job.error}
            </Text>
          ) : (
            <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
              <Animated.View
                style={[
                  styles.fill,
                  {
                    backgroundColor: colors.primary,
                    width: width.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
          )}
        </View>
        {failed ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.retry}
              onPress={onRetry}
              hitSlop={8}
              style={styles.actionButton}
            >
              <Feather name="rotate-ccw" size={17} color={colors.primary} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.dismiss}
              onPress={onDismiss}
              hitSlop={8}
              style={styles.actionButton}
            >
              <Feather name="x" size={17} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : (
          <Text style={[typography.micro, { color: colors.textMuted }]}>
            {Math.round(job.progress * 100)}%
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: layout.cardGap, paddingHorizontal: layout.gutter },
  row: {
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm,
  },
  main: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  track: { height: 5, borderRadius: radii.pill, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radii.pill },
  actions: { flexDirection: "row", gap: 2 },
  actionButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
});
