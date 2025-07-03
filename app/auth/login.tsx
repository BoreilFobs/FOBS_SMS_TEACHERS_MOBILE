import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    ImageBackground, 
    Image,
    Platform,
    KeyboardAvoidingView,
    Animated,
    Easing,
    ScrollView,
    Alert
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { register, login, googleAuth } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(30));
    const { setUser } = useAuth();

    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: 'YOUR_GOOGLE_CLIENT_ID',
        iosClientId: 'YOUR_IOS_CLIENT_ID',
        androidClientId: 'YOUR_ANDROID_CLIENT_ID',
        webClientId: 'YOUR_WEB_CLIENT_ID',
        redirectUri: makeRedirectUri({
            native: `${makeRedirectUri()}/redirect`,
        }),
    });

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

        if (response?.type === 'success') {
            // Optionally handle Google response here if not using handleGoogleAuth
        }
    }, [response]);

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

    const handleSubmit = async () => {
        try {
            let response;
            if (isLogin) {
                response = await login({ email, password });
            } else {
                response = await register({ 
                    name, 
                    email, 
                    password, 
                    password_confirmation: password 
                });
            }
            await AsyncStorage.setItem('auth_token', response.data.access_token);
            setUser(response.data.user);
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.response?.data?.message || 'An error occurred',
                [{ text: 'OK' }]
            );
        }
    };

    const handleGoogleAuth = async () => {
        try {
            const result = await promptAsync();
            if (result.type === 'success') {
                const response = await googleAuth(result.authentication?.accessToken || '');
                await AsyncStorage.setItem('auth_token', response.data.access_token);
                setUser(response.data.user);
            }
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.response?.data?.message || 'An error occurred',
                [{ text: 'OK' }]
            );
        }
    };

    return (
        <ImageBackground 
            source={{uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }} 
            style={styles.container}
            blurRadius={2}
        >
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
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
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                            activeOpacity={0.8}
                            onPress={handleSubmit}
                        >
                            <Text style={styles.buttonText}>
                                {isLogin ? 'Sign In' : 'Sign Up'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        </View>

                        <TouchableOpacity 
                            style={[styles.googleButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={handleGoogleAuth}
                            activeOpacity={0.7}
                            disabled={!request}
                        >
                            <Image 
                                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }} 
                                style={styles.googleLogo}
                            />
                            <Text style={[styles.googleButtonText, { color: colors.text }]}>
                                Continue with Google
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={toggleAuthMode}
                            style={styles.toggleAuth}
                            activeOpacity={0.7}
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