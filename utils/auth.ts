// utils/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import { Alert } from 'react-native';

// const API_URL = 'http://192.168.100.169:8000/api'; // Replace with your backend URL
const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

/**
 * Handles user logout by:
 * 1. Calling backend logout endpoint
 * 2. Clearing local storage
 * 3. Redirecting to login screen
 */
export const handleLogout = async () => {
  try {
    // 1. Get current token
    const token = await AsyncStorage.getItem('auth_token');
    
    if (token) {
      // 2. Call backend logout endpoint
      await axios.post(
        `${API_URL}/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }

    // 3. Clear local storage
    await AsyncStorage.multiRemove(['auth_token', 'user_data']);

    // 4. Redirect to login
    router.push('/auth/login');

  } catch (error) {
    console.error('Logout failed:', error);
    Alert.alert(
      'Logout Error',
      'There was a problem logging out. Please try again.',
      [{ text: 'OK', onPress: () => {} }]
    );
  }
};
