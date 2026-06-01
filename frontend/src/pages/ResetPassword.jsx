import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api';
import { Lock, AlertCircle, KeyRound, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [success, setSuccess]   = useState(false);
    const navigate = useNavigate();

    const handle = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
        if (!token) { setError('Invalid reset link. Please request a new one.'); return; }
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

    if (!token && !success) {
        return (
            <div className="auth-page">
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <KeyRound size={40} className="text-muted" style={{ margin: '0 auto 12px' }} />
                    <h1 style={{ marginBottom: 8 }}>Invalid reset link</h1>
                    <p className="text-2" style={{ marginBottom: 24 }}>This link is missing or invalid.</p>
                    <Link to="/forgot-password" className="btn btn-primary btn-lg" style={{ display: 'inline-flex' }}>
                        Request new link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon">
                        <KeyRound size={24} />
                    </div>
                    <div>
                        <h1>Set new password</h1>
                        <p>Enter your new password below</p>
                    </div>
                </div>

                {success ? (
                    <div className="alert alert-success">
                        <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>Password updated. Redirecting to sign in…</span>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="alert alert-error">
                                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                                <span>{error}</span>
                            </div>
                        )}
                        <form className="form-stack" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">New password</label>
                                <div className="input-icon-wrap">
                                    <Lock size={15} className="input-icon" />
                                    <input type="password" required minLength={8} className="form-input" placeholder="Min 8 chars, 1 uppercase, 1 digit" value={formData.password} onChange={handle('password')} autoComplete="new-password" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm new password</label>
                                <div className="input-icon-wrap">
                                    <Lock size={15} className="input-icon" />
                                    <input type="password" required minLength={8} className="form-input" placeholder="••••••••" value={formData.confirmPassword} onChange={handle('confirmPassword')} autoComplete="new-password" />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                                {loading ? 'Updating…' : 'Update password'}
                            </button>
                        </form>
                    </>
                )}

                <p className="auth-footer">
                    <Link to="/login">Back to sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default ResetPassword;
