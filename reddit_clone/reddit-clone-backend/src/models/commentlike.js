'use strict';
// const { // Original
//  Model
// } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CommentLike extends sequelize.Sequelize.Model { // Changed to sequelize.Sequelize.Model
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      CommentLike.belongsTo(models.User, { foreignKey: 'userId' }); // Added association
      CommentLike.belongsTo(models.Comment, { foreignKey: 'commentId' }); // Added association
    }
  }
  CommentLike.init({
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
    commentId: { // Added commentId to model definition
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Comments',
            key: 'id'
        }
    }
  }, {
    sequelize,
    modelName: 'CommentLike',
  });

  // Hooks to update Comment's likeCount and dislikeCount
  CommentLike.afterSave(async (like, options) => {
    console.log('CommentLike.afterSave hook fired for like ID:', like.id, 'Type:', like.type, 'CommentID:', like.commentId, 'UserID:', like.userId);
    console.log(`Hook CommentLike afterSave called with transaction ID (if available): ${options && options.transaction && options.transaction.id}`);
    try {
      const comment = await like.getComment({ transaction: options.transaction }); // Pass transaction
      if (comment) {
        console.log('Found comment ID:', comment.id, 'Current likeCount:', comment.likeCount, 'dislikeCount:', comment.dislikeCount);
        const likes = await CommentLike.count({ where: { commentId: comment.id, type: 'like' }, transaction: options.transaction });
        const dislikes = await CommentLike.count({ where: { commentId: comment.id, type: 'dislike' }, transaction: options.transaction });
        console.log('Calculated likes:', likes, 'dislikes:', dislikes, 'for comment ID:', comment.id);
        await comment.update({ likeCount: likes, dislikeCount: dislikes }, { transaction: options.transaction });
        await comment.reload({ transaction: options.transaction }); // Reload the comment instance
        console.log('Successfully updated and reloaded comment ID:', comment.id, 'New counts like:', comment.likeCount, 'dislike:', comment.dislikeCount);
      } else {
        console.log('CommentLike.afterSave: Comment not found for like ID:', like.id, 'CommentID from like object:', like.commentId);
      }
    } catch (error) {
      console.error('Error in CommentLike.afterSave hook for like ID:', like.id, error);
    }
  });

  CommentLike.afterDestroy(async (like, options) => {
    console.log('CommentLike.afterDestroy hook fired for like ID:', like.id, 'Type:', like.type, 'CommentID:', like.commentId, 'UserID:', like.userId);
    console.log(`Hook CommentLike afterDestroy called with transaction ID (if available): ${options && options.transaction && options.transaction.id}`);
    try {
      const commentId = like.commentId; // Get commentId from the instance being destroyed
      if (commentId) {
        // Access Comment model via sequelize.models or db.Comment if db is defined and passed correctly
        const CommentModel = sequelize.models.Comment || db.Comment; // Adjust if db is not available
        const comment = await CommentModel.findByPk(commentId, { transaction: options.transaction });
        
        if (comment) {
          console.log('Found comment ID:', comment.id, 'Current likeCount:', comment.likeCount, 'dislikeCount:', comment.dislikeCount, 'for destroyed like on CommentID:', commentId);
          const likes = await CommentLike.count({ where: { commentId: commentId, type: 'like' }, transaction: options.transaction });
          const dislikes = await CommentLike.count({ where: { commentId: commentId, type: 'dislike' }, transaction: options.transaction });
          console.log('Calculated likes:', likes, 'dislikes:', dislikes, 'for comment ID:', commentId, 'after destroy');
          await comment.update({ likeCount: likes, dislikeCount: dislikes }, { transaction: options.transaction });
          await comment.reload({ transaction: options.transaction }); // Reload the comment instance
          console.log('Successfully updated and reloaded comment ID:', comment.id, 'after destroy. New counts like:', comment.likeCount, 'dislike:', comment.dislikeCount);
        } else {
          console.log('CommentLike.afterDestroy: Comment not found for CommentID:', commentId, '(from destroyed like ID:', like.id, ')');
        }
      } else {
        console.log('CommentLike.afterDestroy: commentId not found on destroyed like instance ID:', like.id);
      }
    } catch (error) {
      console.error('Error in CommentLike.afterDestroy hook for like ID:', like.id, error);
    }
  });

  return CommentLike;
};