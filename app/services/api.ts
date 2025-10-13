// services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get API URL from expo config with fallback
const API_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'https://fobssms.com/api';

// Log the API URL for debugging (will help verify environment variables are working)
console.log('API Base URL:', API_URL);
console.log('Expo Config Extra:', Constants.expoConfig?.extra);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Add response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);

export const login = async (credentials: { email: string; password: string }) => {
  try {
    const response = await api.post('/login', credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const register = async (userData: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}) => {
  try {
    const response = await api.post('/register', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const setAuthToken = async (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  await AsyncStorage.setItem('auth_token', token);
};

export const removeAuthToken = async () => {
  delete api.defaults.headers.common['Authorization'];
  await AsyncStorage.removeItem('auth_token');
};