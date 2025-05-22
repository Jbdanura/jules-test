import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost as apiCreatePost, getAllCommunities } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const CreatePostPage = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [communities, setCommunities] = useState([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoadingCommunities(true);
        const response = await getAllCommunities();
        setCommunities(response.data);
        if (response.data.length > 0) {
          // Optionally pre-select the first community
          // setCommunityId(response.data[0]._id || response.data[0].id);
        }
      } catch (err) {
        setError('Failed to load communities. Please try again later.');
        console.error("Fetch communities error:", err);
      } finally {
        setLoadingCommunities(false);
      }
    };

    fetchCommunities();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isAuthenticated) {
      setError('You must be logged in to create a post.');
      navigate('/login');
      return;
    }

    if (!title.trim()) {
      setError('Post title is required.');
      return;
    }
    if (!content.trim()) {
      setError('Post content is required.');
      return;
    }
    if (!communityId) {
      setError('Please select a community for your post.');
      return;
    }

    try {
      const postData = { title, content, community: communityId }; // API expects 'community' field with ID
      const response = await apiCreatePost(postData);
      setSuccess(`Post "${response.data.title}" created successfully!`);
      
      const newPostId = response.data._id || response.data.id;
      if (newPostId) {
        setTimeout(() => navigate(`/post/${newPostId}`), 1500);
      } else {
        // Fallback if ID is not in response, redirect to community page
        setTimeout(() => navigate(`/community/${communityId}`), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create post.');
      console.error("Create post error:", err);
    }
  };

  if (!isAuthenticated) {
    // This should ideally be handled by ProtectedRoute, but as a fallback:
    navigate('/login');
    return <p>Redirecting to login...</p>;
  }
  
  if (loadingCommunities) {
    return <p>Loading community list...</p>;
  }

  return (
    <div className="container" style={{ maxWidth: '700px' }}> {/* Centered container */}
      <div className="card" style={{ padding: '2rem' }}> {/* Card styling for the form */}
        <h2 style={{ textAlign: 'center', marginTop: 0, marginBottom: '1.5rem' }}>Create a New Post</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="post-title">Title:</label>
            <input
            type="text"
            id="post-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="post-community">Community:</label>
            <select 
              id="post-community" 
              value={communityId} 
              onChange={(e) => setCommunityId(e.target.value)} 
              required
            >
              <option value="">Select a Community</option>
              {communities.map(community => (
                <option key={community._id || community.id} value={community._id || community.id}>
                  {community.name}
                </option>
              ))}
            </select>
            {communities.length === 0 && !loadingCommunities && <p className="error-message mt-1">No communities available. You might need to create one first.</p>}
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="post-content">Content:</label>
            <textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="10"
              required
            />
          </div>
          {error && <p className="error-message" style={{ marginBottom: '1rem' }}>{error}</p>}
          {success && <p className="success-message" style={{ marginBottom: '1rem' }}>{success}</p>}
          <button type="submit" disabled={loadingCommunities || communities.length === 0} style={{ width: '100%' }}>Create Post</button>
        </form>
      </div>
    </div>
  );
};

export default CreatePostPage;
