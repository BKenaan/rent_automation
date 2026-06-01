import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ShieldCheck } from 'lucide-react';

const validatePassword = (pwd) => {
    if (pwd.length < 8)        return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd))    return 'Password must contain at least one uppercase letter';
    if (!/\d/.test(pwd))       return 'Password must contain at least one digit';
    return null;
};

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', full_name: '', password: '', confirmPassword: '' });
    const [error, setError]   = useState('');
    const [loading, setLoading] = useState(false);
    const { register, login, logout } = useAuth();
    const navigate = useNavigate();

    const handle = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        const pwdErr = validatePassword(formData.password);
        if (pwdErr) { setError(pwdErr); return; }

        setLoading(true);
        try {
            logout();
            await register({ username: formData.username, email: formData.email, full_name: formData.full_name, password: formData.password });
            await login(formData.username, formData.password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card auth-card-wide">
                <div className="auth-header">
                    <div className="auth-icon">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h1>Create account</h1>
                        <p>Get started with property management</p>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form className="form-stack" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input type="text" required className="form-input" placeholder="johnsmith" value={formData.username} onChange={handle('username')} autoComplete="username" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input type="text" required className="form-input" placeholder="John Smith" value={formData.full_name} onChange={handle('full_name')} autoComplete="name" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input type="email" required className="form-input" placeholder="you@example.com" value={formData.email} onChange={handle('email')} autoComplete="email" />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input type="password" required className="form-input" placeholder="Min 8 chars, 1 uppercase, 1 digit" value={formData.password} onChange={handle('password')} autoComplete="new-password" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm password</label>
                            <input type="password" required className="form-input" placeholder="••••••••" value={formData.confirmPassword} onChange={handle('confirmPassword')} autoComplete="new-password" />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 4 }}>
                        {loading ? 'Creating account…' : 'Create account'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
