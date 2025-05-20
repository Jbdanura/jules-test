const db = require('../models');
const Comment = db.Comment;
const Post = db.Post;
const User = db.User;

// Add a comment to a post
exports.addComment = async (req, res) => {
    try {
        const { content, postId } = req.body;
        const userId = req.user.id; // From authMiddleware

        if (!content || !postId) {
            return res.status(400).json({ message: 'Content and postId are required.' });
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

        res.status(201).json({ message: 'Comment added successfully!', comment: commentWithAuthor });
    } catch (error) {
        console.error("Add comment error:", error);
        res.status(500).json({ message: 'Error adding comment', error: error.message });
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
