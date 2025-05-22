import React, { useState, useEffect } from 'react'; // Added useEffect
import { useNavigate, Link, useLocation } from 'react-router-dom';
// Removed direct api import, login will come from useAuth
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth(); // login from context
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Call login from AuthContext, which calls api.login and handles token/user storage
      await login({ email, password }); 
      // Successful login will trigger isAuthenticated change and useEffect for navigation
      // No need to navigate here explicitly if useEffect handles it.
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Check credentials.');
      console.error("Login error:", err.response?.data || err.message);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '500px' }}> {/* Centered container */}
      <div className="card" style={{ padding: '2rem' }}> {/* Card styling for the form */}
        <h2 style={{ textAlign: 'center', marginTop: 0, marginBottom: '1.5rem' }}>Login</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="error-message" style={{ marginBottom: '1rem' }}>{error}</p>}
          <button type="submit" style={{ width: '100%' }}>Login</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: 0 }}>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
