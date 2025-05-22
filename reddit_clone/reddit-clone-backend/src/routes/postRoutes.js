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

// GET /api/posts/author/:userId - Get all posts by a specific author (public)
router.get('/author/:userId', postController.getPostsByAuthor);

// PUT /api/posts/:postId - Update a post (protected)
router.put('/:postId', protect, postController.updatePost);

// DELETE /api/posts/:postId - Delete a post (protected)
router.delete('/:postId', protect, postController.deletePost);

module.exports = router;
