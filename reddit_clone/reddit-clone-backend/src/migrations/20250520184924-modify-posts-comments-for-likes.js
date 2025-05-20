'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Modify Posts table
    await queryInterface.removeColumn('Posts', 'likes');
    await queryInterface.removeColumn('Posts', 'dislikes');
    await queryInterface.addColumn('Posts', 'likeCount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn('Posts', 'dislikeCount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    // Modify Comments table
    await queryInterface.removeColumn('Comments', 'likes');
    await queryInterface.removeColumn('Comments', 'dislikes');
    await queryInterface.addColumn('Comments', 'likeCount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn('Comments', 'dislikeCount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert Posts table
    await queryInterface.removeColumn('Posts', 'likeCount');
    await queryInterface.removeColumn('Posts', 'dislikeCount');
    await queryInterface.addColumn('Posts', 'likes', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    await queryInterface.addColumn('Posts', 'dislikes', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    // Revert Comments table
    await queryInterface.removeColumn('Comments', 'likeCount');
    await queryInterface.removeColumn('Comments', 'dislikeCount');
    await queryInterface.addColumn('Comments', 'likes', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    await queryInterface.addColumn('Comments', 'dislikes', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
  }
};
