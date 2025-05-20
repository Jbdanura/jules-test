const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { protect } = require('../middlewares/authMiddleware'); // Auth middleware

// POST /api/communities - Create a new community (protected)
router.post('/', protect, communityController.createCommunity);

// GET /api/communities - Get all communities (public)
router.get('/', communityController.getAllCommunities);

// GET /api/communities/:identifier - Get a single community by ID or name (public)
// :identifier can be community ID or name
router.get('/:identifier', communityController.getCommunityDetails);

module.exports = router;
