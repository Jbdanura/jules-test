import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './assets/css/main.css';

// Import actual pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import CommunityPage from './pages/CommunityPage';
import PostPage from './pages/PostPage';
import CreatePostPage from './pages/CreatePostPage';
import UserProfilePage from './pages/UserProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import CreateCommunityPage from './pages/CreateCommunityPage';
import EditPostPage from './pages/EditPostPage'; // Import EditPostPage
// Removed placeholder LoginPage and RegisterPage
const DashboardPage = () => { const { user } = useAuth(); return <div>Dashboard - Welcome {user?.username}</div>; };

function App() {
  return (
    <Router>
      <Navbar />
      <div style={{ padding: '20px' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/community/:communityId" element={<CommunityPage />} />
          <Route path="/post/:postId" element={<PostPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/submit" element={<CreatePostPage />} />
            <Route path="/profile/:userId" element={<UserProfilePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/create-community" element={<CreateCommunityPage />} />
            <Route path="/edit-post/:postId" element={<EditPostPage />} /> {/* Added EditPostPage route */}
          </Route>
          
          {/* Not Found Route */}
          <Route path="*" element={<NotFoundPage />} />
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
