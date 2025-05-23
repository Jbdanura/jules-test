import React from 'react';
import { Link } from 'react-router-dom'; // Import Link
import Vote from './Vote';
import styles from './CommentItem.module.css'; // Import CSS module

const CommentItem = ({ comment, formatDate }) => {
  if (!comment) {
    return null;
  }

  return (
    <li className={styles.commentItem}>
      <p className={styles.commentContent}>{comment.content}</p>
      <div className={styles.commentMeta}>
        <span className={styles.commentAuthorDate}>
          By: {comment.author ? (
            <Link to={`/profile/${comment.author._id || comment.author.id}`}>
              {comment.author.username}
            </Link>
          ) : (
            'Anonymous'
          )} | 
          On: {formatDate(comment.createdAt)}
        </span>
        <div className={styles.commentVote}>
          <Vote 
            entityId={comment._id || comment.id} 
            entityType="comment" 
            initialScore={comment.score || 0} 
          />
        </div>
      </div>
    </li>
  );
};

export default CommentItem;
