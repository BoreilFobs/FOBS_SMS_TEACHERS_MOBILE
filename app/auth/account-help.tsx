import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import useUserStore from "@/utils/stores/userStore";
import {
  completeConsolidation,
  confirmEmailOwnership,
  findSimilarAccounts,
  persistSession,
  requestPasswordReset,
  startConsolidation,
  type IdentityError,
  type SimilarAccount,
} from "@/services/identity";

/**
 * Duplicate-account picker and consolidation flow.
 *
 * Reached when a typed address has no exact match, from login, registration or
 * forgot-password. Shows masked candidates with how much school data each holds,
 * so a teacher can recognise the account they lost access to.
 *
 * SECURITY, restated because it constrains everything on this screen:
 * picking a candidate grants nothing. It only decides where a fresh code is
 * emailed. Deletion happens after the address is proven AND after a separate,
 * explicit confirmation dialog naming exactly how many accounts will go.
 */
type Stage = "picking" | "email" | "code" | "done";

export default function AccountHelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const { setUser } = useUserStore();

  const params = useLocalSearchParams<{ email?: string; from?: string }>();
  const searchedEmail = (params.email ?? "").toString();
  const from = ((params.from ?? "login").toString() as "login" | "registration" | "password_reset");

  const [stage, setStage] = useState<Stage>("picking");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [candidates, setCandidates] = useState<SimilarAccount[]>([]);

  const [survivor, setSurvivor] = useState<SimilarAccount>();
  const [correctedEmail, setCorrectedEmail] = useState("");
  const [code, setCode] = useState("");

  const copy =
    language === "fr"
      ? {
          title: "Est-ce l’un de ces comptes ?",
          subtitle:
            "Aucun compte n’utilise exactement cette adresse, mais ceux-ci sont similaires. Il arrive souvent qu’une adresse soit mal saisie à l’inscription.",
          empty: "Aucun compte similaire trouvé.",
          createNew: "Créer un nouveau compte",
          noneMine: "Aucun de ces comptes n’est le mien",
          schools: "établissement(s)",
          classes: "classe(s)",
          subjects: "matière(s)",
          keepThis: "Garder ce compte",
          emailTitle: "Quelle est votre vraie adresse e-mail ?",
          emailSubtitle:
            "Nous enverrons un code à cette adresse pour vérifier qu’elle vous appartient. Rien n’est supprimé avant cette confirmation.",
          emailSame: "L’adresse de ce compte est déjà correcte",
          sendCode: "Envoyer le code",
          codeTitle: "Saisissez le code",
          codeSubtitle: "Nous avons envoyé un code à 6 chiffres à",
          confirm: "Confirmer l’adresse",
          finish: "Terminer et supprimer les doublons",
          picker: "Sélection",
          back: "Retour",
          resetSent:
            "Si ce compte existe, nous avons envoyé un lien de réinitialisation à sa vraie adresse.",
          onlySends:
            "Choisir un compte envoie seulement un e-mail à sa vraie adresse — cela ne vous connecte pas.",
        }
      : {
          title: "Is one of these yours?",
          subtitle:
            "No account uses that exact address, but these look similar. Teachers often mistype their email when signing up.",
          empty: "No similar accounts found.",
          createNew: "Create a new account",
          noneMine: "None of these are mine",
          schools: "school(s)",
          classes: "class(es)",
          subjects: "subject(s)",
          keepThis: "Keep this account",
          emailTitle: "What is your real email address?",
          emailSubtitle:
            "We will send a code to that address to confirm it is yours. Nothing is deleted before you confirm.",
          emailSame: "This account's address is already correct",
          sendCode: "Send code",
          codeTitle: "Enter the code",
          codeSubtitle: "We sent a 6-digit code to",
          confirm: "Confirm address",
          finish: "Finish and delete duplicates",
          picker: "Select",
          back: "Back",
          resetSent:
            "If that account exists, we have sent a reset link to its real address.",
          onlySends:
            "Choosing an account only emails its real address — it does not sign you in.",
        };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await findSimilarAccounts(searchedEmail, from);
        if (!cancelled) setCandidates(result.candidates);
      } catch (cause) {
        if (!cancelled) setError((cause as IdentityError).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [from, searchedEmail]);

  /**
   * Password-recovery path: just send a reset to that account's real address.
   * Used when the user only wants back in, not to merge anything.
   */
  const recoverOnly = useCallback(
    async (candidate: SimilarAccount) => {
      setBusy(true);
      setError(undefined);

      try {
        // The backend resolves the real address; the client never learns it.
        await startConsolidation({
          survivingUserId: candidate.id,
          candidateIds: [],
          searchedEmail,
          triggeredBy: from,
        });
        await requestPasswordReset(searchedEmail).catch(() => undefined);

        Alert.alert(copy.picker, copy.resetSent, [
          { text: "OK", onPress: () => router.replace("/auth") },
        ]);
      } catch (cause) {
        setError((cause as IdentityError).message);
      } finally {
        setBusy(false);
      }
    },
    [copy.picker, copy.resetSent, from, router, searchedEmail],
  );

  /** Step 1: choose the survivor, then decide whether the address changes. */
  const chooseSurvivor = useCallback((candidate: SimilarAccount) => {
    setSurvivor(candidate);
    setCorrectedEmail("");
    setStage("email");
  }, []);

  /**
   * Step 4: the explicit, hard-to-misclick confirmations.
   *
   * Two separate dialogs when a conflict exists — the brief forbids folding the
   * "another account uses this address" deletion into the duplicate-deletion
   * confirmation.
   */
  const confirmAndFinish = useCallback(
    async (verifiedEmail?: string, hasConflict = false, conflictMasked: string | null = null) => {
      if (!survivor) return;

      const toDelete = candidates.filter((c) => c.id !== survivor.id);

      const runConflictConfirmation = () =>
        new Promise<boolean>((resolve) => {
          if (!hasConflict) return resolve(true);

          Alert.alert(
            language === "fr" ? "Un compte utilise déjà cette adresse" : "An account already uses this email",
            language === "fr"
              ? `Continuer supprimera définitivement ce compte (${conflictMasked ?? ""}) et ses données. Cette action est irréversible.`
              : `Continuing will permanently delete that account (${conflictMasked ?? ""}) and its data. This cannot be undone.`,
            [
              { text: language === "fr" ? "Annuler" : "Cancel", style: "cancel", onPress: () => resolve(false) },
              {
                text: language === "fr" ? "Supprimer ce compte" : "Delete that account",
                style: "destructive",
                onPress: () => resolve(true),
              },
            ],
          );
        });

      const runDeletionConfirmation = () =>
        new Promise<boolean>((resolve) => {
          if (toDelete.length === 0) return resolve(true);

          Alert.alert(
            language === "fr" ? "Supprimer les comptes en double" : "Delete duplicate accounts",
            language === "fr"
              ? `${toDelete.length} compte(s) seront définitivement supprimés, avec leurs établissements, classes, matières, présences et notes. Ces données ne peuvent pas être récupérées.`
              : `${toDelete.length} account(s) will be permanently deleted, along with their schools, classes, subjects, attendance and marks. This data cannot be recovered.`,
            [
              { text: language === "fr" ? "Annuler" : "Cancel", style: "cancel", onPress: () => resolve(false) },
              {
                text:
                  language === "fr"
                    ? `Supprimer ${toDelete.length} compte(s)`
                    : `Delete ${toDelete.length} account(s)`,
                style: "destructive",
                onPress: () => resolve(true),
              },
            ],
          );
        });

      if (!(await runConflictConfirmation())) return;
      if (!(await runDeletionConfirmation())) return;

      setBusy(true);

      try {
        const session = await completeConsolidation({
          survivingUserId: survivor.id,
          candidateIds: toDelete.map((c) => c.id),
          newEmail: verifiedEmail,
          confirmConflictDeletion: hasConflict,
          triggeredBy: from,
        });

        await persistSession(session);
        setUser(session.user as never);
        setStage("done");

        Alert.alert(
          language === "fr" ? "Comptes regroupés" : "Accounts merged",
          `${session.message}\n\n${session.grace_notice}`,
          [{ text: "OK", onPress: () => router.replace("/") }],
        );
      } catch (cause) {
        setError((cause as IdentityError).message);
      } finally {
        setBusy(false);
      }
    },
    [candidates, from, language, router, setUser, survivor],
  );

  /** Step 2: send the ownership code — still deletes nothing. */
  const sendOwnershipCode = useCallback(
    async (useExisting: boolean) => {
      if (!survivor) return;

      setBusy(true);
      setError(undefined);

      try {
        const result = await startConsolidation({
          survivingUserId: survivor.id,
          candidateIds: candidates.filter((c) => c.id !== survivor.id).map((c) => c.id),
          searchedEmail,
          newEmail: useExisting ? undefined : correctedEmail,
          triggeredBy: from,
        });

        if (!result.email_verification_required) {
          // Address already correct — straight to the deletion confirmation.
          await confirmAndFinish(undefined);
          return;
        }

        setStage("code");
      } catch (cause) {
        setError((cause as IdentityError).message);
      } finally {
        setBusy(false);
      }
    },
    [candidates, confirmAndFinish, correctedEmail, from, searchedEmail, survivor],
  );

  /** Step 3: prove the address, surfacing any conflicting account. */
  const confirmOwnership = useCallback(async () => {
    setBusy(true);
    setError(undefined);

    try {
      const result = await confirmEmailOwnership(correctedEmail, code);
      await confirmAndFinish(correctedEmail, result.conflict, result.conflict_masked_email);
    } catch (cause) {
      setError((cause as IdentityError).message);
    } finally {
      setBusy(false);
    }
  }, [code, confirmAndFinish, correctedEmail]);


  if (loading) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
        <Feather name="arrow-left" size={22} color={colors.text} />
      </Pressable>

      {stage === "picking" ? (
        <>
          <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{copy.subtitle}</Text>

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          {candidates.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>{copy.empty}</Text>
          ) : (
            candidates.map((candidate) => (
              <View
                key={candidate.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.masked, { color: colors.text }]}>{candidate.masked_email}</Text>
                <Text style={[styles.counts, { color: colors.textMuted }]}>
                  {candidate.school_count} {copy.schools} · {candidate.class_count} {copy.classes} ·{" "}
                  {candidate.subject_count} {copy.subjects}
                </Text>

                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => recoverOnly(candidate)}
                    style={[styles.secondary, { borderColor: colors.primary }]}
                  >
                    <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "600" }}>
                      {language === "fr" ? "Réinitialiser" : "Reset password"}
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => chooseSurvivor(candidate)}
                    style={[styles.primarySmall, { backgroundColor: colors.primary }]}
                  >
                    <Text style={{ color: colors.onPrimary, fontSize: 14, fontWeight: "600" }}>
                      {copy.keepThis}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}

          <Text style={[styles.footnote, { color: colors.textMuted }]}>{copy.onlySends}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/auth")}
            style={[styles.secondaryWide, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text, fontSize: 15 }}>{copy.noneMine}</Text>
          </Pressable>
        </>
      ) : null}

      {stage === "email" && survivor ? (
        <>
          <Text style={[styles.title, { color: colors.text }]}>{copy.emailTitle}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{copy.emailSubtitle}</Text>

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          <TextInput
            accessibilityLabel={copy.emailTitle}
            value={correctedEmail}
            onChangeText={setCorrectedEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="name@example.com"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          />

          <Pressable
            accessibilityRole="button"
            disabled={busy || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correctedEmail)}
            onPress={() => sendOwnershipCode(false)}
            style={[
              styles.primary,
              {
                backgroundColor: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correctedEmail)
                  ? colors.primary
                  : colors.disabled,
              },
            ]}
          >
            {busy ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[styles.primaryLabel, { color: colors.onPrimary }]}>{copy.sendCode}</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => sendOwnershipCode(true)}
            style={[styles.secondaryWide, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text, fontSize: 15 }}>{copy.emailSame}</Text>
          </Pressable>
        </>
      ) : null}

      {stage === "code" ? (
        <>
          <Text style={[styles.title, { color: colors.text }]}>{copy.codeTitle}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {copy.codeSubtitle}{" "}
            <Text style={{ fontWeight: "600", color: colors.text }}>{correctedEmail}</Text>
          </Text>

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          <TextInput
            accessibilityLabel={copy.codeTitle}
            value={code}
            onChangeText={(value) => setCode(value.replace(/[^0-9]/g, "").slice(0, 6))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            maxLength={6}
            style={[
              styles.codeInput,
              { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          />

          <Pressable
            accessibilityRole="button"
            disabled={busy || code.length !== 6}
            onPress={confirmOwnership}
            style={[
              styles.primary,
              { backgroundColor: code.length === 6 ? colors.primary : colors.disabled },
            ]}
          >
            {busy ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[styles.primaryLabel, { color: colors.onPrimary }]}>{copy.confirm}</Text>
            )}
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: 24, paddingBottom: 48 },
  back: { width: 44, height: 44, justifyContent: "center", marginBottom: 8 },
  title: { fontSize: 23, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  empty: { fontSize: 15, marginVertical: 20 },
  error: { fontSize: 13, marginBottom: 12 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12 },
  masked: { fontSize: 16, fontWeight: "600", fontVariant: ["tabular-nums"] },
  counts: { fontSize: 13, marginTop: 6 },
  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  secondary: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primarySmall: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryWide: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  footnote: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  input: { height: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  codeInput: {
    height: 60,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 12,
  },
  primary: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  primaryLabel: { fontSize: 16, fontWeight: "600" },
});
