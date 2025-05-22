const db = require('../models');
const Comment = db.Comment;
const Post = db.Post;
const User = db.User;

// Create a new comment on a post
exports.createComment = async (req, res) => {
    try {
        const { content } = req.body;
        const { postId } = req.params; // postId from route parameters
        const userId = req.user.id; // From authMiddleware

        if (!content || content.trim() === "") { // Validate content
            return res.status(400).json({ message: 'Comment content cannot be empty.' });
        }

        // Verify post exists
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        const comment = await Comment.create({
            content,
            userId,
            postId
        });
        
        // Eager load author for the response
        const commentWithAuthor = await Comment.findByPk(comment.id, {
            include: [{ model: User, as: 'author', attributes: ['id', 'username'] }]
        });

        res.status(201).json({ message: 'Comment created successfully!', comment: commentWithAuthor });
    } catch (error) {
        console.error("Create comment error:", error); // Updated error log message
        res.status(500).json({ message: 'Error creating comment', error: error.message }); // Updated error response
    }
};

// Get all comments for a specific post
exports.getCommentsByPost = async (req, res) => {
    try {
        const { postId } = req.params;

        // Verify post exists
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found when fetching comments.' });
        }

        const comments = await Comment.findAll({
            where: { postId: postId },
            include: [
                { model: User, as: 'author', attributes: ['id', 'username'] }
            ],
            order: [['createdAt', 'ASC']] // Or 'DESC' depending on desired order
        });
        res.status(200).json(comments);
    } catch (error) {
        console.error("Get comments by post error:", error);
        res.status(500).json({ message: 'Error fetching comments for post', error: error.message });
    }
};

// Get all comments by a specific user, including the post details
exports.getCommentsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        // Optional: Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const comments = await Comment.findAll({
            where: { userId: userId },
            include: [
                {
                    model: User, // Author of the comment (the user themselves)
                    as: 'author',
                    attributes: ['id', 'username']
                },
                {
                    model: Post, // The post the comment was made on
                    as: 'post', // This alias must match the one defined in Comment.associate
                    attributes: ['id', 'title'] // Include post ID and title
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(comments);
    } catch (error) {
        console.error("Get comments by user ID error:", error);
        res.status(500).json({ message: 'Error fetching comments by user', error: error.message });
    }
};
