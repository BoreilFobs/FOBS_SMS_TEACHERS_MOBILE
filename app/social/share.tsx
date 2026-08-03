import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { EmptyState, SearchInput } from "@/components/ui";
import { CURRENT_TEACHER_ID, SharedMessageInput } from "@/social/models";
import { useSocial } from "@/social/hooks/useSocial";
import { SocialScreenHeader } from "@/social/components/ScreenHeader";
import { Avatar } from "@/social/components/Avatar";
import { radii, spacing, typography } from "@/constants/theme";
import { notify } from "@/utils/dialog";

export default function InternalShareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind: SharedMessageInput["kind"]; id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { repository, snapshot } = useSocial();
  const [query, setQuery] = useState("");
  const [sendingId, setSendingId] = useState<string>();
  const [eligibleIds, setEligibleIds] = useState<string[]>([]);

  useEffect(() => {
    void repository.getEligibleTeachers().then((teachers) => setEligibleIds(teachers.map((teacher) => teacher.id)));
  }, [repository, snapshot.teachers]);

  const teachers = snapshot.teachers.filter(
    (teacher) =>
      eligibleIds.includes(teacher.id) &&
      teacher.name.toLowerCase().includes(query.toLowerCase()),
  );
  const send = async (teacherId: string) => {
    setSendingId(teacherId);
    try {
      const conversation = await repository.startConversation(teacherId);
      await repository.share(conversation.id, {
        kind: params.kind,
        sharedId: params.id,
      });
      notify(t("success"), t("internal_share"), () => router.back());
    } catch {
      notify(t("error"), t("operation_failed"));
    } finally {
      setSendingId(undefined);
    }
  };
  return (
    <View style={[styles.screen, { backgroundColor: colors.feedBackground, paddingTop: insets.top }]}>
      <SocialScreenHeader title={t("internal_share")} />
      <View style={styles.search}>
        <SearchInput value={query} onChangeText={setQuery} placeholder={t("messages")} />
      </View>
      <FlatList
        data={teachers}
        keyExtractor={(teacher) => teacher.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => {
          const existing = snapshot.conversations.find(
            (conversation) =>
              conversation.participantIds.includes(CURRENT_TEACHER_ID) &&
              conversation.participantIds.includes(item.id),
          );
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t("share")}: ${item.name}`}
              disabled={Boolean(sendingId)}
              onPress={() => void send(item.id)}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Avatar name={item.name} uri={item.photoUrl} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>{item.name}</Text>
                <Text style={[typography.caption, { color: colors.success }]}>
                  {existing ? t("mutual_follow") : t("new_message")}
                </Text>
              </View>
              <Text style={[typography.label, { color: colors.primary }]}>
                {sendingId === item.id ? t("loading") : t("share")}
              </Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={<EmptyState icon="send" title={t("no_eligible_conversations")} message={t("mutual_required")} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  search: { padding: spacing.md },
  list: { paddingHorizontal: spacing.md },
  row: { minHeight: 72, borderWidth: 1, borderRadius: radii.lg, padding: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
