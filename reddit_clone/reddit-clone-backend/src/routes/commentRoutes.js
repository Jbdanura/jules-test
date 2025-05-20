const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');

// POST /api/comments - Add a new comment to a post (protected)
router.post('/', protect, commentController.addComment);

// GET /api/comments/post/:postId - Get all comments for a specific post (public)
router.get('/post/:postId', commentController.getCommentsByPost);

module.exports = router;
