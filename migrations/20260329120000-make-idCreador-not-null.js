'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Cambiar idCreador a NOT NULL después de que ya exista la columna
      await queryInterface.changeColumn(
        'partidos',
        'idCreador',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'jugadores',
            key: 'idUser'
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE'
        },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Revertir a nullable
      await queryInterface.changeColumn(
        'partidos',
        'idCreador',
        {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
