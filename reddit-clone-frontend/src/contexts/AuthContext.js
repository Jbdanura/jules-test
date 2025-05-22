import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/api'; // Import API functions

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // To track initial auth status check

  useEffect(() => {
    // Check for token and user data in localStorage on initial load
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        // No /auth/me, so we assume token is valid if present
        // For future: verify token with backend here
      } catch (e) {
        // Clear invalid stored data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await apiLogin(credentials); // Call API service login
      const { token, user: userData } = response.data; // Assuming API returns { token, user }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return response; // Return response for component to handle navigation etc.
    } catch (error) {
      console.error("AuthContext login error:", error);
      throw error; // Re-throw for component to handle
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiRegister(userData); // Call API service register
      // Optionally handle auto-login here or let the component redirect to login
      return response; // Return response for component to handle
    } catch (error) {
      console.error("AuthContext register error:", error);
      throw error; // Re-throw for component to handle
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Navigation to login/home will be handled by components or ProtectedRoute
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
