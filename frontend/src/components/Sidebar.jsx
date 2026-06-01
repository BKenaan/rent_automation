import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Building2,
    FileText,
    CreditCard,
    Receipt,
    Building,
} from 'lucide-react';

const nav = [
    { icon: LayoutDashboard, label: 'Dashboard',  path: '/' },
    { icon: Users,           label: 'Tenants',    path: '/tenants' },
    { icon: Building2,       label: 'Units',      path: '/units' },
    { icon: FileText,        label: 'Leases',     path: '/leases' },
    { icon: CreditCard,      label: 'Payments',   path: '/payments' },
    { icon: Receipt,         label: 'Expenses',   path: '/expenses' },
];

const Sidebar = () => (
    <aside className="sidebar">
        <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
                <Building size={18} color="white" />
            </div>
            <span className="sidebar-logo-name">RentFlow</span>
        </div>

        <span className="sidebar-section-label">Menu</span>

        <nav className="sidebar-nav">
            {nav.map(({ icon: Icon, label, path }) => (
                <NavLink
                    key={path}
                    to={path}
                    end={path === '/'}
                    className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                >
                    <Icon size={17} />
                    <span>{label}</span>
                </NavLink>
            ))}
        </nav>
    </aside>
);

export default Sidebar;
