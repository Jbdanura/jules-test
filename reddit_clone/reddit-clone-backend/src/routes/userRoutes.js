const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware'); // Assuming authMiddleware is in middlewares folder

// GET /api/users/profile - Get current user's profile
router.get('/profile', protect, userController.getUserProfile);

// PUT /api/users/profile - Update current user's profile (e.g., bio)
router.put('/profile', protect, userController.updateUserProfile);

// PUT /api/users/profile/change-password - Change current user's password
router.put('/profile/change-password', protect, userController.changePassword);

module.exports = router;
