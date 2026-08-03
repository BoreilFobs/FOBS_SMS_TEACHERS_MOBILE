import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Image, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AppHeader,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
} from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import useUserStore from "@/utils/stores/userStore";
import Config from "@/constants/Config";
import { authFetch } from "@/services/authFetch";
import { layout, radii, spacing, typography } from "@/constants/theme";

interface PendingRequest {
  id: number;
  school: {
    id: number;
    name: string;
    acronym?: string | null;
    address?: string | null;
    logo_url?: string | null;
  };
  requested_at: string;
  status: string;
}

export default function PendingRequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const teacher = useUserStore((store) => store.teacher);

  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const en = language === "en";
  const copy = en
    ? {
        title: "Pending requests",
        subtitle: "School assignments awaiting review",
        empty: "No pending requests",
        emptyMessage:
          "Your assignment requests will appear here until they are approved.",
        add: "Add a school",
        pending: "Pending",
        requestedOn: "Requested on",
        cancel: "Cancel request",
        confirmTitle: "Cancel request?",
        confirmMessage: "This withdraws your request to join this school.",
        keep: "Keep",
        loadFailed: "Unable to load your requests.",
        cancelFailed: "Unable to cancel this request.",
      }
    : {
        title: "Demandes en attente",
        subtitle: "Affectations scolaires en cours d’examen",
        empty: "Aucune demande en attente",
        emptyMessage:
          "Vos demandes d’affectation apparaîtront ici jusqu’à leur approbation.",
        add: "Ajouter une école",
        pending: "En attente",
        requestedOn: "Demandé le",
        cancel: "Annuler la demande",
        confirmTitle: "Annuler la demande ?",
        confirmMessage: "Cela retire votre demande de rejoindre cette école.",
        keep: "Conserver",
        loadFailed: "Impossible de charger vos demandes.",
        cancelFailed: "Impossible d’annuler cette demande.",
      };

  const load = useCallback(async () => {
    if (!teacher?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setError(null);
    try {
      const response = await authFetch(
        `${Config.apiBaseUrl}/teacher-school-requests?teacher_id=${teacher.id}`,
      );
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? copy.loadFailed);
      }
      setRequests(payload.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : copy.loadFailed);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teacher?.id, copy.loadFailed]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const cancelRequest = async (id: number) => {
    setCancellingId(id);
    try {
      const response = await authFetch(
        `${Config.apiBaseUrl}/teacher-school-request/${id}`,
        { method: "DELETE" },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message ?? copy.cancelFailed);
      }
      setRequests((current) => current.filter((request) => request.id !== id));
    } catch (cancelError) {
      Alert.alert(
        copy.cancel,
        cancelError instanceof Error ? cancelError.message : copy.cancelFailed,
      );
    } finally {
      setCancellingId(null);
    }
  };

  const confirmCancel = (request: PendingRequest) =>
    Alert.alert(copy.confirmTitle, `${copy.confirmMessage}\n\n${request.school.name}`, [
      { text: copy.keep, style: "cancel" },
      {
        text: copy.cancel,
        style: "destructive",
        onPress: () => void cancelRequest(request.id),
      },
    ]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={{
          paddingTop: insets.top + spacing.xs,
          paddingHorizontal: layout.screenPadding,
        }}
      >
        <AppHeader title={copy.title} subtitle={copy.subtitle} back />
      </View>
      {loading ? (
        <View style={styles.list}>
          <LoadingState rows={3} />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + spacing.xxl },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: layout.cardGap }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="inbox"
              title={copy.empty}
              message={copy.emptyMessage}
              actionLabel={copy.add}
              onAction={() => router.push("/schools/add")}
            />
          }
          renderItem={({ item }) => (
            <Card>
              <View style={styles.row}>
                {item.school.logo_url ? (
                  <Image
                    source={{ uri: item.school.logo_url }}
                    style={[styles.logo, { backgroundColor: colors.surfaceMuted }]}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.logo, { backgroundColor: colors.primarySoft }]}>
                    <Feather name="home" size={20} color={colors.primary} />
                  </View>
                )}
                <View style={styles.info}>
                  <Text
                    numberOfLines={1}
                    style={[typography.bodyStrong, { color: colors.text }]}
                  >
                    {item.school.name}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    {copy.requestedOn}{" "}
                    {new Date(item.requested_at).toLocaleDateString(
                      en ? "en-GB" : "fr-FR",
                    )}
                  </Text>
                  <View style={styles.chipRow}>
                    <Chip label={copy.pending} tone="warning" icon="clock" />
                  </View>
                </View>
                <IconButton
                  icon="close"
                  label={copy.cancel}
                  tone="plain"
                  size={40}
                  loading={cancellingId === item.id}
                  onPress={() => confirmCancel(item)}
                />
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: {
    flexGrow: 1,
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logo: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 3 },
  chipRow: { flexDirection: "row", marginTop: 2 },
});
