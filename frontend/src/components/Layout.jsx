import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    const { logout } = useAuth();

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <header style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    gap: '1rem'
                }}>
                    <div className="glass" style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(45deg, var(--accent-color), #ff4081)'
                        }}></div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Admin User</span>
                    </div>
                    <button
                        onClick={logout}
                        className="btn glass"
                        style={{
                            padding: '0.5rem',
                            borderRadius: '12px',
                            color: 'var(--error-color)',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </header>
                {children}
            </main>
        </div>
    );
};

export default Layout;
