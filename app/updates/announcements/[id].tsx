import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { useUpdates } from "@/contexts/UpdatesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { radii, spacing, typography } from "@/constants/theme";

export default function AnnouncementDetailsRoute() {
  return (
    <AuthWrapper>
      <AnnouncementDetails />
    </AuthWrapper>
  );
}

function AnnouncementDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const { state, announcements, markAnnouncementRead } = useUpdates();
  const announcement = announcements.find((item) => item.id === id);

  useEffect(() => {
    if (id && announcement && !announcement.isRead) {
      void markAnnouncementRead(id);
    }
  }, [announcement?.isRead, id]);

  if (state === "idle" || state === "loading") {
    return (
      <Screen bottomInset={false}>
        <LoadingState rows={5} />
      </Screen>
    );
  }
  if (!announcement) {
    return (
      <Screen bottomInset={false}>
        <AppHeader
          title={language === "fr" ? "Annonce" : "Announcement"}
          onBack={() => router.back()}
        />
        <EmptyState
          icon="bell-off"
          title={language === "fr" ? "Annonce introuvable" : "Announcement not found"}
          message={
            language === "fr"
              ? "Cette annonce n’est plus disponible."
              : "This announcement is no longer available."
          }
        />
      </Screen>
    );
  }

  const priorityTone =
    announcement.priority === "urgent"
      ? "error"
      : announcement.priority === "important"
        ? "warning"
        : "neutral";
  const priorityLabel =
    announcement.priority === "normal"
      ? language === "fr"
        ? "Information"
        : "Information"
      : announcement.priority === "urgent"
        ? "Urgent"
        : "Important";
  const date = new Intl.DateTimeFormat(
    language === "fr" ? "fr-FR" : "en-GB",
    { dateStyle: "long", timeStyle: "short" },
  ).format(new Date(announcement.publishedAt));

  return (
    <Screen scroll bottomInset={false}>
      <AppHeader
        title={language === "fr" ? "Annonce scolaire" : "School announcement"}
        onBack={() => router.back()}
      />
      <Card style={styles.schoolCard}>
        <View
          style={[styles.schoolMark, { backgroundColor: colors.primarySoft }]}
        >
          <Text style={[typography.bodyStrong, { color: colors.primary }]}>
            {announcement.schoolAcronym.slice(0, 4)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>
            {announcement.schoolName}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {announcement.publisher} · {announcement.publisherRole}
          </Text>
        </View>
      </Card>
      <View style={styles.inline}>
        {announcement.pinned ? (
          <StatusChip
            label={language === "fr" ? "Épinglée" : "Pinned"}
            icon="bookmark"
          />
        ) : null}
        <StatusChip label={priorityLabel} tone={priorityTone} />
        <StatusChip
          label={language === "fr" ? "Lue" : "Read"}
          tone="success"
          icon="check"
        />
      </View>
      <Text style={[typography.display, { color: colors.text }]}>
        {announcement.title}
      </Text>
      <Text style={[typography.caption, { color: colors.textMuted }]}>
        {date}
      </Text>
      <View style={styles.message}>
        {announcement.message.map((paragraph, index) => (
          <Text
            key={index}
            style={[styles.paragraph, { color: colors.textSecondary }]}
          >
            {paragraph}
          </Text>
        ))}
      </View>
      {announcement.attachments.length > 0 ? (
        <>
          <SectionHeader
            title={language === "fr" ? "Pièces jointes" : "Attachments"}
          />
          {announcement.attachments.map((attachment) => (
            <Card key={attachment.id}>
              <View style={styles.attachment}>
                <View
                  style={[
                    styles.attachmentIcon,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Feather name="paperclip" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>
                    {attachment.title}
                  </Text>
                  <Text
                    style={[typography.caption, { color: colors.textSecondary }]}
                  >
                    {attachment.kind.toUpperCase()} · {attachment.size}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  schoolCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  schoolMark: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  inline: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.xs },
  message: { gap: spacing.md },
  paragraph: { fontSize: 17, lineHeight: 27 },
  attachment: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  attachmentIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
});

