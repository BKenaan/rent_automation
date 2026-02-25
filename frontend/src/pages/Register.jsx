import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Mail, AlertCircle, ShieldCheck } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        full_name: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register, login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await register({
                username: formData.username,
                email: formData.email,
                full_name: formData.full_name,
                password: formData.password
            });
            // Auto-login after registration
            await login(formData.username, formData.password);
            navigate('/');
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

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
                        <ShieldCheck size={32} />
                    </div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Create Account</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Get started with property automation.</p>
                </div>

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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Username</label>
                            <input
                                name="username"
                                type="text"
                                required
                                className="glass"
                                style={{ padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--panel-border)', color: 'white' }}
                                value={formData.username}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Full Name</label>
                            <input
                                name="full_name"
                                type="text"
                                required
                                className="glass"
                                style={{ padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--panel-border)', color: 'white' }}
                                value={formData.full_name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="glass"
                            style={{ padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--panel-border)', color: 'white' }}
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="glass"
                            style={{ padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--panel-border)', color: 'white' }}
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Confirm Password</label>
                        <input
                            name="confirmPassword"
                            type="password"
                            required
                            className="glass"
                            style={{ padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--panel-border)', color: 'white' }}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{
                            marginTop: '1rem',
                            height: '48px',
                            justifyContent: 'center',
                            fontSize: '1rem'
                        }}
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}>
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
