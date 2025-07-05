import React, { useState } from 'react';
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
  Dimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
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
  const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
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
    setErrors(prev => ({ ...prev, general: undefined }));
    
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
            await AsyncStorage.setItem('teacher', JSON.stringify(response.data.teacher));
            await AsyncStorage.setItem('user_id', parseInt(response.data.user.id).toString());

            if (isLogin) {
              
                router.push('/(tabs)');
            } else {
                router.push('/setup');
            }
        } else {
            throw new Error('Authentication token missing in response');
        }
      await new Promise(resolve => setTimeout(resolve, 1500));
     
    } catch (error) {
      setErrors(prev => ({ ...prev, general: 'Authentication failed. Please try again.' }));
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
      <BlurView intensity={30} style={StyleSheet.absoluteFill} tint={colorScheme} />
      
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
                backgroundColor: colors.card,
                shadowColor: colors.text,
              }
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.tint]}
              start={[0, 0]}
              end={[1, 0]}
              style={styles.gradientBorder}
            />
            
            <View style={styles.header}>
              <Ionicons 
                name={isLogin ? 'log-in' : 'person-add'} 
                size={40} 
                color={colors.primary} 
                style={styles.authIcon}
              />
              <Text style={[styles.title, { color: colors.text }]}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {isLogin ? 'Sign in to continue' : 'Join our community'}
              </Text>
            </View>

            {errors.general && (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
                <Ionicons name="warning-outline" size={16} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.general}
                </Text>
              </View>
            )}

            {!isLogin && (
              <View>
                <View style={[
                  styles.inputContainer, 
                  { 
                    borderColor: errors.name ? colors.error : colors.border,
                    borderWidth: errors.name ? 1.5 : 1
                  }
                ]}>
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
                </View>
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
              <View style={[
                styles.inputContainer, 
                { 
                  borderColor: errors.email ? colors.error : colors.border,
                  borderWidth: errors.email ? 1.5 : 1
                }
              ]}>
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
              </View>
              {errors.email && (
                <View style={styles.errorMessageContainer}>
                  <Text style={[styles.errorMessage, { color: colors.error }]}>
                    {errors.email}
                  </Text>
                </View>
              )}
            </View>

            <View>
              <View style={[
                styles.inputContainer, 
                { 
                  borderColor: errors.password ? colors.error : colors.border,
                  borderWidth: errors.password ? 1.5 : 1
                }
              ]}>
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
              </View>
              {errors.password && (
                <View style={styles.errorMessageContainer}>
                  <Text style={[styles.errorMessage, { color: colors.error }]}>
                    {errors.password}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={[
                styles.primaryButton, 
                { 
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.8 : 1,
                  shadowColor: colors.primary,
                }
              ]}
              activeOpacity={0.9}
              onPress={handleAuth}
              disabled={isLoading}
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
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={toggleAuthMode}
              style={styles.toggleAuth}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  {isLogin ? 'Register now' : 'Login here'}
                </Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  gradientBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  authIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 4,
  },
  inputIcon: {
    marginRight: 12,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 2,
  },
  errorMessageContainer: {
    marginBottom: 12,
    marginLeft: 12,
  },
  errorMessage: {
    fontSize: 13,
    fontWeight: '500',
  },
  primaryButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginTop: 2,
  },
  toggleAuth: {
    marginTop: 8,
    alignItems: 'center',
    padding: 8,
  },
  toggleText: {
    fontSize: 14,
  },
});