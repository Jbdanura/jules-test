const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { protect } = require('../middlewares/authMiddleware');

// POST /api/posts - Create a new post (protected)
router.post('/', protect, postController.createPost);

// GET /api/posts - Get all posts (public)
router.get('/', postController.getAllPosts);

// GET /api/posts/community/:communityIdentifier - Get posts for a specific community (public)
router.get('/community/:communityIdentifier', postController.getPostsByCommunity);

// GET /api/posts/:postId - Get a single post by ID (public)
router.get('/:postId', postController.getPostDetails);

module.exports = router;
