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

// Get all posts by a specific author
exports.getPostsByAuthor = async (req, res) => {
    try {
        const { userId } = req.params;

        // Optional: Check if user exists to provide a specific "User not found" message
        const user = await User.findByPk(userId);
        if (!user) {
            // Depending on desired behavior, could also return 200 with empty array
            // if "user not found" is not critical to distinguish from "user has no posts"
            return res.status(404).json({ message: 'User not found.' });
        }

        const posts = await Post.findAll({
            where: { userId: userId }, // Assumes foreign key in Post model is 'userId'
            include: [
                { 
                    model: User, 
                    as: 'author', // Should match alias defined in Post model associations
                    attributes: ['id', 'username'] 
                },
                { 
                    model: Community, 
                    as: 'community', // Should match alias defined in Post model associations
                    attributes: ['id', 'name'] 
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // If user exists but has no posts, it's not an error, return empty array.
        // The check `!posts || posts.length === 0` is fine,
        // or just directly return posts (which would be an empty array).
        res.status(200).json(posts);
    } catch (error) {
        console.error("Get posts by author error:", error);
        res.status(500).json({ message: 'Error fetching posts by author', error: error.message });
    }
};

// Update an existing post
exports.updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { title, content } = req.body;
        const userId = req.user.id;

        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        if (post.userId !== userId) {
            return res.status(403).json({ message: 'User not authorized to edit this post.' });
        }

        // Update fields if they are provided
        if (title !== undefined) post.title = title;
        if (content !== undefined) post.content = content;
        // Note: communityId is not allowed to be updated here as per common practice,
        // changing community would typically be a more complex operation or disallowed.

        await post.save();

        // Fetch the post again to include associations for the response
        const updatedPostWithDetails = await Post.findByPk(post.id, {
            include: [
                { model: User, as: 'author', attributes: ['id', 'username'] },
                { model: Community, as: 'community', attributes: ['id', 'name'] }
            ]
        });

        res.status(200).json({ message: 'Post updated successfully!', post: updatedPostWithDetails });
    } catch (error) {
        console.error("Update post error:", error);
        res.status(500).json({ message: 'Error updating post', error: error.message });
    }
};

// Delete a post
exports.deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        if (post.userId !== userId) {
            return res.status(403).json({ message: 'User not authorized to delete this post.' });
        }

        await post.destroy(); // This will delete the post.
                              // `onDelete: 'CASCADE'` in PostLike and Comment models will handle related deletions.

        res.status(200).json({ message: 'Post deleted successfully.' });
    } catch (error) {
        console.error("Delete post error:", error);
        res.status(500).json({ message: 'Error deleting post', error: error.message });
    }
};
