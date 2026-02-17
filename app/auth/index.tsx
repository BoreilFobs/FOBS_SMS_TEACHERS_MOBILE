import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ImageBackground, 
  KeyboardAvoidingView,
  Animated,
  Easing,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
  useColorScheme,
  StatusBar,
  Modal,
  Alert
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
// import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import Config from '@/constants/Config';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width } = Dimensions.get('window');

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  general?: string;
};

type ForgotPasswordStep = 'email' | 'otp' | 'password';

export default function AuthScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const API_URL = Config.apiBaseUrl;

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmNewPasswordVisible, setIsConfirmNewPasswordVisible] = useState(false);
  const otpInputRefs = useRef<Array<TextInput | null>>([]);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const toggleAuthMode = () => {
    setErrors({});
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 30,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsLogin(!isLogin);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleChange = (name: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Forgot Password Functions
  const resetForgotPassword = () => {
    setForgotPasswordStep('email');
    setForgotEmail('');
    setForgotPhone('');
    setMaskedPhone('');
    setOtpCode(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmNewPassword('');
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
      setForgotPasswordError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotPasswordError('Please enter a valid email');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordError('');

    try {
      const response = await fetch(`${API_URL}/forgot-password/find-phone`, {
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
        const otpResponse = await fetch(`${API_URL}/forgot-password/send-otp`, {
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
          setForgotPasswordError(otpResult.message || 'Failed to send verification code');
        }
      } else {
        setForgotPasswordError(result.message || 'No account found with this email');
      }
    } catch (error) {
      console.error('Find phone error:', error);
      setForgotPasswordError('Network error. Please check your connection.');
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

    // Auto-focus next input
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
      setForgotPasswordError('Please enter all 6 digits');
      return;
    }

    setForgotPasswordStep('password');
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      setForgotPasswordError('Password is required');
      return;
    }
    if (newPassword.length < 8) {
      setForgotPasswordError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotPasswordError('Passwords do not match');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordError('');

    try {
      const response = await fetch(`${API_URL}/forgot-password/reset`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: forgotEmail,
          phone: forgotPhone,
          code: otpCode.join(''),
          new_password: newPassword,
          new_password_confirmation: confirmNewPassword
        })
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Success',
          'Your password has been reset successfully. You can now log in with your new password.',
          [{ text: 'OK', onPress: handleForgotPasswordClose }]
        );
      } else {
        setForgotPasswordError(result.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setForgotPasswordError('Network error. Please check your connection.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setForgotPasswordLoading(true);
    setForgotPasswordError('');

    try {
      const response = await fetch(`${API_URL}/forgot-password/send-otp`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: forgotEmail })
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Success', 'Verification code resent successfully');
      } else {
        setForgotPasswordError(result.message || 'Failed to resend code');
      }
    } catch (error) {
      setForgotPasswordError('Network error. Please check your connection.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!isLogin && !formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAuth = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
     const endpoint = isLogin ? '/login' : '/register';
        const data = isLogin
            ? { email: formData.email, password: formData.password }
            : { name: formData.name, email: formData.email, password: formData.password, password_confirmation: formData.password };

        const response = await axios.post(`${API_URL}${endpoint}`, data, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (response.data.token) {
            await AsyncStorage.setItem('auth_token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
            await AsyncStorage.setItem('user_id', parseInt(response.data.user.id).toString());

            if (isLogin) {
                await AsyncStorage.setItem('teacher', JSON.stringify(response.data.teacher));
                router.push('/');
            } else {
                router.push('/setup');
            }
        } else {
            throw new Error('Authentication token missing in response');
        }
     
    } catch (error: any) {
      const newErrors: FormErrors = {};

      if (axios.isAxiosError(error) && error.response) {
        const { status, data: resData } = error.response;
        const serverErrors = resData?.errors || {};
        const serverMessage = resData?.message || '';

        // Map field-level errors from the API
        if (serverErrors.email) {
          newErrors.email = Array.isArray(serverErrors.email)
            ? serverErrors.email[0]
            : serverErrors.email;
        }
        if (serverErrors.password) {
          newErrors.password = Array.isArray(serverErrors.password)
            ? serverErrors.password[0]
            : serverErrors.password;
        }
        if (serverErrors.name) {
          newErrors.name = Array.isArray(serverErrors.name)
            ? serverErrors.name[0]
            : serverErrors.name;
        }

        // Set a user-friendly general message based on status code
        if (status === 401) {
          // Wrong email/password
          if (!newErrors.email && !newErrors.password) {
            newErrors.general = serverMessage || 'Invalid email or password. Please try again.';
          }
        } else if (status === 403) {
          // Email exists but wrong role
          newErrors.general = serverMessage || 'This account cannot be used with this app.';
        } else if (status === 422) {
          // Validation errors (e.g. registration: email taken, password too short)
          if (!newErrors.email && !newErrors.password && !newErrors.name) {
            newErrors.general = serverMessage || 'Please check your input and try again.';
          }
        } else if (status === 429) {
          newErrors.general = 'Too many attempts. Please wait a moment and try again.';
        } else {
          newErrors.general = serverMessage || 'Something went wrong. Please try again.';
        }
      } else if (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK') {
        newErrors.general = 'Network error. Please check your internet connection.';
      } else {
        newErrors.general = error?.message || 'An unexpected error occurred. Please try again.';
      }

      setErrors(newErrors);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={require('@/assets/images/auth-bg2.jpg')} 
      style={styles.container}
      blurRadius={10}
    >
      <BlurView intensity={Platform.OS === 'ios' ? 80 : 40} style={StyleSheet.absoluteFill} tint={colorScheme ?? 'light'} />
      
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.authContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                shadowColor: colors.text,
              }
            ]}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 20 : 12}
              tint={colorScheme ?? 'light'}
              style={[
                styles.authCard,
                {
                  backgroundColor: colorScheme === 'dark' 
                    ? 'rgba(30, 30, 35, 0.85)' 
                    : 'rgba(255, 255, 255, 0.92)',
                },
              ]}
            >
              <LinearGradient
                colors={[colors.primary, colors.tint]}
                start={[0, 0]}
                end={[1, 0]}
                style={styles.gradientBorder}
              />
              
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
                  <Ionicons 
                    name={isLogin ? 'log-in' : 'person-add'} 
                    size={32} 
                    color={colors.primary} 
                  />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {isLogin ? 'Sign in to continue' : 'Join our community'}
                </Text>
              </View>

              {errors.general && (
                <BlurView
                  intensity={Platform.OS === 'ios' ? 8 : 4}
                  tint={colorScheme ?? 'light'}
                  style={[
                    styles.errorContainer, 
                    { 
                      backgroundColor: `${colors.error}20`,
                      borderColor: `${colors.error}40`,
                    }
                  ]}
                >
                  <Ionicons name="warning-outline" size={16} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.general}
                  </Text>
                </BlurView>
              )}

              {!isLogin && (
                <View>
                  <BlurView
                    intensity={Platform.OS === 'ios' ? 6 : 3}
                    tint={colorScheme ?? 'light'}
                    style={[
                      styles.inputContainer, 
                      { 
                        borderColor: errors.name ? colors.error : colors.border,
                        borderWidth: errors.name ? 2 : 1.5,
                        backgroundColor: colorScheme === 'dark' 
                          ? 'rgba(50, 50, 55, 0.4)' 
                          : 'rgba(245, 245, 250, 0.6)',
                      }
                    ]}
                  >
                    <Ionicons 
                      name="person-outline" 
                      size={20} 
                      color={errors.name ? colors.error : colors.textSecondary} 
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Full Name"
                      placeholderTextColor={colors.textSecondary}
                      value={formData.name}
                      onChangeText={(text) => handleChange('name', text)}
                      autoCapitalize="words"
                      editable={!isLoading}
                    />
                  </BlurView>
                  {errors.name && (
                    <View style={styles.errorMessageContainer}>
                      <Text style={[styles.errorMessage, { color: colors.error }]}>
                        {errors.name}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View>
                <BlurView
                  intensity={Platform.OS === 'ios' ? 6 : 3}
                  tint={colorScheme ?? 'light'}
                  style={[
                    styles.inputContainer, 
                    { 
                      borderColor: errors.email ? colors.error : colors.border,
                      borderWidth: errors.email ? 2 : 1.5,
                      backgroundColor: colorScheme === 'dark' 
                        ? 'rgba(50, 50, 55, 0.4)' 
                        : 'rgba(245, 245, 250, 0.6)',
                    }
                  ]}
                >
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color={errors.email ? colors.error : colors.textSecondary} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Email Address"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(text) => handleChange('email', text)}
                    editable={!isLoading}
                  />
                </BlurView>
                {errors.email && (
                  <View style={styles.errorMessageContainer}>
                    <Text style={[styles.errorMessage, { color: colors.error }]}>
                      {errors.email}
                    </Text>
                  </View>
                )}
              </View>

              <View>
                <BlurView
                  intensity={Platform.OS === 'ios' ? 6 : 3}
                  tint={colorScheme ?? 'light'}
                  style={[
                    styles.inputContainer, 
                    { 
                      borderColor: errors.password ? colors.error : colors.border,
                      borderWidth: errors.password ? 2 : 1.5,
                      backgroundColor: colorScheme === 'dark' 
                        ? 'rgba(50, 50, 55, 0.4)' 
                        : 'rgba(245, 245, 250, 0.6)',
                    }
                  ]}
                >
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={errors.password ? colors.error : colors.textSecondary} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!isPasswordVisible}
                    value={formData.password}
                    onChangeText={(text) => handleChange('password', text)}
                    editable={!isLoading}
                  />
                  <TouchableOpacity 
                    onPress={togglePasswordVisibility}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons 
                      name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
                      size={20} 
                      color={errors.password ? colors.error : colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </BlurView>
                {errors.password && (
                  <View style={styles.errorMessageContainer}>
                    <Text style={[styles.errorMessage, { color: colors.error }]}>
                      {errors.password}
                    </Text>
                  </View>
                )}
                {isLogin && (
                  <TouchableOpacity 
                    onPress={handleForgotPasswordOpen}
                    style={styles.forgotPasswordLink}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity 
                style={[
                  styles.primaryButton, 
                  { 
                    backgroundColor: colors.primary,
                    opacity: isLoading ? 0.7 : 1,
                    shadowColor: colors.primary,
                  }
                ]}
                activeOpacity={0.9}
                onPress={handleAuth}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[colors.primary, colors.tint]}
                  start={[0, 0]}
                  end={[1, 0]}
                  style={styles.buttonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>
                        {isLogin ? 'Sign In' : 'Sign Up'}
                      </Text>
                      <Ionicons 
                        name="arrow-forward" 
                        size={20} 
                        color="white" 
                        style={styles.buttonIcon}
                      />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={toggleAuthMode}
                style={styles.toggleAuth}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>
                    {isLogin ? 'Register now' : 'Login here'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPassword}
        transparent
        animationType="fade"
        onRequestClose={handleForgotPasswordClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colorScheme === 'dark' ? '#1e1e23' : '#fff' }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {forgotPasswordStep === 'email' && 'Forgot Password'}
                {forgotPasswordStep === 'otp' && 'Verify Code'}
                {forgotPasswordStep === 'password' && 'New Password'}
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
            {forgotPasswordError && (
              <View style={[styles.modalErrorContainer, { backgroundColor: colors.error + '20' }]}>
                <Ionicons name="warning-outline" size={16} color={colors.error} />
                <Text style={[styles.modalErrorText, { color: colors.error }]}>
                  {forgotPasswordError}
                </Text>
              </View>
            )}

            {/* Step Content */}
            {forgotPasswordStep === 'email' && (
              <View>
                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  Enter your email address and we'll send a verification code to your registered WhatsApp number.
                </Text>
                <View style={[styles.modalInputContainer, { borderColor: colors.border, backgroundColor: colorScheme === 'dark' ? 'rgba(50, 50, 55, 0.4)' : 'rgba(245, 245, 250, 0.6)' }]}>
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color={colors.textSecondary} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Email Address"
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
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleFindPhone}
                  disabled={forgotPasswordLoading}
                >
                  {forgotPasswordLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.modalButtonText}>Continue</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {forgotPasswordStep === 'otp' && (
              <View>
                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  We sent a 6-digit code to {maskedPhone}
                </Text>
                <View style={styles.otpContainer}>
                  {otpCode.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (otpInputRefs.current[index] = ref)}
                      style={[
                        styles.otpInput,
                        { 
                          borderColor: colors.border,
                          color: colors.text,
                          backgroundColor: colorScheme === 'dark' ? 'rgba(50, 50, 55, 0.4)' : 'rgba(245, 245, 250, 0.6)'
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
                    Resend Code
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleVerifyOtp}
                  disabled={forgotPasswordLoading || otpCode.join('').length !== 6}
                >
                  {forgotPasswordLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.modalButtonText}>Verify</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {forgotPasswordStep === 'password' && (
              <View>
                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  Enter your new password
                </Text>
                <View style={[styles.modalInputContainer, { borderColor: colors.border, backgroundColor: colorScheme === 'dark' ? 'rgba(50, 50, 55, 0.4)' : 'rgba(245, 245, 250, 0.6)' }]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={colors.textSecondary} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="New Password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!isNewPasswordVisible}
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      setForgotPasswordError('');
                    }}
                    editable={!forgotPasswordLoading}
                  />
                  <TouchableOpacity 
                    onPress={() => setIsNewPasswordVisible(!isNewPasswordVisible)}
                  >
                    <Ionicons 
                      name={isNewPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
                <View style={[styles.modalInputContainer, { borderColor: colors.border, backgroundColor: colorScheme === 'dark' ? 'rgba(50, 50, 55, 0.4)' : 'rgba(245, 245, 250, 0.6)', marginTop: 12 }]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={colors.textSecondary} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Confirm New Password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!isConfirmNewPasswordVisible}
                    value={confirmNewPassword}
                    onChangeText={(text) => {
                      setConfirmNewPassword(text);
                      setForgotPasswordError('');
                    }}
                    editable={!forgotPasswordLoading}
                  />
                  <TouchableOpacity 
                    onPress={() => setIsConfirmNewPasswordVisible(!isConfirmNewPasswordVisible)}
                  >
                    <Ionicons 
                      name={isConfirmNewPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleResetPassword}
                  disabled={forgotPasswordLoading}
                >
                  {forgotPasswordLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.modalButtonText}>Reset Password</Text>
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
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  authContainer: {
    marginHorizontal: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  authCard: {
    borderRadius: 28,
    padding: 28,
    overflow: 'hidden',
  },
  gradientBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 4,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 6,
    overflow: 'hidden',
  },
  inputIcon: {
    marginRight: 14,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 2,
  },
  errorMessageContainer: {
    marginBottom: 14,
    marginLeft: 14,
  },
  errorMessage: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: 14,
    marginTop: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: -0.3,
  },
  buttonIcon: {
    marginTop: 2,
  },
  toggleAuth: {
    marginTop: 8,
    alignItems: 'center',
    padding: 12,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '500',
  },
  // Forgot Password Styles
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 4,
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
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1.5,
  },
  modalButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  modalErrorText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
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
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 1.5,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  resendButton: {
    alignSelf: 'center',
    marginBottom: 8,
    padding: 8,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
});