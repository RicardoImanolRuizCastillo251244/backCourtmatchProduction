'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Limpiar cualquier migración fallida anterior
      const table = await queryInterface.describeTable('partidos', { transaction });

      // Si la migración anterior dejó datosmalos, los limpiamos
      if (table.createdAt) {
        // Intentar actualizar cualquier valor inválido a NULL primero
        try {
          await queryInterface.sequelize.query(
            `UPDATE partidos SET createdAt = NULL WHERE createdAt = '0000-00-00 00:00:00' OR createdAt = '0000-00-00'`,
            { transaction }
          );
        } catch (e) {
          // Ignorar si falla
        }
      }

      if (table.updatedAt) {
        try {
          await queryInterface.sequelize.query(
            `UPDATE partidos SET updatedAt = NULL WHERE updatedAt = '0000-00-00 00:00:00' OR updatedAt = '0000-00-00'`,
            { transaction }
          );
        } catch (e) {
          // Ignorar si falla
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // No hacer nada en down ya que es solo una limpieza
    return Promise.resolve();
  }
};
