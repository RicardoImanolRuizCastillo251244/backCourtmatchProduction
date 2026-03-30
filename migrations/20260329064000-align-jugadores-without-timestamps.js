'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('jugadores');

    if (table.createdAt) {
      await queryInterface.removeColumn('jugadores', 'createdAt');
    }

    if (table.updatedAt) {
      await queryInterface.removeColumn('jugadores', 'updatedAt');
    }
  },

  async down (queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('jugadores');

    if (!table.createdAt) {
      await queryInterface.addColumn('jugadores', 'createdAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
    }

    if (!table.updatedAt) {
      await queryInterface.addColumn('jugadores', 'updatedAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      });
    }
  }
};