import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const LAST_UPDATED = 'June 2, 2026';
const CONTACT_EMAIL = 'support@rentalman.online';

const Section = ({ title, children }) => (
    <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.01em' }}>
            {title}
        </h2>
        <div style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.75 }}>
            {children}
        </div>
    </section>
);

const Privacy = () => (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
        {/* Header */}
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

        {/* Body */}
        <main style={{ maxWidth: 820, margin: '0 auto', padding: '48px 24px 80px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
                Privacy Policy
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: 40 }}>
                Last updated: {LAST_UPDATED}
            </p>

            <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: 32 }}>
                RentalMan ("we", "us", "our") provides a property-management platform that helps landlords and
                property managers track tenants, units, leases, payments, and expenses. This policy explains what
                information we collect, how we use it, and the choices you have. It applies to our website,
                <strong> rentalman.online</strong>, and our iOS and Android applications (together, the "Service").
            </p>

            <Section title="1. Information We Collect">
                <p style={{ marginBottom: 12 }}><strong>Account information.</strong> When you create an account we collect your
                    full name, username, email address, and a securely hashed password. We never store your password in plain text.</p>
                <p style={{ marginBottom: 12 }}><strong>Information you enter.</strong> To use the Service you add records about your
                    properties and business — including units, tenant details (such as names, email addresses, and phone numbers),
                    lease terms, rent payment records, and operating expenses. You control this content.</p>
                <p><strong>Technical information.</strong> Our servers automatically record basic security and operational logs
                    (such as request timestamps and error events). We do not use third-party advertising or behavioural tracking,
                    and we do not embed analytics SDKs in the mobile app.</p>
            </Section>

            <Section title="2. How We Use Information">
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                    <li style={{ marginBottom: 8 }}>To provide, operate, and secure the Service and your account.</li>
                    <li style={{ marginBottom: 8 }}>To generate payment schedules, statements, and financial summaries you request.</li>
                    <li style={{ marginBottom: 8 }}>To send transactional emails, including password resets and automated rent reminders to the tenants you choose to notify.</li>
                    <li>To detect, prevent, and investigate abuse, fraud, or security incidents.</li>
                </ul>
            </Section>

            <Section title="3. Legal Basis & Your Responsibility for Tenant Data">
                <p>If you add information about other people (for example, your tenants), you are the controller of that
                    data and are responsible for having a lawful basis to provide it to us and for informing those individuals
                    as required by applicable law. We process that data solely on your behalf to deliver the Service.</p>
            </Section>

            <Section title="4. How We Share Information">
                <p style={{ marginBottom: 12 }}>We do <strong>not</strong> sell your personal information, and we do not share it for
                    advertising. We share information only with service providers that help us run the Service, under appropriate
                    safeguards:</p>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                    <li style={{ marginBottom: 8 }}><strong>Email delivery</strong> — outbound emails (password resets, rent reminders) are sent through a third-party SMTP email provider.</li>
                    <li style={{ marginBottom: 8 }}><strong>Hosting</strong> — the Service runs on Oracle Cloud Infrastructure.</li>
                    <li>We may disclose information if required by law or to protect the rights, safety, and security of our users and the Service.</li>
                </ul>
            </Section>

            <Section title="5. Data Security">
                <p>All traffic between your device and our servers is encrypted in transit using HTTPS/TLS. Passwords are
                    hashed with bcrypt. Access to your data is authenticated with signed tokens and scoped so that you can only
                    access records belonging to your own account. On mobile, your authentication token is stored in the device's
                    secure keystore (iOS Keychain / Android Keystore). No method of transmission or storage is completely secure,
                    but we work to protect your information using industry-standard practices.</p>
            </Section>

            <Section title="6. Data Retention & Deletion">
                <p style={{ marginBottom: 12 }}>We retain your information for as long as your account is active. You may request
                    deletion of your account and associated data at any time by emailing us at <a href={`mailto:${CONTACT_EMAIL}`}
                    style={{ color: 'var(--accent-hover)' }}>{CONTACT_EMAIL}</a>. We will delete or anonymise your personal data
                    within 30 days of a verified request, except where we are required to retain it to comply with legal obligations.</p>
                <p>You can also access, correct, or export your data — including downloading tenant statements as PDF — directly
                    within the app.</p>
            </Section>

            <Section title="7. Your Rights">
                <p>Depending on where you live, you may have rights to access, correct, delete, or restrict the processing of
                    your personal data, and to data portability. To exercise any of these rights, contact us at <a
                    href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--accent-hover)' }}>{CONTACT_EMAIL}</a>. You will not be
                    discriminated against for exercising your rights.</p>
            </Section>

            <Section title="8. Children's Privacy">
                <p>The Service is intended for business use by adults and is not directed to children under 16. We do not
                    knowingly collect personal information from children. If you believe a child has provided us information,
                    please contact us and we will delete it.</p>
            </Section>

            <Section title="9. International Users">
                <p>Your information may be processed and stored on servers located outside your country of residence. Where we
                    transfer data internationally, we take steps to ensure it remains protected in accordance with this policy.</p>
            </Section>

            <Section title="10. Changes to This Policy">
                <p>We may update this policy from time to time. When we do, we will revise the "Last updated" date above and,
                    where appropriate, notify you within the app. Your continued use of the Service after an update means you
                    accept the revised policy.</p>
            </Section>

            <Section title="11. Contact Us">
                <p>If you have any questions about this Privacy Policy or how we handle your data, contact us at:</p>
                <p style={{ marginTop: 8 }}>
                    <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--accent-hover)', fontWeight: 600 }}>{CONTACT_EMAIL}</a>
                </p>
            </Section>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, marginTop: 40 }}>
                <Link to="/" style={{ color: 'var(--text-3)', textDecoration: 'none', fontSize: '0.875rem' }}>
                    ← Back to RentalMan
                </Link>
            </div>
        </main>
    </div>
);

export default Privacy;
