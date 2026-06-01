import React, { createContext, useState, useContext, useCallback } from 'react';
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
        localStorage.removeItem('username');
        return null;
    });

    const [username, setUsername] = useState(() => localStorage.getItem('username') || '');

    const login = useCallback(async (uname, password) => {
        const formData = new FormData();
        formData.append('username', uname);
        formData.append('password', password);
        const res = await authApi.login(formData);
        const newToken = res.data.access_token;
        localStorage.setItem('token', newToken);
        localStorage.setItem('username', uname);
        setToken(newToken);
        setUsername(uname);
        return res.data;
    }, []);

    const register = useCallback(async (userData) => {
        const res = await authApi.register(userData);
        return res.data;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setToken(null);
        setUsername('');
    }, []);

    return (
        <AuthContext.Provider value={{ token, username, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
