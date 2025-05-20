'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CommentLikes', {
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
      commentId: { // Added commentId
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Comments', // Target table is 'Comments'
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
    await queryInterface.addConstraint('CommentLikes', {
      fields: ['userId', 'commentId'],
      type: 'unique',
      name: 'unique_user_comment_like' // Optional name for the constraint
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove unique constraint first if it was named
    await queryInterface.removeConstraint('CommentLikes', 'unique_user_comment_like');
    await queryInterface.dropTable('CommentLikes');
  }
};