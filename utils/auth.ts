import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import useUserStore from '@/utils/stores/userStore';

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
          onPress: performLogout,
        },
      ],
      { cancelable: true }
    );
  }
};

/**
 * Signs out because the API rejected the token, not because the teacher asked.
 *
 * Same teardown as `handleLogout` but without the confirmation prompt — there is
 * nothing to confirm once the session is already invalid. Guarded so several
 * concurrent 401s (a screen firing three requests at once) cannot each trigger a
 * redirect.
 */
let sessionExpiryInFlight = false;

export const handleSessionExpired = async () => {
  if (sessionExpiryInFlight) return;
  sessionExpiryInFlight = true;

  try {
    await performLogout();
  } finally {
    // Released after the redirect so a later, genuinely new session can expire too.
    setTimeout(() => {
      sessionExpiryInFlight = false;
    }, 5000);
  }
};

const performLogout = async () => {
  try {
    // Clear AsyncStorage
    await AsyncStorage.multiRemove([
      'auth_token',
      'user_data',
      'user_id',
      'user',
      'teacher',
    ]);

    // Clear Zustand state
    useUserStore.getState().clearUserData();

    // Redirect
    if (Platform.OS === 'web') {
      // Full page reload to reset app state
      window.location.replace('/auth/');
    } else {
      router.push('/auth/');
    }
  } catch (error) {
    console.error('Logout failed:', error);

    if (Platform.OS === 'web') {
      alert('Logout failed. Please try again.');
    } else {
      Alert.alert('Logout Error', 'Logout failed. Please try again.', [{ text: 'OK' }]);
    }
  }
};
