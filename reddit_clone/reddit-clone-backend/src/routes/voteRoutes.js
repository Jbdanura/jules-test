const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const { protect } = require('../middlewares/authMiddleware');

// POST /api/votes/post/:postId - Vote on a post
router.post('/post/:postId', protect, voteController.votePost);

// POST /api/votes/comment/:commentId - Vote on a comment
router.post('/comment/:commentId', protect, voteController.voteComment);

module.exports = router;
