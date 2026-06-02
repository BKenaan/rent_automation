import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  displayName: string;
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUser(res.data);
      await SecureStore.setItemAsync('user', JSON.stringify(res.data));
    } catch {}
  }, []);

  // On mount — restore session from secure storage
  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync('token');
        const storedUser = await SecureStore.getItemAsync('user');
        if (stored && !isExpired(stored)) {
          setToken(stored);
          if (storedUser) setUser(JSON.parse(storedUser));
          refreshProfile();
        } else {
          await SecureStore.deleteItemAsync('token');
          await SecureStore.deleteItemAsync('user');
        }
      } catch {}
      setLoading(false);
    })();
  }, [refreshProfile]);

  const login = useCallback(async (uname: string, password: string) => {
    const res = await authApi.login(uname, password);
    const newToken: string = res.data.access_token;
    await SecureStore.setItemAsync('token', newToken);
    setToken(newToken);
    await refreshProfile();
  }, [refreshProfile]);

  const register = useCallback(async (data: object) => {
    await authApi.register(data);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    setToken(null);
    setUser(null);
  }, []);

  const displayName = user?.full_name?.trim() || user?.username || 'Account';

  return (
    <AuthContext.Provider value={{ token, user, displayName, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
