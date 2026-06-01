import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, Building } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword]  = useState('');
    const [error, setError]         = useState('');
    const [loading, setLoading]     = useState(false);
    const { login } = useAuth();
    const navigate  = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon">
                        <Building size={24} />
                    </div>
                    <div>
                        <h1>Welcome back</h1>
                        <p>Sign in to manage your properties</p>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form className="form-stack" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <div className="input-icon-wrap">
                            <User size={15} className="input-icon" />
                            <input
                                type="text"
                                required
                                className="form-input"
                                placeholder="your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="flex-center" style={{ justifyContent: 'space-between' }}>
                            <label className="form-label">Password</label>
                            <Link to="/forgot-password" className="fs-xs text-accent" style={{ textDecoration: 'none', fontWeight: 500 }}>
                                Forgot password?
                            </Link>
                        </div>
                        <div className="input-icon-wrap">
                            <Lock size={15} className="input-icon" />
                            <input
                                type="password"
                                required
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 4 }}>
                        {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account?{' '}
                    <Link to="/register">Create account</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
