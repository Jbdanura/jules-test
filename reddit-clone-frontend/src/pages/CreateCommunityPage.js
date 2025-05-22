import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCommunity as apiCreateCommunity } from '../services/api'; // Renamed to avoid conflict if a context fn was named createCommunity
import { useAuth } from '../contexts/AuthContext';

const CreateCommunityPage = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // To ensure user is still authenticated

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isAuthenticated) {
      setError('You must be logged in to create a community.');
      navigate('/login');
      return;
    }

    if (!name.trim()) {
      setError('Community name is required.');
      return;
    }

    try {
      const communityData = { name, description };
      const response = await apiCreateCommunity(communityData);
      setSuccess(`Community "${response.data.name}" created successfully!`);
      // Redirect to the new community's page, assuming response.data contains id or _id
      const communityId = response.data._id || response.data.id;
      if (communityId) {
        setTimeout(() => navigate(`/community/${communityId}`), 2000);
      } else {
        // Fallback if ID is not in response, though it should be
        setTimeout(() => navigate('/'), 2000); 
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create community.');
      console.error("Create community error:", err);
    }
  };

  return (
    <div>
      <h2>Create a New Community</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="community-name">Name:</label>
          <input
            type="text"
            id="community-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="community-description">Description (Optional):</label>
          <textarea
            id="community-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
        <button type="submit">Create Community</button>
      </form>
    </div>
  );
};

export default CreateCommunityPage;
