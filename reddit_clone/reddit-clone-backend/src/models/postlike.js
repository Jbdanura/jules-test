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
      PostLike.belongsTo(models.User, { foreignKey: 'userId' });
      PostLike.belongsTo(models.Post, { 
        foreignKey: 'postId',
        onDelete: 'CASCADE' // Added onDelete: 'CASCADE'
      });
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
    console.log('PostLike.afterSave hook fired for like ID:', like.id, 'Type:', like.type, 'PostID:', like.postId, 'UserID:', like.userId);
    console.log('Options:', JSON.stringify(options, null, 2));
    try {
      const post = await like.getPost({ transaction: options.transaction }); // Pass transaction
      if (post) {
        console.log('Found post ID:', post.id, 'Current likeCount:', post.likeCount, 'dislikeCount:', post.dislikeCount);
        const likes = await PostLike.count({ where: { postId: post.id, type: 'like' }, transaction: options.transaction });
        const dislikes = await PostLike.count({ where: { postId: post.id, type: 'dislike' }, transaction: options.transaction });
        console.log('Calculated likes:', likes, 'dislikes:', dislikes, 'for post ID:', post.id);
        await post.update({ likeCount: likes, dislikeCount: dislikes }, { transaction: options.transaction });
        await post.reload({ transaction: options.transaction }); // Reload the post instance
        console.log('Successfully updated and reloaded post ID:', post.id, 'New counts like:', post.likeCount, 'dislike:', post.dislikeCount);
      } else {
        console.log('PostLike.afterSave: Post not found for like ID:', like.id, 'PostID from like object:', like.postId);
      }
    } catch (error) {
      console.error('Error in PostLike.afterSave hook for like ID:', like.id, error);
      throw error; // Add this line
    }
  });

  PostLike.afterDestroy(async (like, options) => {
    console.log('PostLike.afterDestroy hook fired for like ID:', like.id, 'Type:', like.type, 'PostID:', like.postId, 'UserID:', like.userId);
    console.log('Options:', JSON.stringify(options, null, 2));
    try {
      const postId = like.postId; // Get postId from the instance being destroyed
      if (postId) {
        // It's crucial that `transaction: options.transaction` is used here.
        // Also, Post model might need to be accessed via sequelize.models if not directly available
        const PostModel = sequelize.models.Post || db.Post; // Adjust if db is not defined here
        const post = await PostModel.findByPk(postId, { transaction: options.transaction });
        
        if (post) {
          console.log('Found post ID:', post.id, 'Current likeCount:', post.likeCount, 'dislikeCount:', post.dislikeCount, 'for destroyed like on PostID:', postId);
          const likes = await PostLike.count({ where: { postId: postId, type: 'like' }, transaction: options.transaction });
          const dislikes = await PostLike.count({ where: { postId: postId, type: 'dislike' }, transaction: options.transaction });
          console.log('Calculated likes:', likes, 'dislikes:', dislikes, 'for post ID:', postId, 'after destroy');
          await post.update({ likeCount: likes, dislikeCount: dislikes }, { transaction: options.transaction });
          await post.reload({ transaction: options.transaction }); // Reload the post instance
          console.log('Successfully updated and reloaded post ID:', post.id, 'after destroy. New counts like:', post.likeCount, 'dislike:', post.dislikeCount);
        } else {
          console.log('PostLike.afterDestroy: Post not found for PostID:', postId, '(from destroyed like ID:', like.id, ')');
        }
      } else {
        console.log('PostLike.afterDestroy: postId not found on destroyed like instance ID:', like.id);
      }
    } catch (error) {
      console.error('Error in PostLike.afterDestroy hook for like ID:', like.id, error);
      throw error; // Add this line
    }
  });

  return PostLike;
};