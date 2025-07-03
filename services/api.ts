import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const register = async (data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}) => {
  return api.post('/register', data);
};

export const login = async (data: { email: string; password: string }) => {
  return api.post('/login', data);
};

export const logout = async () => {
  return api.post('/logout');
};

export const googleAuth = async (googleToken: string) => {
  return api.post('/auth/google', { google_token: googleToken });
};

export default api;