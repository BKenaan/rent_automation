import React, { useState } from 'react';
import { Mail, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Toggle = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        style={{
            width: 44, height: 26, borderRadius: 99, border: 'none', cursor: disabled ? 'default' : 'pointer',
            background: checked ? 'var(--accent)' : 'var(--surface-3)', position: 'relative',
            transition: 'background 0.15s', opacity: disabled ? 0.6 : 1, flexShrink: 0,
        }}
    >
        <span style={{
            position: 'absolute', top: 3, left: checked ? 21 : 3, width: 20, height: 20, borderRadius: '50%',
            background: '#fff', transition: 'left 0.15s',
        }} />
    </button>
);

const Row = ({ icon, title, subtitle, checked, onChange, disabled }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-hover)', flexShrink: 0 }}>
            {icon}
        </div>
        <div style={{ flex: 1 }}>
            <div className="fw-600">{title}</div>
            <div className="fs-sm text-muted">{subtitle}</div>
        </div>
        <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
);

const Settings = () => {
    const { user, displayName, updatePreferences } = useAuth();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const setPref = async (key, val) => {
        if (!user) return;
        setSaving(true); setError('');
        try {
            await updatePreferences({
                notify_email: key === 'notify_email' ? val : user.notify_email,
                notify_push:  key === 'notify_push'  ? val : user.notify_push,
            });
        } catch (e) {
            setError(e.response?.data?.detail || 'Could not save your preference.');
        } finally { setSaving(false); }
    };

    return (
        <div style={{ maxWidth: 640 }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage your account and notifications</p>
                </div>
            </div>

            <div className="card card-body" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div className="avatar" style={{ width: 48, height: 48, fontSize: '1rem' }}>
                        {(displayName || 'RM').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="fw-700" style={{ fontSize: '1.05rem' }}>{displayName}</div>
                        {user?.email && <div className="fs-sm text-muted">{user.email}</div>}
                    </div>
                </div>
            </div>

            <h3 style={{ marginBottom: 6 }}>Notifications</h3>
            <p className="fs-sm text-muted" style={{ marginBottom: 14 }}>
                Choose how RentalMan alerts you about overdue payments, upcoming rent, and expiring leases.
            </p>

            {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}

            <div className="card card-body">
                <Row
                    icon={<Mail size={18} />}
                    title="Email notifications"
                    subtitle="Daily summary by email"
                    checked={!!user?.notify_email}
                    onChange={(v) => setPref('notify_email', v)}
                    disabled={saving}
                />
                <div className="sep" />
                <Row
                    icon={<Bell size={18} />}
                    title="Push notifications"
                    subtitle="Alerts on the RentalMan mobile app"
                    checked={!!user?.notify_push}
                    onChange={(v) => setPref('notify_push', v)}
                    disabled={saving}
                />
            </div>
        </div>
    );
};

export default Settings;
