import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { votePost, voteComment } from '../services/api';
import styles from './Vote.module.css'; // Import CSS module

const Vote = ({ entityId, entityType, initialScore }) => {
  const [score, setScore] = useState(initialScore);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  // const navigate = useNavigate(); // Keep if login redirection is desired here

  const handleVote = async (voteType) => {
    if (!isAuthenticated) {
      setError('Please login to vote.');
      // Consider: navigate('/login', { state: { from: location } });
      return;
    }

    setError(null);

    let optimisticScore = score;
    if (voteType === 'upvote') {
      optimisticScore += 1;
    } else if (voteType === 'downvote') {
      optimisticScore -= 1;
    }
    setScore(optimisticScore);

    // Map frontend voteType to backend expected type
    let apiVoteType;
    if (voteType === 'upvote') {
      apiVoteType = 'like';
    } else if (voteType === 'downvote') {
      apiVoteType = 'dislike';
    } else {
      console.error('Unexpected voteType:', voteType);
      // Optionally revert optimistic update or setError
      setScore(initialScore); // Revert optimistic update
      setError('Invalid vote type specified.');
      return;
    }

    const voteData = { type: apiVoteType };

    try {
      let response;
      if (entityType === 'post') {
        response = await votePost(entityId, voteData);
      } else if (entityType === 'comment') {
        response = await voteComment(entityId, voteData);
      } else {
        throw new Error('Invalid entity type for voting.');
      }

      if (response && response.data) {
        let newScore;
        if (response.data.post) {
          newScore = (response.data.post.likeCount || 0) - (response.data.post.dislikeCount || 0);
          setScore(newScore);
        } else if (response.data.comment) {
          newScore = (response.data.comment.likeCount || 0) - (response.data.comment.dislikeCount || 0);
          setScore(newScore);
        }
        // If neither post nor comment is in response.data, the score is not updated from backend.
        // This might happen if the backend response structure is different than expected.
        // Consider adding a console warning here if necessary.
      }
    } catch (err) {
      setScore(initialScore);
      setError(err.response?.data?.message || err.message || 'Failed to cast vote.');
      console.error(`Vote error for ${entityType} ${entityId}:`, err);
    }
  };

  return (
    <div className={styles.voteContainer}>
      <button 
        onClick={() => handleVote('upvote')} 
        className={styles.voteButton} 
        aria-label="Upvote"
      >
        &#x25B2; {/* Up arrow */}
      </button>
      <span className={styles.score}>{score}</span>
      <button 
        onClick={() => handleVote('downvote')} 
        className={styles.voteButton} 
        aria-label="Downvote"
      >
        &#x25BC; {/* Down arrow */}
      </button>
      {error && <p className={`error-message ${styles.voteError}`}>{error}</p>}
    </div>
  );
};

export default Vote;
