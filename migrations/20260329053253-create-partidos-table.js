'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('partidos', {
      idMatch: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      idDeporte: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'deportes',
          key: 'idDeporte'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      hora: {
        type: Sequelize.TIME,
        allowNull: false
      },
      idLugar: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'lugares',
          key: 'idLugar'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      maxJugadores: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('partidos');
  }
};
