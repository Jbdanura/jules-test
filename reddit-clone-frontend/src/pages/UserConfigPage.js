import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile as apiUpdateUserProfile, changePassword as apiChangePassword } from '../services/api'; // Added changePassword
import styles from './UserConfigPage.module.css';

const UserConfigPage = () => {
  const { user: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState(''); // For bio form errors
  const [successBio, setSuccessBio] = useState('');

  // State for password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser) { // Ensure authUser is available
          setError('User not authenticated. Please log in.');
          setLoading(false);
          // Optionally navigate to login, though ProtectedRoute should handle this.
          return;
      }
      try {
        setLoading(true);
        setError(''); // Clear previous errors
        const response = await getUserProfile(); // Fetches logged-in user's profile
        setCurrentUser(response.data);
        setBio(response.data.bio || '');
      } catch (err) {
        console.error("Fetch profile error:", err);
        setError(err.response?.data?.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [authUser]); // Re-fetch if authUser changes (e.g., login/logout)

  const handleBioSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessBio('');
    setError(''); // Clear general errors too

    // Basic validation (optional, backend should also validate)
    if (bio.length > 500) { // Example max length
        setFormError('Bio cannot exceed 500 characters.');
        return;
    }

    try {
      const response = await apiUpdateUserProfile({ bio });
      // Assuming backend returns the updated user object or at least the updated part
      if (response.data && response.data.user) {
        setBio(response.data.user.bio || '');
        setCurrentUser(prev => ({...prev, bio: response.data.user.bio })); // Update local currentUser state
      } else {
        // If response structure is different, adjust accordingly or refetch
        setBio(bio); // Keep current bio if response is not as expected
      }
      setSuccessBio('Bio updated successfully!');
      setTimeout(() => setSuccessBio(''), 3000); // Clear success message after 3 seconds
    } catch (err) {
      console.error("Update bio error:", err);
      setFormError(err.response?.data?.message || 'Failed to update bio.');
    }
  };

  if (loading) return <p>Loading profile...</p>;
  // Error state before currentUser is checked to show critical load failures
  if (error && !currentUser) return <p className={styles.errorMessage}>{error}</p>;
  // If still no currentUser after loading and no specific error, implies an issue
  if (!currentUser && !loading) return <p>Could not load user profile.</p>;

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setError(''); // Clear general page errors

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('All password fields are required.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    try {
      await apiChangePassword({ currentPassword, newPassword, confirmNewPassword });
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      console.error("Change password error:", err);
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    }
  };

  return (
    <div className={styles.configContainer}>
      <h2>User Configuration</h2>
      <p>Username: <strong>{currentUser?.username || authUser?.username}</strong></p>
      <p>Email: <strong>{currentUser?.email || authUser?.email}</strong></p>
      
      <section className={styles.configSection}>
        <h3>Edit Bio</h3>
        <form onSubmit={handleBioSubmit}>
          <textarea
            className={styles.bioTextarea}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows="4"
          />
          {formError && <p className={`${styles.errorMessage} ${styles.formSpecificError}`}>{formError}</p>}
          {successBio && <p className={styles.successMessage}>{successBio}</p>}
          {error && !formError && !successBio && <p className={`${styles.errorMessage} ${styles.pageError}`}>{error}</p>}
          <button type="submit" className={styles.submitButton}>Save Bio</button>
        </form>
      </section>

      <section className={styles.configSection}>
        <h3>Change Password</h3>
        <form onSubmit={handlePasswordSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="currentPassword">Current Password:</label>
            <input 
              type="password" 
              id="currentPassword" 
              className={styles.formControl} /* Assuming a general formControl style */
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              required 
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="newPassword">New Password:</label>
            <input 
              type="password" 
              id="newPassword" 
              className={styles.formControl}
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="confirmNewPassword">Confirm New Password:</label>
            <input 
              type="password" 
              id="confirmNewPassword" 
              className={styles.formControl}
              value={confirmNewPassword} 
              onChange={(e) => setConfirmNewPassword(e.target.value)} 
              required 
            />
          </div>
          {passwordError && <p className={`${styles.errorMessage} ${styles.formSpecificError}`}>{passwordError}</p>}
          {passwordSuccess && <p className={styles.successMessage}>{passwordSuccess}</p>}
          <button type="submit" className={styles.submitButton}>Change Password</button>
        </form>
      </section>
    </div>
  );
};

export default UserConfigPage;
