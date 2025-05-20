'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Posts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false // Added
      },
      content: {
        type: Sequelize.TEXT // No change, can be null or empty
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
      communityId: { // Added communityId foreign key
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Communities', // Name of the target table
          key: 'id',            // Name of the target column
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
    await queryInterface.dropTable('Posts');
  }
};