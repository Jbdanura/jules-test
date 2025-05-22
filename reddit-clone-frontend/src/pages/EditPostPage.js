import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPostById, updatePost as apiUpdatePost } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import styles from './EditPostPage.module.css'; // Create this CSS module

const EditPostPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [originalPost, setOriginalPost] = useState(null); // To store fetched post
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState(''); // For form-specific errors like empty title

  useEffect(() => {
    const fetchPost = async () => {
      if (!isAuthenticated) {
        navigate('/login'); // Should be handled by ProtectedRoute, but as a fallback
        return;
      }
      try {
        setLoading(true);
        setError('');
        const response = await getPostById(postId);
        const fetchedPost = response.data;

        // Client-side ownership check
        if (fetchedPost.author._id !== user._id && fetchedPost.author.id !== user.id) {
          setError('You are not authorized to edit this post.');
          setTimeout(() => navigate(`/post/${postId}`), 2000); // Redirect after showing message
          return;
        }

        setOriginalPost(fetchedPost);
        setTitle(fetchedPost.title);
        setContent(fetchedPost.content || ''); // Handle if content is null/undefined
      } catch (err) {
        console.error("Fetch post for edit error:", err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch post details.');
        if (err.response?.status === 404) {
          setTimeout(() => navigate('/'), 2000); // Redirect to home if post not found
        }
      } finally {
        setLoading(false);
      }
    };

    if (postId && user) { // Ensure user is available for ownership check
      fetchPost();
    } else if (!isAuthenticated && postId) { // If not authenticated but trying to access
        navigate('/login', { state: { from: `/edit-post/${postId}` } });
    }
  }, [postId, user, navigate, isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Post title cannot be empty.');
      return;
    }
    // Content can be empty if allowed by backend

    try {
      const postData = { title, content };
      await apiUpdatePost(postId, postData);
      navigate(`/post/${postId}`); // Navigate back to the post page on success
    } catch (err) {
      console.error("Update post error:", err);
      setError(err.response?.data?.message || err.message || 'Failed to update post.');
    }
  };

  if (loading) {
    return <p>Loading post for editing...</p>;
  }

  if (error) {
    return <p className={`error-message ${styles.pageError}`}>{error}</p>;
  }
  
  if (!originalPost) { // Should be covered by loading/error, but as a safeguard
    return <p>Post data not available.</p>;
  }

  return (
    <div className={`container ${styles.editPostContainer}`}>
      <div className={`card ${styles.editPostCard}`}>
        <h2 className={styles.pageTitle}>Edit Post</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="edit-title">Title:</label>
            <input
              type="text"
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={styles.formControl}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="edit-content">Content:</label>
            <textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="10"
              className={styles.formControl}
            />
          </div>
          {formError && <p className={`error-message ${styles.formErrorMessage}`}>{formError}</p>}
          {error && !formError && <p className={`error-message ${styles.formErrorMessage}`}>{error}</p>} {/* Show general error if not form-specific */}
          <button type="submit" className={styles.submitButton}>Update Post</button>
          <button type="button" onClick={() => navigate(`/post/${postId}`)} className={`${styles.submitButton} ${styles.cancelButton}`}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditPostPage;
