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
    const comment = await like.getComment(); // Assumes getComment method from association
    if (comment) {
        const likes = await CommentLike.count({ where: { commentId: comment.id, type: 'like' } });
        const dislikes = await CommentLike.count({ where: { commentId: comment.id, type: 'dislike' } });
        await comment.update({ likeCount: likes, dislikeCount: dislikes }, { transaction: options.transaction });
    }
  });

  CommentLike.afterDestroy(async (like, options) => {
    const commentId = like.commentId;
    if (commentId) {
        const comment = await sequelize.models.Comment.findByPk(commentId, { transaction: options.transaction }); // Access Comment model via sequelize.models
        if (comment) {
            const likes = await CommentLike.count({ where: { commentId: commentId, type: 'like' } });
            const dislikes = await CommentLike.count({ where: { commentId: commentId, type: 'dislike' } });
            await comment.update({ likeCount: likes, dislikeCount: dislikes }, { transaction: options.transaction });
        }
    }
  });

  return CommentLike;
};