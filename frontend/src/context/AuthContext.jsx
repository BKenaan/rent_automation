import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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
        return null;
    });
    const [loading, setLoading] = useState(false);

    const login = useCallback(async (username, password) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const res = await authApi.login(formData);
        const newToken = res.data.access_token;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        return res.data;
    }, []);

    const register = useCallback(async (userData) => {
        const res = await authApi.register(userData);
        return res.data;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
    }, []);

    return (
        <AuthContext.Provider value={{ token, login, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
