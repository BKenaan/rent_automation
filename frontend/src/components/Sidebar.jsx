import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Building2,
    FileText,
    CreditCard,
    Receipt,
} from 'lucide-react';
import Logo from './Logo';

const nav = [
    { icon: LayoutDashboard, label: 'Dashboard',  path: '/dashboard' },
    { icon: Users,           label: 'Tenants',    path: '/tenants' },
    { icon: Building2,       label: 'Units',      path: '/units' },
    { icon: FileText,        label: 'Leases',     path: '/leases' },
    { icon: CreditCard,      label: 'Payments',   path: '/payments' },
    { icon: Receipt,         label: 'Expenses',   path: '/expenses' },
];

const Sidebar = () => (
    <aside className="sidebar">
        <div className="sidebar-logo">
            <Logo size={30} showName nameSize="1rem" />
        </div>

        <span className="sidebar-section-label">Navigation</span>

        <nav className="sidebar-nav">
            {nav.map(({ icon: Icon, label, path }) => (
                <NavLink
                    key={path}
                    to={path}
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
