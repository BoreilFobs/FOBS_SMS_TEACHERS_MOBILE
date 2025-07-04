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
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';


// const API_URL = 'http://192.168.100.169:8000/api'; // Replace with your backend URL
const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
console.log(API_URL);


export default function login() {
    const router = useRouter();
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(30));
    const [isLoading, setIsLoading] = useState(false);

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

    const validateForm = () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return false;
        }
        
        if (!isLogin && !name) {
            Alert.alert('Error', 'Please enter your name');
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return false;
        }
        
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return false;
        }
        
        return true;
    };

   const handleAuth = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
        const endpoint = isLogin ? '/login' : '/register';
        const data = isLogin 
            ? { email, password }
            : { name, email, password, password_confirmation: password };

        const response = await axios.post(`${API_URL}${endpoint}`, data, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (response.data.token) {
            await AsyncStorage.setItem('auth_token', response.data.token);
            router.push('/(tabs)');
        } else {
            throw new Error('Authentication token missing in response');
        }
        
    } catch (error) {
        let errorMessage = 'Authentication failed. Please try again.';
        
        if (axios.isAxiosError(error)) {
            // Handle Axios errors (network errors, 4xx/5xx responses)
            if (error.response?.data) {
                const errorData = error.response.data as {
                    message?: string;
                    errors?: Record<string, string[]>;
                };
                
                if (errorData.errors) {
                    errorMessage = Object.entries(errorData.errors)
                        .map(([field, messages]) => 
                            `${field}: ${messages.join(', ')}`
                        )
                        .join('\n');
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } else if (error.response?.status === 401) {
                errorMessage = 'Invalid credentials';
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        Alert.alert('Error', errorMessage);
    } finally {
        setIsLoading(false);
    }
};

    return (
        <ImageBackground 
            source={{uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg'}} 
            style={styles.container}
            blurRadius={2}
        >
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View 
                        style={[
                            styles.authContainer,
                            { 
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                                backgroundColor: colors.card,
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={['transparent', colors.primary + '20']}
                            locations={[0, 1]}
                            style={styles.gradientBorder}
                        />
                        
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: colors.text }]}>
                                {isLogin ? 'Welcome Back' : 'Create Account'}
                            </Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                {isLogin ? 'Sign in to continue' : 'Join us to get started'}
                            </Text>
                        </View>

                        {!isLogin && (
                            <View style={styles.inputContainer}>
                                <Feather name="user" size={20} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Full Name"
                                    placeholderTextColor={colors.textSecondary}
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                    editable={!isLoading}
                                />
                            </View>
                        )}

                        <View style={styles.inputContainer}>
                            <Feather name="mail" size={20} color={colors.textSecondary} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Email"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Feather name="lock" size={20} color={colors.textSecondary} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Password"
                                placeholderTextColor={colors.textSecondary}
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                editable={!isLoading}
                            />
                        </View>

                        <TouchableOpacity 
                            style={[
                                styles.primaryButton, 
                                { 
                                    backgroundColor: colors.primary,
                                    opacity: isLoading ? 0.7 : 1
                                }
                            ]}
                            activeOpacity={0.8}
                            onPress={handleAuth}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {isLogin ? 'Sign In' : 'Sign Up'}
                                </Text>
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
                                    {isLogin ? 'Sign Up' : 'Sign In'}
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
    padding: 20,
  },
  authContainer: {
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
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
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleAuth: {
    marginTop: 8,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
  },
});