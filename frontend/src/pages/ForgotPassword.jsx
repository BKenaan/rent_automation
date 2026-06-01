import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api';
import { Mail, AlertCircle, KeyRound, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail]     = useState('');
    const [error, setError]     = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent]       = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authApi.forgotPassword(email);
            setSent(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon">
                        <KeyRound size={24} />
                    </div>
                    <div>
                        <h1>Forgot password?</h1>
                        <p>We'll send a reset link to your email</p>
                    </div>
                </div>

                {sent ? (
                    <div className="alert alert-success">
                        <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>If that email is registered you'll receive a reset link. Check your inbox and spam folder.</span>
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
                                <label className="form-label">Email address</label>
                                <div className="input-icon-wrap">
                                    <Mail size={15} className="input-icon" />
                                    <input
                                        type="email"
                                        required
                                        className="form-input"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                                {loading ? 'Sending…' : 'Send reset link'}
                            </button>
                        </form>
                    </>
                )}

                <p className="auth-footer">
                    Remember your password? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
