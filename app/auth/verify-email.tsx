import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
  IDENTITY_POLICY,
  persistSession,
  resendVerification,
  verifyEmailCode,
  type IdentityError,
} from "@/services/identity";

/**
 * "Confirm your email" screen, shown after registration.
 *
 * The same email also carries a clickable link that completes verification on
 * its own — this screen exists for people who would rather type the code, and
 * for anyone whose mail client mangles links.
 *
 * Replaces the old WhatsApp code screen. No phone number is involved.
 */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { language } = useLanguage();
  const { setUser } = useUserStore();

  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email ?? "").toString();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState<number>(IDENTITY_POLICY.resendCooldownSeconds);

  const copy =
    language === "fr"
      ? {
          title: "Confirmez votre e-mail",
          subtitle: "Nous avons envoyé un code à 6 chiffres à",
          linkNote:
            "Le même e-mail contient aussi un lien de confirmation — l’un ou l’autre suffit.",
          codeLabel: "Code à 6 chiffres",
          confirm: "Confirmer",
          resend: "Envoyer un nouveau code",
          resendIn: (s: number) => `Nouveau code disponible dans ${s} s`,
          invalidCode: "Saisissez le code à 6 chiffres.",
          expiryNote:
            "Le code expire après 15 minutes. Après 5 tentatives incorrectes, demandez-en un nouveau.",
          back: "Retour",
          checkSpam: "Vérifiez vos spams si l’e-mail n’arrive pas.",
        }
      : {
          title: "Confirm your email",
          subtitle: "We sent a 6-digit code to",
          linkNote:
            "The same email also contains a confirmation link — either one is enough.",
          codeLabel: "6-digit code",
          confirm: "Confirm",
          resend: "Send a new code",
          resendIn: (s: number) => `New code available in ${s}s`,
          invalidCode: "Enter the 6-digit code.",
          expiryNote:
            "The code expires after 15 minutes. After 5 incorrect attempts, request a new one.",
          back: "Back",
          checkSpam: "Check your spam folder if the email does not arrive.",
        };

  // Counts the resend cooldown down locally; the server enforces it for real.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const submit = useCallback(async () => {
    if (!/^\d{6}$/.test(code)) {
      setError(copy.invalidCode);
      return;
    }

    setSubmitting(true);
    setError(undefined);
    setNotice(undefined);

    try {
      const session = await verifyEmailCode(email, code);
      await persistSession(session);
      setUser(session.user as never);

      // Straight into profile setup — a freshly verified account has no teacher
      // record yet.
      router.replace("/setup");
    } catch (cause) {
      const identityError = cause as IdentityError;
      setError(identityError.message);

      // A burned code is unusable; clear the field so the next attempt starts
      // from the new code rather than editing the dead one.
      if (identityError.reason === "locked" || identityError.reason === "expired") {
        setCode("");
      }
    } finally {
      setSubmitting(false);
    }
  }, [code, copy.invalidCode, email, router, setUser]);

  const resend = useCallback(async () => {
    setError(undefined);
    setNotice(undefined);

    try {
      await resendVerification(email);
      setCooldown(IDENTITY_POLICY.resendCooldownSeconds);
      setNotice(copy.checkSpam);
    } catch (cause) {
      const identityError = cause as IdentityError;
      setError(identityError.message);
      if (identityError.retryAfter) setCooldown(identityError.retryAfter);
    }
  }, [copy.checkSpam, email]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.back}
          onPress={() => router.back()}
          style={styles.back}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>

        <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
          <Feather name="mail" size={26} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {copy.subtitle} <Text style={{ fontWeight: "600", color: colors.text }}>{email}</Text>
        </Text>

        <Text style={[styles.note, { color: colors.textMuted }]}>{copy.linkNote}</Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>{copy.codeLabel}</Text>
        <TextInput
          accessibilityLabel={copy.codeLabel}
          value={code}
          onChangeText={(value) => setCode(value.replace(/[^0-9]/g, "").slice(0, 6))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={6}
          editable={!submitting}
          style={[
            styles.codeInput,
            {
              color: colors.text,
              backgroundColor: colors.surface,
              borderColor: error ? colors.error : colors.border,
            },
          ]}
        />

        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
        {notice ? <Text style={[styles.notice, { color: colors.textMuted }]}>{notice}</Text> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: submitting || code.length !== 6 }}
          disabled={submitting || code.length !== 6}
          onPress={submit}
          style={[
            styles.primary,
            { backgroundColor: code.length === 6 ? colors.primary : colors.disabled },
          ]}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.primaryLabel, { color: code.length === 6 ? colors.onPrimary : colors.disabledText }]}>
              {copy.confirm}
            </Text>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: cooldown > 0 }}
          disabled={cooldown > 0}
          onPress={resend}
          style={styles.resend}
        >
          <Text style={{ color: cooldown > 0 ? colors.textMuted : colors.primary, fontSize: 14 }}>
            {cooldown > 0 ? copy.resendIn(cooldown) : copy.resend}
          </Text>
        </Pressable>

        <Text style={[styles.footnote, { color: colors.textMuted }]}>{copy.expiryNote}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  back: { width: 44, height: 44, justifyContent: "center" },
  badge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  note: { fontSize: 13, lineHeight: 19, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  codeInput: {
    height: 60,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 12,
  },
  error: { fontSize: 13, marginTop: 10 },
  notice: { fontSize: 13, marginTop: 10 },
  primary: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  primaryLabel: { fontSize: 16, fontWeight: "600" },
  resend: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 14 },
  footnote: { fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 18 },
});
