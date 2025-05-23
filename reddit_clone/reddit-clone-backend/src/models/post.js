'use strict';
// const { // Original
//  Model
// } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Post extends sequelize.Sequelize.Model { // Changed to sequelize.Sequelize.Model
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Post.belongsTo(models.User, { // Added association
        foreignKey: 'userId',
        as: 'author'
      });
      Post.belongsTo(models.Community, { // Added association
        foreignKey: 'communityId',
        as: 'community'
      });
      Post.hasMany(models.Comment, { // Added association for Comments
        foreignKey: 'postId',
        as: 'comments'
      });
      Post.hasMany(models.PostLike, { // Added association for PostLikes
        foreignKey: 'postId',
        as: 'votes' 
      });
    }
  }
  Post.init({
    title: { // Modified title
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: { // Modified content
      type: DataTypes.TEXT,
      allowNull: true, // Content can be optional or empty
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
    communityId: { // Added communityId to model definition
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Communities',
            key: 'id'
        }
    }
  }, {
    sequelize,
    modelName: 'Post',
  });
  return Post;
};