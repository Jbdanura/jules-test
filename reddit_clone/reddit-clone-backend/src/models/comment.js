'use strict';
// const { // Original
//  Model
// } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Comment extends sequelize.Sequelize.Model { // Changed to sequelize.Sequelize.Model
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Comment.belongsTo(models.User, { // Added association
        foreignKey: 'userId',
        as: 'author'
      });
      Comment.belongsTo(models.Post, {
        foreignKey: 'postId',
        as: 'post',
        onDelete: 'CASCADE' // Added onDelete: 'CASCADE'
      });
      Comment.hasMany(models.CommentLike, { // Added association for CommentLikes
        foreignKey: 'commentId',
        as: 'votes'
      });
    }
  }
  Comment.init({
    content: { // Modified content
      type: DataTypes.TEXT,
      allowNull: false,
    },
    likeCount: { // Changed from likes
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    dislikeCount: { // Changed from dislikes
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    score: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.likeCount - this.dislikeCount;
      }
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
    modelName: 'Comment',
  });
  return Comment;
};