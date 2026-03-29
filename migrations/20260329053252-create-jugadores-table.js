'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('jugadores', {
      idUser: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      nombreUsuario: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      correo: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      contrasena: {
        type: Sequelize.STRING,
        allowNull: false
      },
      idUbicacion: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'lugares',
          key: 'idLugar'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      idDeporteFavorito: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'deportes',
          key: 'idDeporte'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      partidosGanados: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      partidosJugados: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Agregar índices
    await queryInterface.addIndex('jugadores', ['correo']);
    await queryInterface.addIndex('jugadores', ['nombreUsuario']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('jugadores');
  }
};
