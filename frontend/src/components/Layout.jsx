import React from 'react';
import { LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
    const { logout, username } = useAuth();
    const initials = username ? username.slice(0, 2).toUpperCase() : 'U';

    return (
        <div className="app-shell">
            <Sidebar />
            <div className="main-area">
                <header className="topbar">
                    <div className="topbar-user">
                        <div className="topbar-avatar">{initials}</div>
                        <span>{username || 'User'}</span>
                    </div>
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={logout}
                        title="Sign out"
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
