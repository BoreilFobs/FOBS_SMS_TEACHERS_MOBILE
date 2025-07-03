import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';

type User = {
  id: number;
  name: string;
  email: string;
};

type AuthContextData = {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContext = createContext({} as any);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        try {
          api.defaults.headers.Authorization = `Bearer ${token}`;
          const response = await api.get('/user');
          setUser(response.data);
        } catch (error) {
          await AsyncStorage.removeItem('auth_token');
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);