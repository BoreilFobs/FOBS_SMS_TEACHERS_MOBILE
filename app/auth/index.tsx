import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import {
  Button,
  Card,
  FilterChips,
  FormField,
  StatusChip,
} from "@/components/ui";
import Config from "@/constants/Config";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import useUserStore from "@/utils/stores/userStore";
import { radii, spacing, typography } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AuthForm {
  name: string;
  email: string;
  password: string;
}

interface AuthErrors {
  name?: string;
  email?: string;
  password?: string;
  general?: string;
}

type ResetStep = "email" | "otp" | "password";

export default function AuthenticationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { language, setLanguage } = useLanguage();
  const { setUser, setTeacher } = useUserStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState<AuthForm>({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<AuthErrors>({});
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetPhone, setResetPhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const copy =
    language === "fr"
      ? {
          app: "FobsSMS Teacher",
          eyebrow: "ESPACE ENSEIGNANT",
          loginTitle: "Heureux de vous revoir",
          loginSubtitle:
            "Connectez-vous pour gérer vos classes, présences et notes.",
          registerTitle: "Créer un compte enseignant",
          registerSubtitle:
            "Commencez avec vos informations de compte, puis configurez votre profil.",
          login: "Connexion",
          register: "Inscription",
          name: "Nom complet",
          namePlaceholder: "Votre nom complet",
          email: "Adresse email",
          emailPlaceholder: "nom@exemple.com",
          password: "Mot de passe",
          passwordPlaceholder: "Votre mot de passe",
          forgot: "Mot de passe oublié ?",
          signIn: "Se connecter",
          signUp: "Créer le compte",
          required: "Ce champ est requis.",
          invalidEmail: "Saisissez une adresse email valide.",
          passwordLength: "Le mot de passe doit contenir au moins 6 caractères.",
          secure: "Connexion sécurisée à votre compte FobsSMS",
          resetTitle: "Réinitialiser le mot de passe",
          resetDescription:
            "Un code sera envoyé au numéro WhatsApp enregistré sur votre compte.",
          continue: "Continuer",
          code: "Code de vérification",
          codeHelp: "Saisissez le code à 6 chiffres envoyé à",
          verify: "Vérifier",
          resend: "Renvoyer le code",
          newPassword: "Nouveau mot de passe",
          confirmPassword: "Confirmer le mot de passe",
          reset: "Réinitialiser",
          cancel: "Annuler",
          success: "Mot de passe réinitialisé",
          successMessage:
            "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
          mismatch: "Les mots de passe ne correspondent pas.",
          network: "Erreur réseau. Vérifiez votre connexion.",
        }
      : {
          app: "FobsSMS Teacher",
          eyebrow: "TEACHER WORKSPACE",
          loginTitle: "Welcome back",
          loginSubtitle:
            "Sign in to manage your classes, attendance, and marks.",
          registerTitle: "Create a teacher account",
          registerSubtitle:
            "Start with your account details, then set up your teacher profile.",
          login: "Log in",
          register: "Register",
          name: "Full name",
          namePlaceholder: "Your full name",
          email: "Email address",
          emailPlaceholder: "name@example.com",
          password: "Password",
          passwordPlaceholder: "Your password",
          forgot: "Forgot password?",
          signIn: "Sign in",
          signUp: "Create account",
          required: "This field is required.",
          invalidEmail: "Enter a valid email address.",
          passwordLength: "Password must be at least 6 characters.",
          secure: "Secure access to your FobsSMS account",
          resetTitle: "Reset password",
          resetDescription:
            "A verification code will be sent to the WhatsApp number registered on your account.",
          continue: "Continue",
          code: "Verification code",
          codeHelp: "Enter the 6-digit code sent to",
          verify: "Verify code",
          resend: "Resend code",
          newPassword: "New password",
          confirmPassword: "Confirm password",
          reset: "Reset password",
          cancel: "Cancel",
          success: "Password reset",
          successMessage:
            "You can now sign in with your new password.",
          mismatch: "Passwords do not match.",
          network: "Network error. Check your connection.",
        };

  const changeMode = (next: "login" | "register") => {
    setMode(next);
    setErrors({});
  };

  const validate = () => {
    const next: AuthErrors = {};
    if (mode === "register" && !form.name.trim()) next.name = copy.required;
    if (!form.email.trim()) {
      next.email = copy.required;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = copy.invalidEmail;
    }
    if (!form.password) {
      next.password = copy.required;
    } else if (form.password.length < 6) {
      next.password = copy.passwordLength;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const authenticate = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const endpoint = mode === "login" ? "/login" : "/register";
      const payload =
        mode === "login"
          ? { email: form.email.trim(), password: form.password }
          : {
              name: form.name.trim(),
              email: form.email.trim(),
              password: form.password,
              password_confirmation: form.password,
            };
      const response = await axios.post(`${Config.apiBaseUrl}${endpoint}`, payload, {
        headers: { Accept: "application/json", "Content-Type": "application/json" },
      });
      const { token, user, teacher } = response.data;
      if (!token || !user) throw new Error("Authentication response is incomplete.");
      await AsyncStorage.multiSet([
        ["auth_token", String(token)],
        ["user", JSON.stringify(user)],
        ["user_id", String(user.id)],
      ]);
      setUser(user);
      if (teacher) {
        await AsyncStorage.setItem("teacher", JSON.stringify(teacher));
        setTeacher(teacher);
      } else {
        await AsyncStorage.removeItem("teacher");
      }
      router.replace(mode === "register" || !teacher ? "/setup" : "/");
    } catch (authError) {
      const next: AuthErrors = {};
      if (axios.isAxiosError(authError) && authError.response) {
        const serverErrors = authError.response.data?.errors ?? {};
        const first = (value: unknown) =>
          Array.isArray(value) ? String(value[0]) : value ? String(value) : undefined;
        next.name = first(serverErrors.name);
        next.email = first(serverErrors.email);
        next.password = first(serverErrors.password);
        if (!next.name && !next.email && !next.password) {
          next.general =
            authError.response.data?.message ??
            (authError.response.status === 401
              ? language === "fr"
                ? "Email ou mot de passe incorrect."
                : "Incorrect email or password."
              : language === "fr"
                ? "Impossible de se connecter."
                : "Unable to sign in.");
        }
      } else {
        next.general =
          authError instanceof Error ? authError.message : copy.network;
      }
      setErrors(next);
    } finally {
      setLoading(false);
    }
  };

  const resetResetFlow = () => {
    setResetStep("email");
    setResetEmail("");
    setResetPhone("");
    setMaskedPhone("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
  };

  const closeReset = () => {
    setShowReset(false);
    resetResetFlow();
  };

  const findAccountAndSendCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim())) {
      setResetError(copy.invalidEmail);
      return;
    }
    setResetLoading(true);
    setResetError("");
    try {
      const accountResponse = await fetch(
        `${Config.apiBaseUrl}/forgot-password/find-phone`,
        {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmail.trim() }),
        },
      );
      const account = await accountResponse.json();
      if (!accountResponse.ok || !account.success) {
        throw new Error(account.message ?? "No account found with this email.");
      }
      setMaskedPhone(account.masked_phone ?? "");
      const otpResponse = await fetch(
        `${Config.apiBaseUrl}/forgot-password/send-otp`,
        {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmail.trim() }),
        },
      );
      const otpPayload = await otpResponse.json();
      if (!otpResponse.ok || !otpPayload.success) {
        throw new Error(otpPayload.message ?? "Unable to send verification code.");
      }
      setResetPhone(otpPayload.phone ?? "");
      setResetStep("otp");
    } catch (resetFailure) {
      setResetError(
        resetFailure instanceof Error ? resetFailure.message : copy.network,
      );
    } finally {
      setResetLoading(false);
    }
  };

  const resendCode = async () => {
    setResetLoading(true);
    setResetError("");
    try {
      const response = await fetch(
        `${Config.apiBaseUrl}/forgot-password/send-otp`,
        {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmail.trim() }),
        },
      );
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to resend the code.");
      }
    } catch (resetFailure) {
      setResetError(
        resetFailure instanceof Error ? resetFailure.message : copy.network,
      );
    } finally {
      setResetLoading(false);
    }
  };

  const verifyCode = () => {
    if (!/^\d{6}$/.test(otp)) {
      setResetError(
        language === "fr"
          ? "Saisissez les 6 chiffres du code."
          : "Enter all 6 digits of the code.",
      );
      return;
    }
    setResetError("");
    setResetStep("password");
  };

  const resetPassword = async () => {
    if (newPassword.length < 8) {
      setResetError(
        language === "fr"
          ? "Le mot de passe doit contenir au moins 8 caractères."
          : "Password must be at least 8 characters.",
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError(copy.mismatch);
      return;
    }
    setResetLoading(true);
    setResetError("");
    try {
      const response = await fetch(
        `${Config.apiBaseUrl}/forgot-password/reset`,
        {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            email: resetEmail.trim(),
            phone: resetPhone,
            code: otp,
            new_password: newPassword,
            new_password_confirmation: confirmPassword,
          }),
        },
      );
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to reset password.");
      }
      Alert.alert(copy.success, copy.successMessage, [
        { text: "OK", onPress: closeReset },
      ]);
    } catch (resetFailure) {
      setResetError(
        resetFailure instanceof Error ? resetFailure.message : copy.network,
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <View style={styles.brand}>
            <View style={[styles.logo, { backgroundColor: colors.primary }]}>
              <Text style={[typography.heading, { color: colors.onPrimary }]}>F</Text>
            </View>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>
              {copy.app}
            </Text>
          </View>
          <View style={styles.language}>
            <FilterChips
              options={[
                { value: "en", label: "EN" },
                { value: "fr", label: "FR" },
              ]}
              selected={language}
              onSelect={(value) => void setLanguage(value)}
            />
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={[typography.label, { color: colors.primary }]}>
            {copy.eyebrow}
          </Text>
          <Text style={[typography.display, { color: colors.text }]}>
            {mode === "login" ? copy.loginTitle : copy.registerTitle}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {mode === "login" ? copy.loginSubtitle : copy.registerSubtitle}
          </Text>
        </View>

        <View style={[styles.mode, { backgroundColor: colors.surfaceMuted }]}>
          {(["login", "register"] as const).map((item) => (
            <Pressable
              key={item}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === item }}
              onPress={() => changeMode(item)}
              style={[
                styles.modeButton,
                { backgroundColor: mode === item ? colors.surface : "transparent" },
              ]}
            >
              <Text
                style={[
                  typography.label,
                  { color: mode === item ? colors.primary : colors.textSecondary },
                ]}
              >
                {item === "login" ? copy.login : copy.register}
              </Text>
            </Pressable>
          ))}
        </View>

        <Card style={styles.formCard}>
          {errors.general ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.errorSoft }]}>
              <Feather name="alert-circle" size={18} color={colors.error} />
              <Text style={[typography.body, { color: colors.error, flex: 1 }]}>
                {errors.general}
              </Text>
            </View>
          ) : null}
          {mode === "register" ? (
            <FormField
              label={copy.name}
              value={form.name}
              onChangeText={(name) => {
                setForm({ ...form, name });
                setErrors({ ...errors, name: undefined });
              }}
              placeholder={copy.namePlaceholder}
              autoCapitalize="words"
              textContentType="name"
              error={errors.name}
            />
          ) : null}
          <FormField
            label={copy.email}
            value={form.email}
            onChangeText={(email) => {
              setForm({ ...form, email });
              setErrors({ ...errors, email: undefined, general: undefined });
            }}
            placeholder={copy.emailPlaceholder}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />
          <FormField
            label={copy.password}
            value={form.password}
            onChangeText={(password) => {
              setForm({ ...form, password });
              setErrors({ ...errors, password: undefined, general: undefined });
            }}
            placeholder={copy.passwordPlaceholder}
            secureTextEntry
            textContentType={mode === "login" ? "password" : "newPassword"}
            error={errors.password}
          />
          {mode === "login" ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowReset(true)}
              style={styles.forgot}
            >
              <Text style={[typography.label, { color: colors.primary }]}>
                {copy.forgot}
              </Text>
            </Pressable>
          ) : null}
          <Button
            label={mode === "login" ? copy.signIn : copy.signUp}
            icon={mode === "login" ? "log-in" : "user-plus"}
            loading={loading}
            onPress={() => void authenticate()}
          />
        </Card>
        <View style={styles.secure}>
          <Feather name="shield" size={15} color={colors.textMuted} />
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {copy.secure}
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showReset}
        transparent
        animationType="slide"
        onRequestClose={closeReset}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
            onPress={closeReset}
          />
          <View style={[styles.sheet, { backgroundColor: colors.surfaceElevated }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetTitle}>
              <View>
                <Text style={[typography.heading, { color: colors.text }]}>
                  {copy.resetTitle}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {resetStep === "email"
                    ? copy.resetDescription
                    : resetStep === "otp"
                      ? `${copy.codeHelp} ${maskedPhone}`
                      : copy.resetDescription}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.cancel}
                onPress={closeReset}
                style={styles.close}
              >
                <Feather name="x" size={22} color={colors.text} />
              </Pressable>
            </View>
            {resetError ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.errorSoft }]}>
                <Feather name="alert-circle" size={18} color={colors.error} />
                <Text style={[typography.body, { color: colors.error, flex: 1 }]}>
                  {resetError}
                </Text>
              </View>
            ) : null}
            {resetStep === "email" ? (
              <>
                <FormField
                  label={copy.email}
                  value={resetEmail}
                  onChangeText={(value) => {
                    setResetEmail(value);
                    setResetError("");
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder={copy.emailPlaceholder}
                />
                <Button
                  label={copy.continue}
                  icon="arrow-right"
                  loading={resetLoading}
                  onPress={() => void findAccountAndSendCode()}
                />
              </>
            ) : resetStep === "otp" ? (
              <>
                <FormField
                  label={copy.code}
                  value={otp}
                  onChangeText={(value) => {
                    setOtp(value.replace(/\D/g, "").slice(0, 6));
                    setResetError("");
                  }}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                />
                <Button label={copy.verify} onPress={verifyCode} />
                <Button
                  label={copy.resend}
                  variant="secondary"
                  loading={resetLoading}
                  onPress={() => void resendCode()}
                />
              </>
            ) : (
              <>
                <FormField
                  label={copy.newPassword}
                  value={newPassword}
                  onChangeText={(value) => {
                    setNewPassword(value);
                    setResetError("");
                  }}
                  secureTextEntry
                  textContentType="newPassword"
                />
                <FormField
                  label={copy.confirmPassword}
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    setResetError("");
                  }}
                  secureTextEntry
                  textContentType="newPassword"
                />
                <Button
                  label={copy.reset}
                  icon="check"
                  loading={resetLoading}
                  onPress={() => void resetPassword()}
                />
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  logo: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  language: { maxWidth: 124 },
  intro: { gap: spacing.xs },
  mode: { flexDirection: "row", borderRadius: radii.md, padding: 4 },
  modeButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  formCard: { gap: spacing.md },
  forgot: { alignSelf: "flex-end", minHeight: 36, justifyContent: "center" },
  errorBanner: {
    minHeight: 48,
    borderRadius: radii.md,
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  secure: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
  },
  sheetTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
