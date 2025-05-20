const db = require('../models');
const Post = db.Post;
const User = db.User;
const Community = db.Community;

// Create a new post
exports.createPost = async (req, res) => {
    try {
        const { title, content, communityId } = req.body;
        const userId = req.user.id; // From authMiddleware

        if (!title || !communityId) {
            return res.status(400).json({ message: 'Title and communityId are required.' });
        }

        // Verify community exists
        const community = await Community.findByPk(communityId);
        if (!community) {
            return res.status(404).json({ message: 'Community not found.' });
        }

        const post = await Post.create({
            title,
            content,
            userId,
            communityId
        });
        // Eager load author and community for the response
        const postWithDetails = await Post.findByPk(post.id, {
             include: [
                { model: User, as: 'author', attributes: ['id', 'username'] },
                { model: Community, as: 'community', attributes: ['id', 'name'] }
            ]
        });

        res.status(201).json({ message: 'Post created successfully!', post: postWithDetails });
    } catch (error) {
        console.error("Create post error:", error);
        res.status(500).json({ message: 'Error creating post', error: error.message });
    }
};

// Get all posts (e.g., for homepage)
exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.findAll({
            include: [
                { model: User, as: 'author', attributes: ['id', 'username'] },
                { model: Community, as: 'community', attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(posts);
    } catch (error) {
        console.error("Get all posts error:", error);
        res.status(500).json({ message: 'Error fetching posts', error: error.message });
    }
};

// Get all posts for a specific community
exports.getPostsByCommunity = async (req, res) => {
    try {
        const { communityIdentifier } = req.params; // Can be community ID or name
        let community;

        if (isNaN(parseInt(communityIdentifier))) { // Community name
            community = await Community.findOne({ where: { name: communityIdentifier } });
        } else { // Community ID
            community = await Community.findByPk(communityIdentifier);
        }

        if (!community) {
            return res.status(404).json({ message: 'Community not found.' });
        }

        const posts = await Post.findAll({
            where: { communityId: community.id },
            include: [
                { model: User, as: 'author', attributes: ['id', 'username'] },
                { model: Community, as: 'community', attributes: ['id', 'name'] } // Optional, as it's implied
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(posts);
    } catch (error) {
        console.error("Get posts by community error:", error);
        res.status(500).json({ message: 'Error fetching posts for community', error: error.message });
    }
};

// Get a single post by ID
exports.getPostDetails = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await Post.findByPk(postId, {
            include: [
                { model: User, as: 'author', attributes: ['id', 'username'] },
                { model: Community, as: 'community', attributes: ['id', 'name'] }
                // Later, include comments associated with this post
            ]
        });

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }
        res.status(200).json(post);
    } catch (error) {
        console.error("Get post details error:", error);
        res.status(500).json({ message: 'Error fetching post details', error: error.message });
    }
};
