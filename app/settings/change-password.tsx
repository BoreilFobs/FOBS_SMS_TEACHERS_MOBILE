import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Platform,
  useColorScheme,
  Modal,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
// import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import useUserStore from '@/utils/stores/userStore';
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Config from '@/constants/Config';
import { useLanguage } from "@/contexts/LanguageContext";

const withOpacity = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

type ForgotPasswordStep = 'email' | 'otp' | 'password';

export default function ChangePasswordScreen() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { user } = useUserStore();
  const { language } = useLanguage();

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [secureEntries, setSecureEntries] = useState({
    current: true,
    new: true,
    confirm: true
  });

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep>('email');
  const [forgotEmail, setForgotEmail] = useState(user?.email || '');
  const [forgotPhone, setForgotPhone] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  // Translations
  const t = (key: string) => {
    const translations: { [key: string]: { en: string; fr: string } } = {
      change_password: { en: 'Change Password', fr: 'Changer le mot de passe' },
      current_password: { en: 'Current Password', fr: 'Mot de passe actuel' },
      new_password: { en: 'New Password', fr: 'Nouveau mot de passe' },
      confirm_password: { en: 'Confirm Password', fr: 'Confirmer le mot de passe' },
      enter_current: { en: 'Enter current password', fr: 'Entrer le mot de passe actuel' },
      enter_new: { en: 'Enter new password', fr: 'Entrer le nouveau mot de passe' },
      confirm_new: { en: 'Confirm new password', fr: 'Confirmer le nouveau mot de passe' },
      save_changes: { en: 'Save Changes', fr: 'Enregistrer' },
      forgot_password: { en: 'Forgot Password?', fr: 'Mot de passe oublié ?' },
      forgot_description: { en: "Enter your email to receive a verification code on WhatsApp", fr: "Entrez votre email pour recevoir un code de vérification sur WhatsApp" },
      email_address: { en: 'Email Address', fr: 'Adresse email' },
      continue: { en: 'Continue', fr: 'Continuer' },
      verify_code: { en: 'Verify Code', fr: 'Vérifier le code' },
      otp_sent_to: { en: 'Code sent to', fr: 'Code envoyé à' },
      resend_code: { en: 'Resend Code', fr: 'Renvoyer le code' },
      verify: { en: 'Verify', fr: 'Vérifier' },
      reset_password: { en: 'Reset Password', fr: 'Réinitialiser le mot de passe' },
      enter_new_password: { en: 'Enter your new password', fr: 'Entrez votre nouveau mot de passe' },
      password_mismatch: { en: "Passwords don't match", fr: 'Les mots de passe ne correspondent pas' },
      password_min_8: { en: 'Password must be at least 8 characters', fr: 'Le mot de passe doit contenir au moins 8 caractères' },
      email_required: { en: 'Email is required', fr: "L'email est requis" },
      email_invalid: { en: 'Invalid email format', fr: 'Format email invalide' },
      email_not_found: { en: 'Email not found', fr: 'Email non trouvé' },
      otp_incomplete: { en: 'Please enter the complete code', fr: 'Veuillez entrer le code complet' },
      success: { en: 'Success', fr: 'Succès' },
      password_changed: { en: 'Password changed successfully!', fr: 'Mot de passe modifié avec succès !' },
      password_reset_success: { en: 'Password reset successfully!', fr: 'Mot de passe réinitialisé avec succès !' },
      error: { en: 'Error', fr: 'Erreur' },
      network_error: { en: 'Network error. Please try again.', fr: 'Erreur réseau. Veuillez réessayer.' },
      otp_send_failed: { en: 'Failed to send verification code', fr: "Échec de l'envoi du code de vérification" },
      otp_resent: { en: 'Verification code resent', fr: 'Code de vérification renvoyé' },
    };
    return translations[key]?.[language] || translations[key]?.en || key;
  };

  const toggleSecureEntry = (field: keyof typeof secureEntries) => {
    setSecureEntries(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showAlert(t('error'), t('password_mismatch'));
      return;
    }

    if (newPassword.length < 8) {
      showAlert(t('error'), t('password_min_8'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${Config.apiBaseUrl}/user/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
        },
        body: JSON.stringify({
          user_id: user?.id,
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword
        }),
      });

      const data = await response.json();

      if (data.success) {
        showAlert(t('success'), t('password_changed'), () => router.back());
      } else {
        showAlert(t('error'), data.message || "Failed to change password");
      }
    } catch (error) {
      showAlert(t('error'), t('network_error'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Functions
  const resetForgotPassword = () => {
    setForgotPasswordStep('email');
    setForgotEmail(user?.email || '');
    setForgotPhone('');
    setMaskedPhone('');
    setOtpCode(['', '', '', '', '', '']);
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotPasswordError('');
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
      setForgotPasswordError(t('email_required'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotPasswordError(t('email_invalid'));
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordError('');

    try {
      const response = await fetch(`${Config.apiBaseUrl}/forgot-password/find-phone`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: forgotEmail })
      });

      const result = await response.json();

      if (result.success) {
        setMaskedPhone(result.masked_phone);
        // Now send the OTP
        const otpResponse = await fetch(`${Config.apiBaseUrl}/forgot-password/send-otp`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: forgotEmail })
        });

        const otpResult = await otpResponse.json();

        if (otpResult.success) {
          setForgotPhone(otpResult.phone);
          setForgotPasswordStep('otp');
        } else {
          setForgotPasswordError(otpResult.message || t('otp_send_failed'));
        }
      } else {
        setForgotPasswordError(result.message || t('email_not_found'));
      }
    } catch (error) {
      console.error('Find phone error:', error);
      setForgotPasswordError(t('network_error'));
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);
    setForgotPasswordError('');

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.join('');
    if (code.length !== 6) {
      setForgotPasswordError(t('otp_incomplete'));
      return;
    }
    setForgotPasswordStep('password');
  };

  const handleResetPassword = async () => {
    if (!forgotNewPassword) {
      setForgotPasswordError(t('new_password') + ' ' + t('email_required').toLowerCase());
      return;
    }
    if (forgotNewPassword.length < 8) {
      setForgotPasswordError(t('password_min_8'));
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotPasswordError(t('password_mismatch'));
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordError('');

    try {
      const response = await fetch(`${Config.apiBaseUrl}/forgot-password/reset`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: forgotEmail,
          phone: forgotPhone,
          code: otpCode.join(''),
          new_password: forgotNewPassword,
          new_password_confirmation: forgotConfirmPassword
        })
      });

      const result = await response.json();

      if (result.success) {
        showAlert(t('success'), t('password_reset_success'), handleForgotPasswordClose);
      } else {
        setForgotPasswordError(result.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setForgotPasswordError(t('network_error'));
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setForgotPasswordLoading(true);
    setForgotPasswordError('');

    try {
      const response = await fetch(`${Config.apiBaseUrl}/forgot-password/send-otp`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: forgotEmail })
      });

      const result = await response.json();

      if (result.success) {
        showAlert(t('success'), t('otp_resent'));
      } else {
        setForgotPasswordError(result.message || t('otp_send_failed'));
      }
    } catch (error) {
      setForgotPasswordError(t('network_error'));
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/auth-bg2.jpg")}
      style={styles.container}
      blurRadius={10}
    >
      <BlurView intensity={Platform.OS === 'ios' ? 330 : 100} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
      
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}
          >
            <Feather name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('change_password')}</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 12 : 100}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={[
            styles.formSection,
            {
              backgroundColor: colorScheme === 'dark' 
                ? withOpacity(colors.card, 0.6)
                : withOpacity(colors.card, 0.85),
              borderColor: colorScheme === 'dark'
                ? withOpacity(colors.border, 0.3)
                : withOpacity(colors.border, 0.5),
            }
          ]}
        >
          {/* Current Password */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>{t('current_password')}</Text>
            </View>
            <View style={[
              styles.inputWrapper,
              {
                backgroundColor: colorScheme === 'dark'
                  ? withOpacity(colors.card, 0.8)
                  : withOpacity('#ffffff', 0.9),
                borderWidth: 1,
                borderColor: colorScheme === 'dark'
                  ? withOpacity(colors.border, 0.5)
                  : withOpacity(colors.border, 0.3),
              }
            ]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder={t('enter_current')}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={secureEntries.current}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => toggleSecureEntry('current')}
                style={styles.eyeIcon}
              >
                <Feather 
                  name={secureEntries.current ? "eye-off" : "eye"} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="lock-open-outline" size={18} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>{t('new_password')}</Text>
            </View>
            <View style={[
              styles.inputWrapper,
              {
                backgroundColor: colorScheme === 'dark'
                  ? withOpacity(colors.card, 0.8)
                  : withOpacity('#ffffff', 0.9),
                borderWidth: 1,
                borderColor: colorScheme === 'dark'
                  ? withOpacity(colors.border, 0.5)
                  : withOpacity(colors.border, 0.3),
              }
            ]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder={t('enter_new')}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={secureEntries.new}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => toggleSecureEntry('new')}
                style={styles.eyeIcon}
              >
                <Feather 
                  name={secureEntries.new ? "eye-off" : "eye"} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>{t('confirm_password')}</Text>
            </View>
            <View style={[
              styles.inputWrapper,
              {
                backgroundColor: colorScheme === 'dark'
                  ? withOpacity(colors.card, 0.8)
                  : withOpacity('#ffffff', 0.9),
                borderWidth: 1,
                borderColor: colorScheme === 'dark'
                  ? withOpacity(colors.border, 0.5)
                  : withOpacity(colors.border, 0.3),
              }
            ]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('confirm_new')}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={secureEntries.confirm}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => toggleSecureEntry('confirm')}
                style={styles.eyeIcon}
              >
                <Feather 
                  name={secureEntries.confirm ? "eye-off" : "eye"} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>

        {/* Forgot Password Link */}
        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={handleForgotPasswordOpen}
        >
          <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
          <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
            {t('forgot_password')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleChangePassword}
          disabled={isLoading}
        >
          <LinearGradient
            colors={[colors.primary, colors.primary + 'CC']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{t('save_changes')}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPassword}
        transparent
        animationType="fade"
        onRequestClose={handleForgotPasswordClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {forgotPasswordStep === 'email' && t('forgot_password')}
                {forgotPasswordStep === 'otp' && t('verify_code')}
                {forgotPasswordStep === 'password' && t('reset_password')}
              </Text>
              <TouchableOpacity 
                onPress={handleForgotPasswordClose}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
              {['email', 'otp', 'password'].map((step, index) => (
                <View key={step} style={styles.stepContainer}>
                  <View style={[
                    styles.stepDot,
                    {
                      backgroundColor: ['email', 'otp', 'password'].indexOf(forgotPasswordStep) >= index 
                        ? colors.primary 
                        : colors.border
                    }
                  ]}>
                    {['email', 'otp', 'password'].indexOf(forgotPasswordStep) > index ? (
                      <Ionicons name="checkmark" size={12} color="white" />
                    ) : (
                      <Text style={styles.stepNumber}>{index + 1}</Text>
                    )}
                  </View>
                  {index < 2 && (
                    <View style={[
                      styles.stepLine,
                      {
                        backgroundColor: ['email', 'otp', 'password'].indexOf(forgotPasswordStep) > index 
                          ? colors.primary 
                          : colors.border
                      }
                    ]} />
                  )}
                </View>
              ))}
            </View>

            {/* Error Message */}
            {forgotPasswordError ? (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
                <Ionicons name="warning-outline" size={16} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {forgotPasswordError}
                </Text>
              </View>
            ) : null}

            {/* Step Content */}
            {forgotPasswordStep === 'email' && (
              <View>
                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  {t('forgot_description')}
                </Text>
                <View style={[styles.modalInputContainer, { borderColor: colors.border }]}>
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color={colors.textSecondary} 
                    style={styles.modalInputIcon}
                  />
                  <TextInput
                    style={[styles.modalInput, { color: colors.text }]}
                    placeholder={t('email_address')}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={forgotEmail}
                    onChangeText={(text) => {
                      setForgotEmail(text);
                      setForgotPasswordError('');
                    }}
                    editable={!forgotPasswordLoading}
                  />
                </View>
                <TouchableOpacity 
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={handleFindPhone}
                  disabled={forgotPasswordLoading}
                >
                  {forgotPasswordLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.primaryButtonText}>{t('continue')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {forgotPasswordStep === 'otp' && (
              <View>
                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  {t('otp_sent_to')} {maskedPhone}
                </Text>
                <View style={styles.otpContainer}>
                  {otpCode.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        otpInputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.otpInput,
                        { 
                          borderColor: colors.border,
                          color: colors.text,
                          backgroundColor: colors.background
                        }
                      ]}
                      maxLength={1}
                      keyboardType="number-pad"
                      value={digit}
                      onChangeText={(value) => handleOtpChange(index, value)}
                      onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
                    />
                  ))}
                </View>
                <TouchableOpacity 
                  onPress={handleResendOtp}
                  disabled={forgotPasswordLoading}
                  style={styles.resendButton}
                >
                  <Text style={[styles.resendText, { color: colors.primary }]}>
                    {t('resend_code')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={handleVerifyOtp}
                  disabled={forgotPasswordLoading || otpCode.join('').length !== 6}
                >
                  {forgotPasswordLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.primaryButtonText}>{t('verify')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {forgotPasswordStep === 'password' && (
              <View>
                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  {t('enter_new_password')}
                </Text>
                <View style={[styles.modalInputContainer, { borderColor: colors.border }]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={colors.textSecondary} 
                    style={styles.modalInputIcon}
                  />
                  <TextInput
                    style={[styles.modalInput, { color: colors.text }]}
                    placeholder={t('new_password')}
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showNewPassword}
                    value={forgotNewPassword}
                    onChangeText={(text) => {
                      setForgotNewPassword(text);
                      setForgotPasswordError('');
                    }}
                    editable={!forgotPasswordLoading}
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Ionicons 
                      name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
                <View style={[styles.modalInputContainer, { borderColor: colors.border, marginTop: 12 }]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={colors.textSecondary} 
                    style={styles.modalInputIcon}
                  />
                  <TextInput
                    style={[styles.modalInput, { color: colors.text }]}
                    placeholder={t('confirm_password')}
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showConfirmNewPassword}
                    value={forgotConfirmPassword}
                    onChangeText={(text) => {
                      setForgotConfirmPassword(text);
                      setForgotPasswordError('');
                    }}
                    editable={!forgotPasswordLoading}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                    <Ionicons 
                      name={showConfirmNewPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity 
                  style={[styles.primaryButton, { backgroundColor: colors.primary, marginTop: 20 }]}
                  onPress={handleResetPassword}
                  disabled={forgotPasswordLoading}
                >
                  {forgotPasswordLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.primaryButtonText}>{t('reset_password')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 35
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  formSection: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrapper: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    fontSize: 16,
    flex: 1,
    paddingRight: 8,
  },
  eyeIcon: {
    padding: 4,
  },
  saveButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  stepLine: {
    width: 50,
    height: 2,
    marginHorizontal: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  modalInputIcon: {
    marginRight: 10,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
