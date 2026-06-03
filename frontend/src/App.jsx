import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Privacy from './pages/Privacy';
import DeleteAccount from './pages/DeleteAccount';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Units from './pages/Units';
import Payments from './pages/Payments';
import Leases from './pages/Leases';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <Layout><ErrorBoundary>{children}</ErrorBoundary></Layout>;
};

const PublicRoute = ({ children }) => {
  const { token } = useAuth();
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
};

const NotFound = () => (
  <div style={{ padding: '4rem', textAlign: 'center' }}>
    <h1 style={{ marginBottom: 12 }}>404 — Page Not Found</h1>
    <p style={{ color: 'var(--text-2)', marginBottom: 28 }}>The page you are looking for does not exist.</p>
    <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public landing */}
          <Route path="/" element={<Landing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/delete-account" element={<DeleteAccount />} />

          {/* Auth pages — redirect to dashboard if already logged in */}
          <Route path="/login"          element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register"       element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />

          {/* Protected app pages */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/tenants"   element={<ProtectedRoute><Tenants /></ProtectedRoute>} />
          <Route path="/units"     element={<ProtectedRoute><Units /></ProtectedRoute>} />
          <Route path="/leases"    element={<ProtectedRoute><Leases /></ProtectedRoute>} />
          <Route path="/payments"  element={<ProtectedRoute><Payments /></ProtectedRoute>} />
          <Route path="/expenses"  element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
