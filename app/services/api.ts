// services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://127.0.0.1:8000/api'; // Replace with your actual URL

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