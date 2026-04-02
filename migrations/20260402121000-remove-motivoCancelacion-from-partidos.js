"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove column motivoCancelacion from partidos
    await queryInterface.removeColumn('partidos', 'motivoCancelacion');
  },

  down: async (queryInterface, Sequelize) => {
    // Restore motivoCancelacion if rolling back
    await queryInterface.addColumn('partidos', 'motivoCancelacion', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
  }
};
