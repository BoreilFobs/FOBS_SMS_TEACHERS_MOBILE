// utils/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import { Alert, Platform } from 'react-native';
import useUserStore from '@/utils/stores/userStore';


// const API_URL = 'http://192.168.100.169:8000/api'; // Replace with your backend URL
const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

/**
 * Handles user logout by:
 * 1. Calling backend logout endpoint
 * 2. Clearing local storage
 * 3. Redirecting to login screen
 */
export const handleLogout = () => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (confirmed) {
      performLogout();
    }
  } else {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Logout',
          style: 'destructive',
          onPress: () => performLogout(),
        },
      ],
      { cancelable: true }
    );
  }
};

const performLogout = async () => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    await useUserStore.getState().clearUserData();
    await AsyncStorage.multiRemove(['user_data', 'user_id', 'user', 'teacher']);
    await AsyncStorage.removeItem('auth_token');
    if (Platform.OS === 'web') {
      window.location.href = '/auth/';
    } else {
      router.push('/auth/');
    }
  } catch (error) {
    console.error('Logout failed:', error);

    if (Platform.OS === 'web') {
      alert('There was a problem logging out. Please try again.');
    } else {
      Alert.alert('Logout Error', 'There was a problem logging out. Please try again.', [
        { text: 'OK' },
      ]);
    }
  }
};
