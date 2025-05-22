import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCommunityById, getPostsByCommunity } from '../services/api';
import Vote from '../components/Vote';
import styles from './CommunityPage.module.css'; // Import CSS module

const CommunityPage = () => {
  const { communityId } = useParams();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [errorCommunity, setErrorCommunity] = useState(null);
  const [errorPosts, setErrorPosts] = useState(null);

  useEffect(() => {
    const fetchCommunityDetails = async () => {
      try {
        setLoadingCommunity(true);
        // The API function is getCommunityById, which takes an 'identifier'.
        // 'communityId' from params will be this identifier.
        const response = await getCommunityById(communityId);
        setCommunity(response.data);
        setErrorCommunity(null);
      } catch (err) {
        setErrorCommunity(err.message || 'Failed to fetch community details');
        console.error("Fetch community details error:", err);
      } finally {
        setLoadingCommunity(false);
      }
    };

    const fetchPostsForCommunity = async () => {
      try {
        setLoadingPosts(true);
        // The API function is getPostsByCommunity, which takes a 'communityIdentifier'.
        // 'communityId' from params will be this identifier.
        const response = await getPostsByCommunity(communityId);
        setPosts(response.data);
        setErrorPosts(null);
      } catch (err) {
        setErrorPosts(err.message || 'Failed to fetch posts for community');
        console.error("Fetch posts for community error:", err);
      } finally {
        setLoadingPosts(false);
      }
    };

    if (communityId) {
      fetchCommunityDetails();
      fetchPostsForCommunity();
    }
  }, [communityId]);

  if (loadingCommunity) {
    return <p>Loading community details...</p>;
  }

  if (errorCommunity) {
    return <p style={{ color: 'red' }}>Error loading community: {errorCommunity}</p>;
  }

  if (!community) {
    return <p>Community not found.</p>;
  }

  // Helper to format date (can be moved to utils if used in more places)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };
  
  return (
    <div className={styles.communityPage}>
      <div className={`card ${styles.communityHeaderCard}`}>
        <h2>{community.name}</h2>
        <p>{community.description || 'No description available.'}</p>
        {/* Add more community details if available, e.g., number of members, creation date */}
        <small>Created on: {formatDate(community.createdAt)}</small>
      </div>
      
      <h3 className={styles.postsHeading}>Posts in this Community</h3>
      {loadingPosts ? (
        <p>Loading posts...</p>
      ) : errorPosts ? (
        <p className="error-message">Error loading posts: {errorPosts}</p>
      ) : posts.length === 0 ? (
        <p>No posts found in this community yet.</p>
      ) : (
        <div className={styles.postList}>
          {posts.map((post) => (
            <div key={post._id || post.id} className={`card ${styles.postItem}`}>
              <h4 className={styles.postTitle}>
                <Link to={`/post/${post._id || post.id}`}>{post.title}</Link>
              </h4>
              <small className={styles.postMeta}>
                {post.author ? `Posted by ${post.author.username}` : "Posted by Anonymous"}
                {post.createdAt && ` on ${formatDate(post.createdAt)}`}
              </small>
              <div className={styles.postVote}>
                <Vote 
                  entityId={post._id || post.id} 
                  entityType="post" 
                  initialScore={post.score !== undefined ? post.score : (post.upvotes - post.downvotes) || 0} 
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
