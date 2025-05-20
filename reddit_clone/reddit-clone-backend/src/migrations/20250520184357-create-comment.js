'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Comments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false // Added
      },
      likes: {
        type: Sequelize.INTEGER,
        defaultValue: 0 // Added
      },
      dislikes: {
        type: Sequelize.INTEGER,
        defaultValue: 0 // Added
      },
      userId: { // Added userId foreign key
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users', // Name of the target table
          key: 'id',      // Name of the target column
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Added
      },
      postId: { // Added postId foreign key
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Posts',   // Name of the target table
          key: 'id',        // Name of the target column
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Added
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Comments');
  }
};