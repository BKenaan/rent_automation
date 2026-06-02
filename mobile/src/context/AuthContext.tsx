import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api';

interface AuthState {
  token: string | null;
  username: string;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: object) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);

  // On mount — restore session from secure storage
  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync('token');
        const storedUser = await SecureStore.getItemAsync('username');
        if (stored && !isExpired(stored)) {
          setToken(stored);
          setUsername(storedUser ?? '');
        } else {
          await SecureStore.deleteItemAsync('token');
          await SecureStore.deleteItemAsync('username');
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (uname: string, password: string) => {
    const res = await authApi.login(uname, password);
    const newToken: string = res.data.access_token;
    await SecureStore.setItemAsync('token', newToken);
    await SecureStore.setItemAsync('username', uname);
    setToken(newToken);
    setUsername(uname);
  }, []);

  const register = useCallback(async (data: object) => {
    await authApi.register(data);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('username');
    setToken(null);
    setUsername('');
  }, []);

  return (
    <AuthContext.Provider value={{ token, username, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
