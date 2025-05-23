const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');

// POST /api/comments/post/:postId - Create a new comment on a post (protected)
router.post('/post/:postId', protect, commentController.createComment); // Changed route and controller method name

// GET /api/comments/post/:postId - Get all comments for a specific post (public)
router.get('/post/:postId', commentController.getCommentsByPost);

// GET /api/comments/user/:userId - Get all comments by a specific user (public)
router.get('/user/:userId', commentController.getCommentsByUserId);

// PUT /api/comments/:commentId - Update a comment (protected)
router.put('/:commentId', protect, commentController.updateComment);

// DELETE /api/comments/:commentId - Delete a comment (protected)
router.delete('/:commentId', protect, commentController.deleteComment);

module.exports = router;
