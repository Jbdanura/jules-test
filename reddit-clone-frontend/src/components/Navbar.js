import React from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom'; // Added NavLink
import { useAuth } from '../contexts/AuthContext';
import styles from './Navbar.module.css'; // Import CSS module

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper for NavLink active class
  const getNavLinkClass = ({ isActive }) => isActive ? `${styles.navLinks} ${styles.active}` : styles.navLinks;

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.navBrand}>RedditClone</Link>
      
      <div className={styles.navLinks}>
        <NavLink to="/" className={getNavLinkClass} end>Home</NavLink> {/* Use NavLink for active styling */}
        {isAuthenticated ? (
          <>
            <NavLink to="/submit" className={getNavLinkClass}>Create Post</NavLink>
            <NavLink to="/create-community" className={getNavLinkClass}>Create Community</NavLink>
            {user && <NavLink to={`/profile/${user._id || user.id}`} className={getNavLinkClass}>Profile</NavLink>}
            <div className={styles.userInfo}>
              <span>Hi, {user?.username}!</span>
              <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
            </div>
          </>
        ) : (
          <>
            <NavLink to="/login" className={getNavLinkClass}>Login</NavLink>
            <NavLink to="/register" className={getNavLinkClass}>Register</NavLink>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
