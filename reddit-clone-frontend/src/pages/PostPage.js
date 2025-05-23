import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'; // Added useNavigate
import { getPostById, getCommentsByPostId, createComment as apiCreateComment, deletePost as apiDeletePost } from '../services/api'; // Added deletePost
import { useAuth } from '../contexts/AuthContext';
import CommentItem from '../components/CommentItem';
import Vote from '../components/Vote';
import styles from './PostPage.module.css'; // Import CSS module

const PostPage = () => {
  const { postId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const location = useLocation(); // For login redirect state
  const navigate = useNavigate(); // For navigation after delete
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingPost, setLoadingPost] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [errorPost, setErrorPost] = useState(null);
  const [errorComments, setErrorComments] = useState(null);
  const [newCommentText, setNewCommentText] = useState(''); // State for new comment text
  const [submittingComment, setSubmittingComment] = useState(false); // State for comment submission
  const [errorSubmitComment, setErrorSubmitComment] = useState(null); // State for comment submission error
  const [errorAction,setErrorAction] = useState("")

  const handleEditPost = () => {
    console.log('Edit post button clicked for post ID:', postId);
    alert('Edit post functionality is not yet implemented.');
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
      // Call apiCreateComment with postId as the first argument
      const response = await apiCreateComment(postId, { content: newCommentText });
      // Add new comment (from response.data.comment) to the top of the list
      if (response.data && response.data.comment) {
        setComments(prevComments => [response.data.comment, ...prevComments]);
      } else {
        // If the structure is different, log and consider refetching or handling error
        console.warn("New comment structure from API is not as expected:", response.data);
        // Optionally, refetch comments here as a fallback if optimistic update fails
        // fetchComments(); // Assuming fetchComments is the function name
      }
      setNewCommentText(''); // Clear textarea
    } catch (err) {
      setErrorSubmitComment(err.response?.data?.message || err.message || "Failed to submit comment.");
      console.error("Submit comment error:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        setErrorAction(null);
        await apiDeletePost(postId);
        navigate('/'); // Navigate to homepage after successful deletion
      } catch (err) {
        console.error("Delete post error:", err);
        setErrorAction(err.response?.data?.message || err.message || "Failed to delete post.");
      }
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
            {post.author && (
              <>
                {' | By: '}
                <Link to={`/profile/${post.author._id || post.author.id}`}>
                  {post.author.username}
                </Link>
              </>
            )}
          </span>
        </div>
        <p className={styles.postBody}>{post.content}</p>
        <div className={styles.postVote}>
          <Vote 
            entityId={post._id || post.id} 
            entityType="post" 
            initialScore={post.score || 0} 
          />
        </div>
        {isAuthenticated && user && post.author && (user._id === post.author._id || user.id === post.author.id) && (
          <div className={styles.postActions}>
            <Link to={`/edit-post/${post._id || post.id}`} className={styles.actionButton}>Edit</Link>
            <button onClick={handleDeletePost} className={`${styles.actionButton} ${styles.deleteButton}`}>Delete</button>
          </div>
        )}
        {errorAction && <p className={`error-message ${styles.actionGlobalError}`}>{errorAction}</p>}
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
