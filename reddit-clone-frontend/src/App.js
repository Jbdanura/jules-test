import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate, useLocation } from 'react-router-dom'; // Added useLocation
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './assets/css/main.css';

// Import actual pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const HomePage = () => <div>Home Page - Public</div>;
// Removed placeholder LoginPage and RegisterPage
const DashboardPage = () => { const { user } = useAuth(); return <div>Dashboard - Welcome {user?.username}</div>; };

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  return (
    <nav style={{ padding: '10px', borderBottom: '1px solid #ccc', marginBottom: '20px' }}>
      <Link to="/">Home</Link> | {' '}
      {isAuthenticated ? (
        <>
          <Link to="/dashboard">Dashboard</Link> | {' '}
          <span>Hi, {user?.username}</span> | <button onClick={logout}>Logout</button>
        </>
      ) : (
        <><Link to="/login">Login</Link> | <Link to="/register">Register</Link></>
      )}
    </nav>
  );
};

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation(); // Added useLocation

    if (loading) return <div>Loading auth status...</div>; // Updated loading message
    
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />; // Added state for redirection
    }
    return children;
};

function App() {
  return (
    <Router>
      <Navbar />
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

// Create a RootApp component that wraps App with AuthProvider
const RootApp = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default RootApp;
