import React, { useState } from 'react'; // Import useState
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false); // Dropdown state

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

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
        <NavLink to="/" className={getNavLinkClass} end>Home</NavLink>
        {isAuthenticated ? (
          <>
            {/* Profile link is now in dropdown */}
            {/* <NavLink to={`/profile/${user._id || user.id}`} className={getNavLinkClass}>Profile</NavLink> */}
            
            <div className={styles.userMenuContainer}>
              <button onClick={toggleUserDropdown} className={styles.userMenuButton}>
                {user?.username ? user.username.charAt(0).toUpperCase() : 'User'}
              </button>
              {isUserDropdownOpen && (
                <div className={styles.userDropdown}>
                  {user && <NavLink to={`/profile/${user._id || user.id}`} className={styles.dropdownLink}>Profile</NavLink>}
                  <NavLink to="/submit" className={styles.dropdownLink}>Create Post</NavLink>
                  <NavLink to="/create-community" className={styles.dropdownLink}>Create Community</NavLink>
                  <button onClick={handleLogout} className={styles.dropdownButton}>Logout</button>
                </div>
              )}
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
