'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PostLikes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.ENUM('like', 'dislike'), // Changed to ENUM
        allowNull: false
      },
      userId: { // Added userId
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      postId: { // Added postId
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Posts',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add unique constraint
    await queryInterface.addConstraint('PostLikes', {
      fields: ['userId', 'postId'],
      type: 'unique',
      name: 'unique_user_post_like' // Optional name for the constraint
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove unique constraint first if it was named
    await queryInterface.removeConstraint('PostLikes', 'unique_user_post_like');
    await queryInterface.dropTable('PostLikes');
  }
};