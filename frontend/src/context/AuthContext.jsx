import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            // In a real app, we might fetch the user profile here to verify the token
            // For now, we'll just assume token exists = user logged in
            // setUser({ token }); 
        } else {
            localStorage.removeItem('token');
            setUser(null);
        }
        setLoading(false);
    }, [token]);

    const login = async (username, password) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const res = await authApi.login(formData);
        setToken(res.data.access_token);
        return res.data;
    };

    const register = async (userData) => {
        const res = await authApi.register(userData);
        return res.data;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
