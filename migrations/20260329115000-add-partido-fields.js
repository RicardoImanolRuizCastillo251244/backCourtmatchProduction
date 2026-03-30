'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Agregar columnas a tabla partidos
      // idCreador inicialmente nullable, seria seteado a notNull después de tener datos
      await queryInterface.addColumn(
        'partidos',
        'idCreador',
        {
          type: Sequelize.INTEGER,
          allowNull: true, // Inicialmente nullable
          references: {
            model: 'jugadores',
            key: 'idUser'
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE'
        },
        { transaction }
      );

      // Agregar estado del partido
      await queryInterface.addColumn(
        'partidos',
        'estado',
        {
          type: Sequelize.ENUM('programado', 'en_curso', 'finalizado', 'cancelado'),
          allowNull: false,
          defaultValue: 'programado'
        },
        { transaction }
      );

      // Agregar motivo cancelación
      await queryInterface.addColumn(
        'partidos',
        'motivoCancelacion',
        {
          type: Sequelize.STRING(500),
          allowNull: true
        },
        { transaction }
      );

      // Agregar timestamps para auditoría
      await queryInterface.addColumn(
        'partidos',
        'createdAt',
        {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'partidos',
        'updatedAt',
        {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        { transaction }
      );

      // Agregar índices para performance
      await queryInterface.addIndex(
        'partidos',
        ['idCreador'],
        { transaction, name: 'idx_partidos_creador' }
      );

      await queryInterface.addIndex(
        'partidos',
        ['estado'],
        { transaction, name: 'idx_partidos_estado' }
      );

      await queryInterface.addIndex(
        'partidos',
        ['fecha', 'estado'],
        { transaction, name: 'idx_partidos_fecha_estado' }
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
      // Remover índices
      await queryInterface.removeIndex(
        'partidos',
        'idx_partidos_creador',
        { transaction }
      );

      await queryInterface.removeIndex(
        'partidos',
        'idx_partidos_estado',
        { transaction }
      );

      await queryInterface.removeIndex(
        'partidos',
        'idx_partidos_fecha_estado',
        { transaction }
      );

      // Remover columnas
      await queryInterface.removeColumn('partidos', 'idCreador', { transaction });
      await queryInterface.removeColumn('partidos', 'estado', { transaction });
      await queryInterface.removeColumn('partidos', 'motivoCancelacion', { transaction });
      await queryInterface.removeColumn('partidos', 'createdAt', { transaction });
      await queryInterface.removeColumn('partidos', 'updatedAt', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
