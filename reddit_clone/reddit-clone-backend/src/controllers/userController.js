const db = require('../models');
const User = db.User; // Assuming User model is accessed via db.User

exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id; // From authMiddleware
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'bio', 'createdAt', 'updatedAt'] // Specify attributes
        });
        if (!user) {
            // This case should ideally not happen if authMiddleware is working correctly
            // and req.user.id corresponds to an existing user.
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(user);
    } catch (error) {
        console.error("Get user profile error:", error);
        res.status(500).json({ message: 'Error fetching user profile', error: error.message });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const { bio } = req.body;
        const userId = req.user.id; // From authMiddleware

        const user = await User.findByPk(userId);
        if (!user) {
            // This case should ideally not happen if authMiddleware is working correctly
            return res.status(404).json({ message: 'User not found.' });
        }

        // Only update bio if it's provided in the request body
        // In the future, other fields could be added here (e.g., username, email if allowed)
        if (bio !== undefined) {
            user.bio = bio;
        }
        // else if (someOtherField !== undefined) { user.someOtherField = someOtherField; }

        await user.save();

        // Return updated user data (excluding password)
        const userResponse = {
            id: user.id,
            username: user.username,
            email: user.email, // Consider if email should be part of this response or if it's updated separately
            bio: user.bio,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.status(200).json({ message: 'Profile updated successfully!', user: userResponse });
    } catch (error) {
        console.error("Update user profile error:", error);
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};

const bcrypt = require('bcryptjs'); // Ensure bcryptjs is imported

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({ message: 'All password fields are required.' });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ message: 'New passwords do not match.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Verify current password using the synchronous model method or bcrypt.compareSync directly
        // User model has: User.prototype.validPassword = function(password) { return bcrypt.compareSync(password, this.password); };
        const isMatch = user.validPassword(currentPassword); // Use the model's method
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password.' });
        }

        // Manually hash the new password because the model hook is beforeCreate only
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        await user.save();

        res.status(200).json({ message: 'Password changed successfully.' });
    } catch (error) {
        console.error("Change password error:", error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ message: 'Error changing password', error: error.message });
    }
};
