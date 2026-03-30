'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Verificar que la columna existe antes de cambiarla
      const table = await queryInterface.describeTable('partidos', { transaction });
      
      if (table.idCreador) {
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
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Verificar que la columna existe antes de revertir
      const table = await queryInterface.describeTable('partidos', { transaction });
      
      if (table.idCreador) {
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
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
