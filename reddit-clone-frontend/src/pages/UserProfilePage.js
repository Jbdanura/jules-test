import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPostsByAuthorId, deletePost as apiDeletePost } from '../services/api'; // Added deletePost
import Vote from '../components/Vote';

const UserProfilePage = () => {
  const { user: loggedInUser, isAuthenticated } = useAuth();
  const { userId: routeUserId } = useParams();

  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [errorPosts, setErrorPosts] = useState(null);
  const [actionError, setActionError] = useState(null); // For delete errors

  // Determine which user's profile to display (currently, only logged-in user)
  // In future, if backend supports fetching other user's profiles, this logic would change.
  const displayUser = loggedInUser; 

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!displayUser || !(displayUser._id || displayUser.id)) { // Check for id or _id
        setUserPosts([]);
        return;
      }

      setLoadingPosts(true);
      setErrorPosts(null);
      try {
        const userId = displayUser._id || displayUser.id; // Get the user ID
        const response = await getPostsByAuthorId(userId); // Use new API call
        setUserPosts(response.data); 
      } catch (err) {
        console.error("Error fetching user posts:", err); // Updated console error message
        setErrorPosts(err.response?.data?.message || err.message || 'Failed to fetch posts.');
      } finally {
        setLoadingPosts(false);
      }
    };

    if (isAuthenticated && displayUser) {
      fetchUserPosts();
    } else {
      // If not authenticated or no displayUser, clear posts
      setUserPosts([]);
    }
  }, [isAuthenticated, displayUser]);

  if (!isAuthenticated || !displayUser) {
    // This page is protected, so AuthContext and ProtectedRoute should handle redirection.
    // However, as a fallback or if directly navigated to:
    return <p>Please log in to view your profile.</p>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleDeletePost = async (postIdToDelete) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        setActionError(null);
        await apiDeletePost(postIdToDelete);
        setUserPosts(prevPosts => prevPosts.filter(p => (p._id || p.id) !== postIdToDelete));
      } catch (err) {
        console.error("Delete post error on user profile:", err);
        setActionError(err.response?.data?.message || err.message || "Failed to delete post.");
        setTimeout(() => setActionError(null), 3000);
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <section style={{ marginBottom: '30px' }}>
        <h2>Profile Information</h2>
        <p><strong>Username:</strong> {displayUser.username}</p>
        {/* Add join date if available in user object, e.g., displayUser.createdAt */}
        {displayUser.createdAt && <p><strong>Joined:</strong> {formatDate(displayUser.createdAt)}</p>}
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>My Posts</h2>
        {/* Removed the note about client-side filtering */}
        {loadingPosts && <p>Loading your posts...</p>}
        {errorPosts && <p style={{ color: 'red' }}>Error loading posts: {errorPosts}</p>}
        {!loadingPosts && !errorPosts && userPosts.length === 0 && (
          <p>You haven't created any posts yet.</p>
        )}
        {!loadingPosts && !errorPosts && userPosts.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {userPosts.map(post => (
              <li key={post._id || post.id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
                <h4><Link to={`/post/${post._id || post.id}`}>{post.title}</Link></h4>
                {post.community && (
                  <small>
                    In <Link to={`/community/${post.community._id || post.community.id}`}>{post.community.name}</Link>
                  </small>
                )}
                <Vote 
                  entityId={post._id || post.id} 
                  entityType="post" 
                  initialScore={post.score !== undefined ? post.score : (post.upvotes - post.downvotes) || 0} 
                />
                <small style={{ display: 'block', marginTop: '10px', color: '#888' }}>
                  Created on: {formatDate(post.createdAt)}
                </small>
                {/* Edit/Delete buttons - only show if this is the logged-in user's profile */}
                {isAuthenticated && loggedInUser && (loggedInUser._id === (post.author?._id || post.author?.id) || loggedInUser.id === (post.author?._id || post.author?.id)) && (
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <Link 
                      to={`/edit-post/${post._id || post.id}`} 
                      style={{ textDecoration: 'none', color: 'blue', padding: '5px 10px', border: '1px solid blue', borderRadius: '4px' }}
                    >
                      Edit
                    </Link>
                    <button 
                      onClick={() => handleDeletePost(post._id || post.id)}
                      style={{ color: 'red', padding: '5px 10px', border: '1px solid red', borderRadius: '4px', background: 'none', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {actionError && <p style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>{actionError}</p>}
      </section>

      <section>
        <h2>My Comments</h2>
        <p>
          <em>Displaying your comments is not yet supported. This feature requires backend updates.</em>
        </p>
        {/* Placeholder for user's comments - requires backend support */}
      </section>
    </div>
  );
};

export default UserProfilePage;
