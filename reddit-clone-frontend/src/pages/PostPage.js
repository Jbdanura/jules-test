import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom'; // Added useLocation
import { getPostById, getCommentsByPostId, createComment as apiCreateComment } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CommentItem from '../components/CommentItem';
import Vote from '../components/Vote';
import styles from './PostPage.module.css'; // Import CSS module

const PostPage = () => {
  const { postId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const location = useLocation(); // For login redirect state
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingPost, setLoadingPost] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [errorPost, setErrorPost] = useState(null);
  const [errorComments, setErrorComments] = useState(null);
  const [newCommentText, setNewCommentText] = useState(''); // State for new comment text
  const [submittingComment, setSubmittingComment] = useState(false); // State for comment submission
  const [errorSubmitComment, setErrorSubmitComment] = useState(null); // State for comment submission error

  const handleEditPost = () => {
    console.log('Edit post button clicked for post ID:', postId);
    alert('Edit post functionality is not yet implemented.');
  };

  const handleDeletePost = async () => { // Consider making it async if API call is added later
    console.log('Delete post button clicked for post ID:', postId);
    // Prompt for confirmation
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      console.log('User confirmed deletion for post ID:', postId);
      // Placeholder for actual deletion logic:
      // try {
      //   // Example: await apiDeletePost(postId);
      //   alert('Post successfully deleted.');
      //   // Redirect or update UI, e.g., navigate('/', { replace: true });
      // } catch (error) {
      //   console.error('Failed to delete post:', error);
      //   alert('Failed to delete post. See console for details.');
      // }
      alert('Post deletion functionality is not yet fully implemented. Confirmed deletion for now.');
    } else {
      console.log('User cancelled deletion for post ID:', postId);
    }
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        setLoadingPost(true);
        const postResponse = await getPostById(postId);
        setPost(postResponse.data);
        setErrorPost(null);

        // If post is fetched successfully, fetch comments
        if (postResponse.data) {
          setLoadingComments(true);
          try {
            const commentsResponse = await getCommentsByPostId(postId);
            setComments(commentsResponse.data);
            setErrorComments(null);
          } catch (commentsErr) {
            setErrorComments(commentsErr.message || `Failed to fetch comments for post ID ${postId}`);
            console.error("Fetch comments error:", commentsErr);
          } finally {
            setLoadingComments(false);
          }
        }
      } catch (err) {
        setErrorPost(err.message || `Failed to fetch post with ID ${postId}`);
        console.error("Fetch post details error:", err);
        if (err.response && err.response.status === 404) {
          setPost(null);
        }
      } finally {
        setLoadingPost(false);
      }
    };

    if (postId) {
      fetchPostAndComments();
    }
  }, [postId]); // Re-run if postId changes

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) {
      setErrorSubmitComment("Comment cannot be empty.");
      return;
    }
    if (!isAuthenticated) {
      setErrorSubmitComment("You must be logged in to comment.");
      return;
    }

    setSubmittingComment(true);
    setErrorSubmitComment(null);

    try {
      const commentData = { content: newCommentText, post: postId }; // API expects 'post' not 'postId'
      const response = await apiCreateComment(commentData);
      // Add new comment to the top of the list for immediate UI update
      // The backend should return the full comment object including author details populated
      setComments(prevComments => [response.data, ...prevComments]);
      setNewCommentText(''); // Clear textarea
    } catch (err) {
      setErrorSubmitComment(err.response?.data?.message || err.message || "Failed to submit comment.");
      console.error("Submit comment error:", err);
    } finally {
      setSubmittingComment(false);
    }
  };
  
  if (loadingPost) {
    return <p>Loading post details...</p>;
  }

  if (errorPost) {
    return <p style={{ color: 'red' }}>Error loading post: {errorPost}</p>;
  }

  if (!post) {
    return <p>Post not found.</p>;
  }

  return (
    <div className={styles.postPageContainer}>
      <div className={`card ${styles.postContentCard}`}>
        <h2 className={styles.postTitle}>{post.title}</h2>
        <div className={styles.postMeta}>
          <span>
            Posted on: {formatDate(post.createdAt)}
            {post.community && (
              <>
                {' | In: '} 
                <Link to={`/community/${post.community._id || post.community.id}`}>
                  {post.community.name}
                </Link>
              </>
            )}
            {post.author && ` | By: ${post.author.username}`}
          </span>
        </div>
        <p className={styles.postBody}>{post.content}</p>
        <div className={styles.postVote}>
          <Vote 
            entityId={post._id || post.id} 
            entityType="post" 
            initialScore={post.score !== undefined ? post.score : (post.upvotes - post.downvotes) || 0} 
          />
        </div>
        {isAuthenticated && user && post && post.author && (String(user.id) === String(post.author.id) || String(user.id) === String(post.author._id) || String(user._id) === String(post.author.id) || String(user._id) === String(post.author._id)) && (
          <div className={styles.postActions}> {/* Conditionally render actions */}
            <button onClick={handleEditPost} className={styles.actionButton}>Edit Post</button>
            <button onClick={handleDeletePost} className={styles.actionButton}>Delete Post</button>
          </div>
        )}
      </div>
      
      <div className={styles.commentsSection}>
        <h3 className={styles.commentsHeading}>Comments</h3>

        {isAuthenticated ? (
          <form onSubmit={handleCommentSubmit} className={`card ${styles.commentForm}`}>
            <label htmlFor="commentText" className="sr-only">Your Comment</label> {/* For accessibility */}
            <textarea
              id="commentText"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder={`Commenting as ${user?.username}...`}
              rows="4"
              required
            />
            {errorSubmitComment && <p className="error-message mt-1">{errorSubmitComment}</p>}
            <button type="submit" disabled={submittingComment} className="mt-2">
              {submittingComment ? 'Submitting...' : 'Post Comment'}
            </button>
          </form>
        ) : (
          <p className={styles.loginPrompt}>
            Please <Link to="/login" state={{ from: location }}>login</Link> to post a comment.
          </p>
        )}

        {loadingComments ? (
          <p>Loading comments...</p>
        ) : errorComments ? (
          <p className="error-message">Error loading comments: {errorComments}</p>
        ) : comments.length === 0 ? (
          <p>No comments yet. Be the first to comment!</p>
        ) : (
          <ul className={styles.commentsList}>
            {comments.map(comment => (
              <CommentItem key={comment._id || comment.id} comment={comment} formatDate={formatDate} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PostPage;
