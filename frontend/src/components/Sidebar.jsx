import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Home,
    FileText,
    CreditCard,
    TrendingDown,
    Settings,
    Bell
} from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Users, label: 'Tenants', path: '/tenants' },
        { icon: Home, label: 'Units', path: '/units' },
        { icon: FileText, label: 'Leases', path: '/leases' },
        { icon: CreditCard, label: 'Payments', path: '/payments' },
        { icon: TrendingDown, label: 'Expenses', path: '/expenses' },
    ];

    return (
        <aside className="sidebar glass">
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'var(--accent-color)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px var(--accent-glow)'
                }}>
                    <Home size={24} color="white" />
                </div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }} className="sidebar-text">RentFlow</h2>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `btn ${isActive ? 'btn-primary' : ''}`}
                        style={({ isActive }) => ({
                            justifyContent: 'flex-start',
                            background: isActive ? 'var(--accent-color)' : 'transparent',
                            color: isActive ? 'white' : 'var(--text-secondary)',
                            padding: '0.75rem 1rem',
                            textDecoration: 'none'
                        })}
                    >
                        <item.icon size={20} />
                        <span className="sidebar-text">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="btn" style={{ color: 'var(--text-secondary)', justifyContent: 'flex-start' }}>
                    <Bell size={20} />
                    <span className="sidebar-text">Notifications</span>
                </button>
                <button className="btn" style={{ color: 'var(--text-secondary)', justifyContent: 'flex-start' }}>
                    <Settings size={20} />
                    <span className="sidebar-text">Settings</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
