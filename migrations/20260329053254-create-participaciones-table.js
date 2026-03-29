'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('participaciones', {
      idParticipacion: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      nombreEquipo: {
        type: Sequelize.STRING,
        allowNull: true
      },
      idUser: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'jugadores',
          key: 'idUser'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      idMatch: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'partidos',
          key: 'idMatch'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('participaciones');
  }
};
