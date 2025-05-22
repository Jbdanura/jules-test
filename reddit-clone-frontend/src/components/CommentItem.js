import React from 'react';
import Vote from './Vote';
import styles from './CommentItem.module.css'; // Import CSS module

const CommentItem = ({ comment, formatDate }) => {
  if (!comment) {
    return null;
  }

  const commentScore = comment.score !== undefined 
    ? comment.score 
    : (comment.upvotes - comment.downvotes) || 0;

  return (
    <li className={styles.commentItem}>
      <p className={styles.commentContent}>{comment.content}</p>
      <div className={styles.commentMeta}>
        <span className={styles.commentAuthorDate}>
          By: {comment.author ? comment.author.username : 'Anonymous'} | 
          On: {formatDate(comment.createdAt)}
        </span>
        <div className={styles.commentVote}>
          <Vote 
            entityId={comment._id || comment.id} 
            entityType="comment" 
            initialScore={commentScore} 
          />
        </div>
      </div>
    </li>
  );
};

export default CommentItem;
