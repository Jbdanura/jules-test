import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import CommunityList from '../components/CommunityList';
import { getAllPosts } from '../services/api';
import Vote from '../components/Vote';
import styles from './HomePage.module.css'; // Import CSS module for HomePage

const HomePage = () => {
  const { isAuthenticated } = useAuth(); // Get auth status
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [errorPosts, setErrorPosts] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoadingPosts(true);
        const response = await getAllPosts();
        setPosts(response.data);
        setErrorPosts(null);
      } catch (err) {
        setErrorPosts(err.message || 'Failed to fetch posts');
        console.error("Fetch posts error:", err);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className={styles.homePageLayout}>
      <main className={styles.mainContent}>
        <div className={`card ${styles.welcomeCard}`} style={{ marginBottom: '2rem', padding: '1.5rem' }}> {/* Welcome message card with specific style */}
          <h2>Welcome to RedditClone!</h2>
          <p>This is the homepage. Browse posts below or check out the communities on the right.</p>
          {isAuthenticated && (
            <div className={styles.createActionsContainer}>
              <Link to="/submit" className={styles.createButton}>Create Post</Link>
              <Link to="/create-community" className={styles.createButton}>Create Community</Link>
            </div>
          )}
        </div>
        
        <h3>All Posts</h3>
        {loadingPosts ? (
          <p>Loading posts...</p>
        ) : errorPosts ? (
          <p className="error-message">Error loading posts: {errorPosts}</p>
        ) : posts.length === 0 ? (
          <p>No posts found yet.</p>
        ) : (
          <div className={styles.postList}>
            {posts.map((post) => (
              <div key={post._id || post.id} className={`card ${styles.postItem}`}>
                <h4 className={styles.postTitle}>
                  <Link to={`/post/${post._id || post.id}`}>{post.title}</Link>
                </h4>
                <small className={styles.postMeta}>
                  {post.community ? (
                    <>
                      Posted in <Link to={`/community/${post.community._id || post.community.id}`}>{post.community.name}</Link>
                    </>
                  ) : (
                    "General" 
                  )}
                  {post.author ? ` by ${post.author.username}` : " by Anonymous"}
                  {/* Consider adding post timestamp here */}
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
      </main>
      
      <aside className={styles.sidebar}>
        <CommunityList /> {/* CommunityList itself might need styling updates later */}
      </aside>
    </div>
  );
};

export default HomePage;
