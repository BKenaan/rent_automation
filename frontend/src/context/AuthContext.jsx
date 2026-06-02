import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => {
        const stored = localStorage.getItem('token');
        if (stored && !isTokenExpired(stored)) return stored;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
    });

    // Cached profile so the name shows instantly on reload before /auth/me resolves
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')) || null; }
        catch { return null; }
    });

    // Fetch the real profile (full_name, username, email) whenever we have a token
    const refreshProfile = useCallback(async () => {
        try {
            const res = await authApi.me();
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
            return res.data;
        } catch {
            return null;
        }
    }, []);

    useEffect(() => {
        if (token) refreshProfile();
    }, [token, refreshProfile]);

    const login = useCallback(async (uname, password) => {
        const formData = new FormData();
        formData.append('username', uname);
        formData.append('password', password);
        const res = await authApi.login(formData);
        const newToken = res.data.access_token;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        await refreshProfile();
        return res.data;
    }, [refreshProfile]);

    const register = useCallback(async (userData) => {
        const res = await authApi.register(userData);
        return res.data;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    }, []);

    // Prefer full name, fall back to username, then a neutral default
    const displayName = user?.full_name?.trim() || user?.username || 'Account';

    return (
        <AuthContext.Provider value={{ token, user, displayName, login, logout, register, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
