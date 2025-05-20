// Inside src/models/user.js
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends sequelize.Sequelize.Model {} // Use Model from sequelize.Sequelize.Model

  User.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10); // Use await for async bcrypt
          user.password = await bcrypt.hash(user.password, salt); // Use await
        }
      },
    },
  });

  // Instance method to validate password
  User.prototype.validPassword = function(password) { // Use function keyword for 'this'
    return bcrypt.compareSync(password, this.password);
  };
  
  // Potentially add associations here later if needed
  User.associate = function(models) { // Changed from User.associate = function(models)
    // associations can be defined here
    User.hasMany(models.Community, {
        foreignKey: 'userId',
        as: 'createdCommunities'
    });
    User.hasMany(models.Post, {
        foreignKey: 'userId',
        as: 'posts'
    });
    User.hasMany(models.Comment, {
        foreignKey: 'userId',
        as: 'comments'
    });
    User.hasMany(models.PostLike, {
        foreignKey: 'userId',
        as: 'postLikes'
    });
    User.hasMany(models.CommentLike, { // Added association for CommentLikes
        foreignKey: 'userId',
        as: 'commentLikes'
    });
  };

  return User;
};