import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const CONTACT_EMAIL = 'support@rentalman.online';

const Section = ({ title, children }) => (
    <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>{title}</h2>
        <div style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.75 }}>{children}</div>
    </section>
);

const DeleteAccount = () => (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
        <header style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(14px)',
            borderBottom: '1px solid var(--border)',
        }}>
            <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                    <Logo size={30} showName nameSize="1.05rem" />
                </Link>
                <Link to="/" style={{ color: 'var(--text-2)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                    ← Back to home
                </Link>
            </div>
        </header>

        <main style={{ maxWidth: 820, margin: '0 auto', padding: '48px 24px 80px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
                Delete Your Account
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: 40 }}>
                RentalMan — account &amp; data deletion
            </p>

            <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: 32 }}>
                You can request deletion of your RentalMan account and all associated data at any time.
                This page explains how to make the request and what is deleted.
            </p>

            <Section title="How to request deletion">
                <p style={{ marginBottom: 12 }}>
                    Send an email to{' '}
                    <a href={`mailto:${CONTACT_EMAIL}?subject=Delete%20my%20account`} style={{ color: 'var(--accent-hover)', fontWeight: 600 }}>
                        {CONTACT_EMAIL}
                    </a>{' '}
                    from the email address associated with your account, with the subject line
                    <strong> "Delete my account"</strong>.
                </p>
                <p>
                    To protect your data, we verify that the request comes from the account owner before
                    deleting anything. We will confirm by replying to your registered email address.
                </p>
            </Section>

            <Section title="What gets deleted">
                <p style={{ marginBottom: 12 }}>When your request is processed, we permanently delete:</p>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                    <li style={{ marginBottom: 6 }}>Your account profile (name, username, email, and password)</li>
                    <li style={{ marginBottom: 6 }}>All tenants, units, and leases you created</li>
                    <li style={{ marginBottom: 6 }}>All rent payment records and payment schedules</li>
                    <li style={{ marginBottom: 6 }}>All expense records and generated statements</li>
                    <li>Any notification history associated with your account</li>
                </ul>
            </Section>

            <Section title="Timeline">
                <p>
                    Your account and associated data are deleted within <strong>30 days</strong> of a verified
                    request. Once deleted, this data cannot be recovered.
                </p>
            </Section>

            <Section title="Data we may retain">
                <p>
                    We do not retain your personal data after deletion, except where we are legally required to
                    keep certain records (for example, to comply with tax or accounting obligations). Any such
                    records are kept only for the minimum period required by law and are not used for any other
                    purpose.
                </p>
            </Section>

            <Section title="Questions">
                <p>
                    If you have any questions about deleting your account or your data, contact us at{' '}
                    <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--accent-hover)', fontWeight: 600 }}>{CONTACT_EMAIL}</a>.
                </p>
            </Section>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, marginTop: 40, display: 'flex', gap: 20 }}>
                <Link to="/" style={{ color: 'var(--text-3)', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to RentalMan</Link>
                <Link to="/privacy" style={{ color: 'var(--text-3)', textDecoration: 'none', fontSize: '0.875rem' }}>Privacy Policy</Link>
            </div>
        </main>
    </div>
);

export default DeleteAccount;
