const db = require('../models'); // Points to src/models/index.js
const User = db.User;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Input validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        
        // Check if user already exists
        const existingUserByEmail = await User.findOne({ where: { email } });
        if (existingUserByEmail) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }
        const existingUserByUsername = await User.findOne({ where: { username } });
        if (existingUserByUsername) {
            return res.status(400).json({ message: 'Username is already taken.' });
        }

        // Create user (password will be hashed by the model's hook)
        const user = await User.create({ username, email, password });

        res.status(201).json({ message: 'User registered successfully!', userId: user.id });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

// Login an existing user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: 'Authentication failed. User not found.' });
        }

        const isMatch = user.validPassword(password); // Using the instance method

        if (!isMatch) {
            return res.status(401).json({ message: 'Authentication failed. Wrong password.' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        res.status(200).json({
            message: 'Logged in successfully!',
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};
