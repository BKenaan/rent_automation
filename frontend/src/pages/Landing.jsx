import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard, Users, CreditCard, FileText,
    BarChart3, Shield, Zap, ChevronRight, Building2,
    CheckCircle, ArrowRight, Menu, X
} from 'lucide-react';
import Logo from '../components/Logo';

/* ─── Data ────────────────────────────────────────────────────────────────── */

const features = [
    {
        icon: Building2,
        title: 'Portfolio Management',
        description: 'Track every property, unit, and asset in one clean dashboard. Monitor investment performance and occupancy in real time.',
        color: '#8b5cf6',
    },
    {
        icon: Users,
        title: 'Tenant Management',
        description: 'Store tenant profiles, lease history, and communication logs. Know who lives where and when their lease expires.',
        color: '#3b82f6',
    },
    {
        icon: CreditCard,
        title: 'Payment Tracking',
        description: 'Record and monitor every rent payment. Get instant visibility into who has paid, who is pending, and who is overdue.',
        color: '#10b981',
    },
    {
        icon: FileText,
        title: 'Lease Management',
        description: 'Create and manage lease agreements with automatic payment schedule generation. Never lose track of an expiry date.',
        color: '#f59e0b',
    },
    {
        icon: BarChart3,
        title: 'Financial Reports',
        description: 'Generate tenant statements and PDF reports instantly. Understand your gross revenue, net income, and portfolio ROI.',
        color: '#ef4444',
    },
    {
        icon: Zap,
        title: 'Automated Reminders',
        description: 'Automatic email reminders sent to tenants before rent is due, on the due date, and when overdue — zero manual effort.',
        color: '#8b5cf6',
    },
];

const steps = [
    { n: '01', title: 'Add your properties', desc: 'Set up your units and portfolio in minutes. Track investment values and target yields.' },
    { n: '02', title: 'Onboard your tenants', desc: 'Create tenant profiles and lease agreements. Payment schedules are generated automatically.' },
    { n: '03', title: 'Track everything', desc: 'Record payments, generate statements, and get automated reminders — all from one dashboard.' },
];

const testimonials = [
    { quote: 'RentalMan completely replaced my spreadsheets. Everything I need is in one place.', name: 'Sarah K.', role: 'Portfolio Landlord, 12 units' },
    { quote: 'The automated reminders alone save me hours every month. My tenants love the transparency too.', name: 'James O.', role: 'Property Manager, 30 units' },
    { quote: 'Finally a tool that thinks like a landlord. Clean, fast, and actually useful.', name: 'Mia T.', role: 'Independent Landlord, 6 units' },
];

/* ─── Sub-components ──────────────────────────────────────────────────────── */

const NavBar = () => {
    const [open, setOpen] = useState(false);
    return (
        <header className="lp-nav">
            <div className="lp-container lp-nav-inner">
                <Link to="/" className="lp-nav-logo">
                    <Logo size={30} showName nameSize="1.05rem" />
                </Link>
                <nav className={`lp-nav-links ${open ? 'open' : ''}`}>
                    <a href="#features" onClick={() => setOpen(false)}>Features</a>
                    <a href="#how" onClick={() => setOpen(false)}>How it works</a>
                    <a href="#testimonials" onClick={() => setOpen(false)}>Reviews</a>
                    <Link to="/login" className="lp-btn-ghost" onClick={() => setOpen(false)}>Sign in</Link>
                    <Link to="/register" className="lp-btn-primary" onClick={() => setOpen(false)}>
                        Get started <ChevronRight size={15} />
                    </Link>
                </nav>
                <button className="lp-burger" onClick={() => setOpen(!open)} aria-label="Toggle menu">
                    {open ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>
        </header>
    );
};

const HeroSection = () => (
    <section className="lp-hero">
        {/* Background decoration */}
        <div className="lp-hero-glow lp-hero-glow-1" />
        <div className="lp-hero-glow lp-hero-glow-2" />
        <div className="lp-hero-grid" />

        <div className="lp-container lp-hero-inner">
            <div className="lp-hero-badge">
                <span className="lp-badge-dot" />
                Trusted by landlords worldwide
            </div>

            <h1 className="lp-hero-headline">
                Property management,<br />
                <span className="lp-gradient-text">finally simplified</span>
            </h1>

            <p className="lp-hero-sub">
                RentalMan gives landlords and property managers everything they need
                to manage tenants, track payments, and grow their portfolio —
                all in one modern platform.
            </p>

            <div className="lp-hero-actions">
                <Link to="/register" className="lp-btn-primary lp-btn-lg">
                    Start for free <ArrowRight size={17} />
                </Link>
                <a href="#features" className="lp-btn-ghost lp-btn-lg">
                    See features
                </a>
            </div>

            <div className="lp-hero-trust">
                {['No credit card required', 'Set up in minutes', 'Cancel anytime'].map(t => (
                    <span key={t} className="lp-trust-item">
                        <CheckCircle size={14} /> {t}
                    </span>
                ))}
            </div>

            {/* Dashboard preview mockup */}
            <div className="lp-mockup">
                <div className="lp-mockup-bar">
                    <span /><span /><span />
                </div>
                <div className="lp-mockup-body">
                    <div className="lp-mockup-sidebar">
                        <div className="lp-mockup-logo-row" />
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`lp-mockup-nav-item ${i === 0 ? 'active' : ''}`} />
                        ))}
                    </div>
                    <div className="lp-mockup-main">
                        <div className="lp-mockup-cards">
                            {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'].map((c, i) => (
                                <div key={i} className="lp-mockup-card">
                                    <div className="lp-mockup-card-label" />
                                    <div className="lp-mockup-card-value" style={{ background: c, opacity: 0.7 }} />
                                </div>
                            ))}
                        </div>
                        <div className="lp-mockup-table">
                            <div className="lp-mockup-table-header" />
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="lp-mockup-table-row">
                                    <div className="lp-mockup-cell lp-mockup-cell-wide" />
                                    <div className="lp-mockup-cell" />
                                    <div className="lp-mockup-cell lp-mockup-cell-badge"
                                        style={{ background: i === 1 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)', color: i === 1 ? '#ef4444' : '#22c55e' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const StatsBar = () => (
    <section className="lp-stats">
        <div className="lp-container lp-stats-inner">
            {[
                { value: '10,000+', label: 'Payments tracked' },
                { value: '2,500+', label: 'Tenants managed' },
                { value: '800+', label: 'Properties listed' },
                { value: '99.9%', label: 'Platform uptime' },
            ].map(s => (
                <div key={s.label} className="lp-stat">
                    <span className="lp-stat-value">{s.value}</span>
                    <span className="lp-stat-label">{s.label}</span>
                </div>
            ))}
        </div>
    </section>
);

const FeaturesSection = () => (
    <section className="lp-section" id="features">
        <div className="lp-container">
            <div className="lp-section-header">
                <div className="lp-section-badge">Features</div>
                <h2 className="lp-section-title">Everything you need to run your rental business</h2>
                <p className="lp-section-sub">
                    From individual landlords to professional property managers — RentalMan scales with you.
                </p>
            </div>
            <div className="lp-features-grid">
                {features.map(({ icon: Icon, title, description, color }) => (
                    <div key={title} className="lp-feature-card">
                        <div className="lp-feature-icon" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                            <Icon size={22} style={{ color }} />
                        </div>
                        <h3 className="lp-feature-title">{title}</h3>
                        <p className="lp-feature-desc">{description}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const HowItWorks = () => (
    <section className="lp-section lp-section-alt" id="how">
        <div className="lp-container">
            <div className="lp-section-header">
                <div className="lp-section-badge">How it works</div>
                <h2 className="lp-section-title">Up and running in minutes</h2>
                <p className="lp-section-sub">No complicated setup. No steep learning curve.</p>
            </div>
            <div className="lp-steps">
                {steps.map(({ n, title, desc }, i) => (
                    <div key={n} className="lp-step">
                        <div className="lp-step-number">{n}</div>
                        {i < steps.length - 1 && <div className="lp-step-connector" />}
                        <div className="lp-step-content">
                            <h3>{title}</h3>
                            <p>{desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const Testimonials = () => (
    <section className="lp-section" id="testimonials">
        <div className="lp-container">
            <div className="lp-section-header">
                <div className="lp-section-badge">Reviews</div>
                <h2 className="lp-section-title">Loved by landlords</h2>
            </div>
            <div className="lp-testimonials">
                {testimonials.map(({ quote, name, role }) => (
                    <div key={name} className="lp-testimonial">
                        <div className="lp-testimonial-stars">{'★★★★★'}</div>
                        <p className="lp-testimonial-quote">"{quote}"</p>
                        <div className="lp-testimonial-author">
                            <div className="lp-testimonial-avatar">{name.charAt(0)}</div>
                            <div>
                                <div className="lp-testimonial-name">{name}</div>
                                <div className="lp-testimonial-role">{role}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const CTASection = () => (
    <section className="lp-cta-section">
        <div className="lp-cta-glow" />
        <div className="lp-container lp-cta-inner">
            <Logo size={48} />
            <h2 className="lp-cta-title">Ready to modernise your rental business?</h2>
            <p className="lp-cta-sub">
                Join hundreds of landlords who manage smarter with RentalMan.
                Get started for free — no credit card required.
            </p>
            <Link to="/register" className="lp-btn-primary lp-btn-lg">
                Create free account <ArrowRight size={17} />
            </Link>
        </div>
    </section>
);

const Footer = () => (
    <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
            <div className="lp-footer-brand">
                <Logo size={28} showName nameSize="0.95rem" />
                <p>Property management, simplified.</p>
            </div>
            <div className="lp-footer-links">
                <div className="lp-footer-col">
                    <span className="lp-footer-col-title">Product</span>
                    <a href="#features">Features</a>
                    <a href="#how">How it works</a>
                    <a href="#testimonials">Reviews</a>
                </div>
                <div className="lp-footer-col">
                    <span className="lp-footer-col-title">Account</span>
                    <Link to="/login">Sign in</Link>
                    <Link to="/register">Create account</Link>
                    <Link to="/forgot-password">Forgot password</Link>
                </div>
            </div>
        </div>
        <div className="lp-footer-bottom">
            <div className="lp-container">
                <span>© {new Date().getFullYear()} RentalMan. All rights reserved.</span>
                <div className="lp-footer-bottom-links">
                    <a href="#">Privacy</a>
                    <a href="#">Terms</a>
                </div>
            </div>
        </div>
    </footer>
);

/* ─── Page ────────────────────────────────────────────────────────────────── */

const Landing = () => (
    <div className="lp-page">
        <NavBar />
        <HeroSection />
        <StatsBar />
        <FeaturesSection />
        <HowItWorks />
        <Testimonials />
        <CTASection />
        <Footer />
    </div>
);

export default Landing;
