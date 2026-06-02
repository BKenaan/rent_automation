import React from 'react';
import { LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

function getInitials(name) {
    if (!name) return 'RM';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

const Layout = ({ children }) => {
    const { logout, displayName } = useAuth();
    const initials = getInitials(displayName);

    return (
        <div className="app-shell">
            <Sidebar />
            <div className="main-area">
                <header className="topbar">
                    <div className="topbar-user">
                        <div className="topbar-avatar">{initials}</div>
                        <span>{displayName}</span>
                    </div>
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={logout}
                        title="Sign out of RentalMan"
                        style={{ color: 'var(--red)' }}
                    >
                        <LogOut size={17} />
                    </button>
                </header>
                <main className="page-body">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
