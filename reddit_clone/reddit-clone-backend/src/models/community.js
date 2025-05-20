'use strict';
// const { // Original
//  Model
// } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Community extends sequelize.Sequelize.Model { // Changed to sequelize.Sequelize.Model
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Community.belongsTo(models.User, { // Added association
        foreignKey: 'userId',
        as: 'creator',
        allowNull: false // Ensure foreign key cannot be null
      });
      Community.hasMany(models.Post, { // Added association for Posts
        foreignKey: 'communityId',
        as: 'posts'
      });
    }
  }
  Community.init({
    name: { // Modified name
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: { // No changes to description attributes, just ensuring it's here
        type: DataTypes.TEXT,
        allowNull: true // Description can be optional
    },
    userId: { // Added userId to model definition to match migration
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { 
            model: 'Users', // Should match table name for Users
            key: 'id'
        }
    }
  }, {
    sequelize,
    modelName: 'Community',
  });
  return Community;
};