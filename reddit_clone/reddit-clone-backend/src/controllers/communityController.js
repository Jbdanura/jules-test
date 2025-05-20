const db = require('../models');
const Community = db.Community;
const User = db.User; // For eager loading creator info

// Create a new community
exports.createCommunity = async (req, res) => {
    try {
        const { name, description } = req.body;
        const userId = req.user.id; // From authMiddleware.protect

        if (!name) {
            return res.status(400).json({ message: 'Community name is required.' });
        }

        // Check if community name already exists
        const existingCommunity = await Community.findOne({ where: { name } });
        if (existingCommunity) {
            return res.status(400).json({ message: 'A community with this name already exists.' });
        }

        const community = await Community.create({
            name,
            description,
            userId
        });

        res.status(201).json({ message: 'Community created successfully!', community });

    } catch (error)
    {
        console.error("Create community error:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
             return res.status(400).json({ message: 'Community name is already taken.' });
        }
        res.status(500).json({ message: 'Error creating community', error: error.message });
    }
};

// Get all communities
exports.getAllCommunities = async (req, res) => {
    try {
        const communities = await Community.findAll({
            include: [{
                model: User,
                as: 'creator',
                attributes: ['id', 'username'] // Only include specific user attributes
            }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(communities);
    } catch (error) {
        console.error("Get all communities error:", error);
        res.status(500).json({ message: 'Error fetching communities', error: error.message });
    }
};

// Get a single community by ID (or name)
exports.getCommunityDetails = async (req, res) => {
    try {
        const { identifier } = req.params; // Can be ID or name
        let community;

        if (isNaN(parseInt(identifier))) { // Check if identifier is not a number (i.e., it's a name)
             community = await Community.findOne({
                where: { name: identifier },
                include: [{
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username']
                }
                // Later, include posts from this community
                ]
            });
        } else { // Identifier is an ID
             community = await Community.findByPk(identifier, {
                include: [{
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username']
                }
                // Later, include posts from this community
                ]
            });
        }


        if (!community) {
            return res.status(404).json({ message: 'Community not found.' });
        }
        res.status(200).json(community);
    } catch (error) {
        console.error("Get community details error:", error);
        res.status(500).json({ message: 'Error fetching community details', error: error.message });
    }
};
