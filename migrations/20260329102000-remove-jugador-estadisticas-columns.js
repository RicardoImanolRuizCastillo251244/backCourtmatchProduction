'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('jugadores');

    if (table.partidosGanados) {
      await queryInterface.removeColumn('jugadores', 'partidosGanados');
    }

    if (table.partidosJugados) {
      await queryInterface.removeColumn('jugadores', 'partidosJugados');
    }
  },

  async down (queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('jugadores');

    if (!table.partidosGanados) {
      await queryInterface.addColumn('jugadores', 'partidosGanados', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }

    if (!table.partidosJugados) {
      await queryInterface.addColumn('jugadores', 'partidosJugados', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
  }
};