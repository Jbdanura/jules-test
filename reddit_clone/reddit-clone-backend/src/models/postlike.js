'use strict';
// const { // Original
//  Model
// } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PostLike extends sequelize.Sequelize.Model { // Changed to sequelize.Sequelize.Model
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      PostLike.belongsTo(models.User, { foreignKey: 'userId' }); // Added association
      PostLike.belongsTo(models.Post, { foreignKey: 'postId' }); // Added association
    }
  }
  PostLike.init({
    type: { // Modified type
      type: DataTypes.ENUM('like', 'dislike'),
      allowNull: false,
    },
    userId: { // Added userId to model definition
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { 
            model: 'Users',
            key: 'id'
        }
    },
    postId: { // Added postId to model definition
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Posts',
            key: 'id'
        }
    }
  }, {
    sequelize,
    modelName: 'PostLike',
  });

  // Hooks to update Post's likeCount and dislikeCount
  PostLike.afterSave(async (like, options) => {
    const post = await like.getPost(); // Assumes getPost method from association
    if (post) {
        const likes = await PostLike.count({ where: { postId: post.id, type: 'like' } });
        const dislikes = await PostLike.count({ where: { postId: post.id, type: 'dislike' } });
        await post.update({ likeCount: likes, dislikeCount: dislikes }, { transaction: options.transaction });
    }
  });

  PostLike.afterDestroy(async (like, options) => {
    // Ensure like.postId is available even if the instance is deleted.
    // If paranoid: true is used for PostLike, like.postId will be there.
    // If not, you might need to fetch it before destroy or pass it via options if possible.
    // For now, assuming like.postId is accessible or getPost() works with paranoid if needed.
    const postId = like.postId; 
    if (postId) { // Check if postId is available
        const post = await sequelize.models.Post.findByPk(postId, { transaction: options.transaction }); // Access Post model via sequelize.models
        if (post) {
            const likes = await PostLike.count({ where: { postId: postId, type: 'like' } });
            const dislikes = await PostLike.count({ where: { postId: postId, type: 'dislike' } });
            await post.update({ likeCount: likes, dislikeCount: dislikes }, { transaction: options.transaction });
        }
    }
  });

  return PostLike;
};