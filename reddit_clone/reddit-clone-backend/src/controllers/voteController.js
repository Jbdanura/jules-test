const db = require('../models');
const Post = db.Post;
const Comment = db.Comment;
const PostLike = db.PostLike;
const CommentLike = db.CommentLike;
const sequelize = db.sequelize; // For transactions if needed

exports.votePost = async (req, res) => {
    const { postId } = req.params;
    const { type } = req.body; // 'like', 'dislike', or 'none'/'remove'
    const userId = req.user.id;

    console.log(`[votePost] Received request for postId: ${postId}. User ID: ${userId}. Request body:`, req.body);
    console.log(`[votePost] Validating vote type. Received type: '${type}' for postId: ${postId}`);
    if (!['like', 'dislike', 'none', 'remove'].includes(type)) {
        return res.status(400).json({ message: 'Invalid vote type.' });
    }

    try {
        const post = await Post.findByPk(postId);
        if (!post) return res.status(404).json({ message: 'Post not found.' });

        const existingVote = await PostLike.findOne({ where: { userId, postId } });

        await sequelize.transaction(async (t) => {
            if (existingVote) {
                if (type === 'none' || type === 'remove' || existingVote.type === type) {
                    await existingVote.destroy({ transaction: t });
                } else { // Change vote
                    await existingVote.update({ type }, { transaction: t });
                }
            } else if (type !== 'none' && type !== 'remove') {
                await PostLike.create({ userId, postId, type }, { transaction: t });
            }
            // Hooks on PostLike should update Post's likeCount/dislikeCount
        });
         // Fetch the updated post to return counts
        const updatedPost = await Post.findByPk(postId);
        res.status(200).json({ message: 'Vote recorded.', post: updatedPost });

    } catch (error) {
        console.error("Vote post error:", error);
        res.status(500).json({ message: 'Error voting on post.', errorMessage: error.message });
    }
};

exports.voteComment = async (req, res) => {
    const { commentId } = req.params;
    const { type } = req.body; // 'like', 'dislike', or 'none'/'remove'
    const userId = req.user.id;

    console.log(`[voteComment] Received request for commentId: ${commentId}. User ID: ${userId}. Request body:`, req.body);
    console.log(`[voteComment] Validating vote type. Received type: '${type}' for commentId: ${commentId}`);
    if (!['like', 'dislike', 'none', 'remove'].includes(type)) {
        return res.status(400).json({ message: 'Invalid vote type.' });
    }
    
    try {
        const comment = await Comment.findByPk(commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found.' });

        const existingVote = await CommentLike.findOne({ where: { userId, commentId } });
        
        await sequelize.transaction(async (t) => {
            if (existingVote) {
                if (type === 'none' || type === 'remove' || existingVote.type === type) {
                    await existingVote.destroy({ transaction: t });
                } else {
                    await existingVote.update({ type }, { transaction: t });
                }
            } else if (type !== 'none' && type !== 'remove') {
                await CommentLike.create({ userId, commentId, type }, { transaction: t });
            }
            // Hooks on CommentLike should update Comment's likeCount/dislikeCount
        });
        const updatedComment = await Comment.findByPk(commentId);
        res.status(200).json({ message: 'Vote recorded.', comment: updatedComment });

    } catch (error) {
        console.error("Vote comment error:", error);
    res.status(500).json({ message: 'Error voting on comment.', errorMessage: error.message });
    }
};
