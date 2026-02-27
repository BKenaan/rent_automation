import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api';
import { Lock, AlertCircle, KeyRound, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (!token) {
            setError('Invalid reset link. Please request a new one from the forgot password page.');
            return;
        }
        setLoading(true);
        try {
            await authApi.resetPassword(token, formData.password);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to reset password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (!token && !success) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-color)',
                padding: '2rem 1rem'
            }}>
                <div className="glass" style={{
                    width: '100%',
                    maxWidth: '450px',
                    padding: '2.5rem',
                    borderRadius: '24px',
                    textAlign: 'center'
                }}>
                    <KeyRound size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                    <h1 style={{ marginBottom: '0.5rem' }}>Invalid reset link</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        This link is missing or invalid. Request a new password reset.
                    </p>
                    <Link to="/forgot-password" className="btn btn-primary" style={{ display: 'inline-flex' }}>
                        Forgot password
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-color)',
            padding: '2rem 1rem'
        }}>
            <div className="glass" style={{
                width: '100%',
                maxWidth: '450px',
                padding: '2.5rem',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2.5rem'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        background: 'var(--accent-glow)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        color: 'var(--accent-color)'
                    }}>
                        <KeyRound size={32} />
                    </div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Set new password</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Enter your new password below.
                    </p>
                </div>

                {success ? (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid var(--success-color)',
                        borderRadius: '12px',
                        color: 'var(--success-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.9rem'
                    }}>
                        <CheckCircle size={20} />
                        <span>Password updated. Redirecting you to sign in...</span>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid var(--error-color)',
                                borderRadius: '12px',
                                color: 'var(--error-color)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                fontSize: '0.9rem'
                            }}>
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>New password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        minLength={6}
                                        className="glass"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem 0.75rem 2.5rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--panel-border)',
                                            color: 'white',
                                            background: 'rgba(255, 255, 255, 0.05)'
                                        }}
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Confirm new password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        minLength={6}
                                        className="glass"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem 0.75rem 2.5rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--panel-border)',
                                            color: 'white',
                                            background: 'rgba(255, 255, 255, 0.05)'
                                        }}
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                                style={{
                                    marginTop: '0.5rem',
                                    height: '48px',
                                    justifyContent: 'center',
                                    fontSize: '1rem'
                                }}
                            >
                                {loading ? 'Updating...' : 'Update password'}
                            </button>
                        </form>
                    </>
                )}

                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <Link to="/login" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}>
                        Back to sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ResetPassword;
