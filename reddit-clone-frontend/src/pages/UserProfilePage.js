import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllPosts } from '../services/api';
import Vote from '../components/Vote'; // Assuming Vote component can be reused

const UserProfilePage = () => {
  const { user: loggedInUser, isAuthenticated } = useAuth();
  const { userId: routeUserId } = useParams(); // userId from route, may not be used if only showing logged-in user

  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [errorPosts, setErrorPosts] = useState(null);

  // Determine which user's profile to display (currently, only logged-in user)
  // In future, if backend supports fetching other user's profiles, this logic would change.
  const displayUser = loggedInUser; 

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!displayUser || !displayUser._id) {
        // No user to fetch posts for, or user ID is missing
        setUserPosts([]);
        return;
      }

      setLoadingPosts(true);
      setErrorPosts(null);
      try {
        // WORKAROUND: Fetch all posts and filter client-side.
        // This is not efficient and should be replaced with a dedicated backend endpoint
        // (e.g., /api/users/:userId/posts or /api/posts?authorId=:userId)
        // if this feature is to be scaled.
        const response = await getAllPosts();
        const allPosts = response.data;
        
        const filteredPosts = allPosts.filter(post => 
          post.author && (post.author._id === displayUser._id || post.author.id === displayUser._id)
        );
        setUserPosts(filteredPosts);
      } catch (err) {
        console.error("Error fetching all posts for user profile:", err);
        setErrorPosts(err.message || 'Failed to fetch posts.');
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
        {/* Note about client-side filtering */}
        <p style={{ fontSize: '0.9em', color: 'gray' }}>
          <em>Note: Posts are currently filtered on the client-side. This may not show all posts if the total number of posts is very large. A dedicated backend feature is needed for optimal performance.</em>
        </p>
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
              </li>
            ))}
          </ul>
        )}
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
