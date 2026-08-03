import React, { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AppHeader,
  Button,
  Card,
  FormField,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import useUserStore from "@/utils/stores/userStore";
import Config from "@/constants/Config";
import { elevation, radii, spacing, typography } from "@/constants/theme";

type ForgotPasswordStep = "email" | "otp" | "password";

const STEPS: ForgotPasswordStep[] = ["email", "otp", "password"];

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { user } = useUserStore();
  const { language } = useLanguage();

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] =
    useState<ForgotPasswordStep>("email");
  const [forgotEmail, setForgotEmail] = useState(user?.email || "");
  const [forgotPhone, setForgotPhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  const t = (key: string) => {
    const translations: { [key: string]: { en: string; fr: string } } = {
      change_password: { en: "Change password", fr: "Changer le mot de passe" },
      subtitle: { en: "Keep your account secure", fr: "Gardez votre compte sécurisé" },
      current_password: { en: "Current password", fr: "Mot de passe actuel" },
      new_password: { en: "New password", fr: "Nouveau mot de passe" },
      confirm_password: { en: "Confirm password", fr: "Confirmer le mot de passe" },
      enter_current: { en: "Enter current password", fr: "Entrer le mot de passe actuel" },
      enter_new: { en: "Enter new password", fr: "Entrer le nouveau mot de passe" },
      confirm_new: { en: "Confirm new password", fr: "Confirmer le nouveau mot de passe" },
      save_changes: { en: "Save changes", fr: "Enregistrer" },
      forgot_password: { en: "Forgot password?", fr: "Mot de passe oublié ?" },
      forgot_description: {
        en: "Enter your email to receive a verification code on WhatsApp",
        fr: "Entrez votre email pour recevoir un code de vérification sur WhatsApp",
      },
      email_address: { en: "Email address", fr: "Adresse email" },
      continue: { en: "Continue", fr: "Continuer" },
      verify_code: { en: "Verify code", fr: "Vérifier le code" },
      otp_sent_to: { en: "Code sent to", fr: "Code envoyé à" },
      resend_code: { en: "Resend code", fr: "Renvoyer le code" },
      verify: { en: "Verify", fr: "Vérifier" },
      reset_password: { en: "Reset password", fr: "Réinitialiser le mot de passe" },
      enter_new_password: { en: "Enter your new password", fr: "Entrez votre nouveau mot de passe" },
      password_mismatch: {
        en: "Passwords don't match",
        fr: "Les mots de passe ne correspondent pas",
      },
      password_min_8: {
        en: "Password must be at least 8 characters",
        fr: "Le mot de passe doit contenir au moins 8 caractères",
      },
      email_required: { en: "Email is required", fr: "L'email est requis" },
      email_invalid: { en: "Invalid email format", fr: "Format email invalide" },
      email_not_found: { en: "Email not found", fr: "Email non trouvé" },
      otp_incomplete: {
        en: "Please enter the complete code",
        fr: "Veuillez entrer le code complet",
      },
      success: { en: "Success", fr: "Succès" },
      password_changed: {
        en: "Password changed successfully!",
        fr: "Mot de passe modifié avec succès !",
      },
      password_reset_success: {
        en: "Password reset successfully!",
        fr: "Mot de passe réinitialisé avec succès !",
      },
      error: { en: "Error", fr: "Erreur" },
      network_error: {
        en: "Network error. Please try again.",
        fr: "Erreur réseau. Veuillez réessayer.",
      },
      otp_send_failed: {
        en: "Failed to send verification code",
        fr: "Échec de l'envoi du code de vérification",
      },
      otp_resent: { en: "Verification code resent", fr: "Code de vérification renvoyé" },
      security_tip: {
        en: "Use at least 8 characters, mixing letters, numbers and symbols.",
        fr: "Utilisez au moins 8 caractères, en mélangeant lettres, chiffres et symboles.",
      },
      close: { en: "Close", fr: "Fermer" },
    };
    return translations[key]?.[language] || translations[key]?.en || key;
  };

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, [{ text: "OK", onPress: onOk }]);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showAlert(t("error"), t("password_mismatch"));
      return;
    }
    if (newPassword.length < 8) {
      showAlert(t("error"), t("password_min_8"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${Config.apiBaseUrl}/user/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          user_id: user?.id,
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        }),
      });
      const data = await response.json();

      if (data.success) {
        showAlert(t("success"), t("password_changed"), () => router.back());
      } else {
        showAlert(t("error"), data.message || "Failed to change password");
      }
    } catch (error) {
      showAlert(t("error"), t("network_error"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForgotPassword = () => {
    setForgotPasswordStep("email");
    setForgotEmail(user?.email || "");
    setForgotPhone("");
    setMaskedPhone("");
    setOtpCode(["", "", "", "", "", ""]);
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotPasswordError("");
    setForgotPasswordLoading(false);
  };

  const handleForgotPasswordOpen = () => {
    resetForgotPassword();
    setShowForgotPassword(true);
  };

  const handleForgotPasswordClose = () => {
    setShowForgotPassword(false);
    resetForgotPassword();
  };

  const handleFindPhone = async () => {
    if (!forgotEmail.trim()) {
      setForgotPasswordError(t("email_required"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotPasswordError(t("email_invalid"));
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordError("");
    try {
      const response = await fetch(`${Config.apiBaseUrl}/forgot-password/find-phone`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const result = await response.json();

      if (result.success) {
        setMaskedPhone(result.masked_phone);
        const otpResponse = await fetch(`${Config.apiBaseUrl}/forgot-password/send-otp`, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail }),
        });
        const otpResult = await otpResponse.json();

        if (otpResult.success) {
          setForgotPhone(otpResult.phone);
          setForgotPasswordStep("otp");
        } else {
          setForgotPasswordError(otpResult.message || t("otp_send_failed"));
        }
      } else {
        setForgotPasswordError(result.message || t("email_not_found"));
      }
    } catch (error) {
      console.error("Find phone error:", error);
      setForgotPasswordError(t("network_error"));
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.length > 1 ? value.slice(-1) : value;
    const newOtp = [...otpCode];
    newOtp[index] = digit;
    setOtpCode(newOtp);
    setForgotPasswordError("");
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    if (otpCode.join("").length !== 6) {
      setForgotPasswordError(t("otp_incomplete"));
      return;
    }
    setForgotPasswordStep("password");
  };

  const handleResetPassword = async () => {
    if (!forgotNewPassword) {
      setForgotPasswordError(`${t("new_password")} ${t("email_required").toLowerCase()}`);
      return;
    }
    if (forgotNewPassword.length < 8) {
      setForgotPasswordError(t("password_min_8"));
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotPasswordError(t("password_mismatch"));
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordError("");
    try {
      const response = await fetch(`${Config.apiBaseUrl}/forgot-password/reset`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          phone: forgotPhone,
          code: otpCode.join(""),
          new_password: forgotNewPassword,
          new_password_confirmation: forgotConfirmPassword,
        }),
      });
      const result = await response.json();

      if (result.success) {
        showAlert(t("success"), t("password_reset_success"), handleForgotPasswordClose);
      } else {
        setForgotPasswordError(result.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setForgotPasswordError(t("network_error"));
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setForgotPasswordLoading(true);
    setForgotPasswordError("");
    try {
      const response = await fetch(`${Config.apiBaseUrl}/forgot-password/send-otp`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const result = await response.json();

      if (result.success) {
        showAlert(t("success"), t("otp_resent"));
      } else {
        setForgotPasswordError(result.message || t("otp_send_failed"));
      }
    } catch {
      setForgotPasswordError(t("network_error"));
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const stepIndex = STEPS.indexOf(forgotPasswordStep);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <Screen scroll bottomInset={false}>
        <AppHeader title={t("change_password")} subtitle={t("subtitle")} back />

        <Card variant="raised" style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primarySoft }]}>
            <Feather name="lock" size={26} color={colors.primary} />
          </View>
          <Text
            style={[
              typography.caption,
              { color: colors.textSecondary, textAlign: "center" },
            ]}
          >
            {t("security_tip")}
          </Text>
        </Card>

        <SectionHeader title={t("change_password")} />
        <Card style={styles.form}>
          <FormField
            label={t("current_password")}
            secureToggle
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder={t("enter_current")}
            autoCapitalize="none"
          />
          <FormField
            label={t("new_password")}
            secureToggle
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder={t("enter_new")}
            autoCapitalize="none"
          />
          <FormField
            label={t("confirm_password")}
            secureToggle
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t("confirm_new")}
            autoCapitalize="none"
            error={
              confirmPassword && newPassword !== confirmPassword
                ? t("password_mismatch")
                : undefined
            }
          />
          <Button
            label={t("save_changes")}
            icon="check"
            loading={isLoading}
            onPress={() => void handleChangePassword()}
          />
          <Pressable
            accessibilityRole="button"
            onPress={handleForgotPasswordOpen}
            hitSlop={8}
            style={({ pressed }) => [styles.forgotLink, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[typography.label, { color: colors.primary }]}>
              {t("forgot_password")}
            </Text>
          </Pressable>
        </Card>
      </Screen>

      <Modal
        visible={showForgotPassword}
        transparent
        animationType="slide"
        onRequestClose={handleForgotPasswordClose}
      >
        <View style={[styles.modalRoot, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.surfaceElevated },
              elevation.overlay,
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[typography.heading, { color: colors.text, flex: 1 }]}>
                {forgotPasswordStep === "email"
                  ? t("forgot_password")
                  : forgotPasswordStep === "otp"
                    ? t("verify_code")
                    : t("reset_password")}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("close")}
                onPress={handleForgotPasswordClose}
                hitSlop={8}
                style={styles.closeButton}
              >
                <Feather name="x" size={21} color={colors.text} />
              </Pressable>
            </View>

            {/* Step indicator */}
            <View style={styles.steps}>
              {STEPS.map((step, index) => (
                <View key={step} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepDot,
                      {
                        backgroundColor:
                          index <= stepIndex ? colors.primary : colors.surfaceMuted,
                      },
                    ]}
                  >
                    {index < stepIndex ? (
                      <Feather name="check" size={12} color={colors.onPrimary} />
                    ) : (
                      <Text
                        style={[
                          typography.micro,
                          {
                            color:
                              index === stepIndex ? colors.onPrimary : colors.textMuted,
                          },
                        ]}
                      >
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  {index < STEPS.length - 1 ? (
                    <View
                      style={[
                        styles.stepBar,
                        {
                          backgroundColor:
                            index < stepIndex ? colors.primary : colors.surfaceMuted,
                        },
                      ]}
                    />
                  ) : null}
                </View>
              ))}
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetContent}
            >
              {forgotPasswordStep === "email" ? (
                <>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>
                    {t("forgot_description")}
                  </Text>
                  <FormField
                    label={t("email_address")}
                    value={forgotEmail}
                    onChangeText={(text) => {
                      setForgotEmail(text);
                      setForgotPasswordError("");
                    }}
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={forgotPasswordError || undefined}
                  />
                  <Button
                    label={t("continue")}
                    loading={forgotPasswordLoading}
                    onPress={() => void handleFindPhone()}
                  />
                </>
              ) : null}

              {forgotPasswordStep === "otp" ? (
                <>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>
                    {t("otp_sent_to")} {maskedPhone}
                  </Text>
                  <View style={styles.otpRow}>
                    {otpCode.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(element) => {
                          otpInputRefs.current[index] = element;
                        }}
                        accessibilityLabel={`${t("verify_code")} ${index + 1}`}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(index, value)}
                        onKeyPress={({ nativeEvent }) =>
                          handleOtpKeyPress(index, nativeEvent.key)
                        }
                        keyboardType="number-pad"
                        maxLength={1}
                        style={[
                          styles.otpBox,
                          {
                            color: colors.text,
                            backgroundColor: colors.surface,
                            borderColor: digit ? colors.primary : colors.border,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  {forgotPasswordError ? (
                    <Text style={[typography.caption, { color: colors.error }]}>
                      {forgotPasswordError}
                    </Text>
                  ) : null}
                  <Button
                    label={t("verify")}
                    loading={forgotPasswordLoading}
                    onPress={handleVerifyOtp}
                  />
                  <Button
                    label={t("resend_code")}
                    variant="secondary"
                    onPress={() => void handleResendOtp()}
                  />
                </>
              ) : null}

              {forgotPasswordStep === "password" ? (
                <>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>
                    {t("enter_new_password")}
                  </Text>
                  <FormField
                    label={t("new_password")}
                    secureToggle
                    value={forgotNewPassword}
                    onChangeText={(text) => {
                      setForgotNewPassword(text);
                      setForgotPasswordError("");
                    }}
                    placeholder={t("enter_new")}
                    autoCapitalize="none"
                  />
                  <FormField
                    label={t("confirm_password")}
                    secureToggle
                    value={forgotConfirmPassword}
                    onChangeText={(text) => {
                      setForgotConfirmPassword(text);
                      setForgotPasswordError("");
                    }}
                    placeholder={t("confirm_new")}
                    autoCapitalize="none"
                    error={forgotPasswordError || undefined}
                  />
                  <Button
                    label={t("reset_password")}
                    loading={forgotPasswordLoading}
                    onPress={() => void handleResetPassword()}
                  />
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { alignItems: "center", gap: spacing.xs },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  form: { gap: spacing.sm },
  forgotLink: { alignSelf: "center", minHeight: 40, justifyContent: "center" },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    maxHeight: "88%",
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    paddingTop: spacing.xs,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  closeButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  steps: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  stepItem: { flexDirection: "row", alignItems: "center", flex: 1 },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBar: { flex: 1, height: 2, marginHorizontal: 6 },
  sheetContent: { gap: spacing.sm, paddingBottom: spacing.xxl },
  otpRow: { flexDirection: "row", gap: spacing.xs, justifyContent: "space-between" },
  otpBox: {
    flex: 1,
    height: 54,
    borderWidth: 1,
    borderRadius: radii.md,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
});
