'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Verificar si las columnas ya existen
      const table = await queryInterface.describeTable('partidos', { transaction });

      // Agregar idCreador solo si no existe
      if (!table.idCreador) {
        await queryInterface.addColumn(
          'partidos',
          'idCreador',
          {
            type: Sequelize.INTEGER,
            allowNull: true,
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

      // Agregar estado del partido
      if (!table.estado) {
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
      }

      // Agregar motivo cancelación
      if (!table.motivoCancelacion) {
        await queryInterface.addColumn(
          'partidos',
          'motivoCancelacion',
          {
            type: Sequelize.STRING(500),
            allowNull: true
          },
          { transaction }
        );
      }

      // Agregar timestamps - SIN defaultValue para evitar errores de datetime inválido
      if (!table.createdAt) {
        await queryInterface.addColumn(
          'partidos',
          'createdAt',
          {
            type: Sequelize.DATE(3),
            allowNull: true
          },
          { transaction }
        );
        
        // Actualizar filas existentes con NOW()
        await queryInterface.sequelize.query(
          'UPDATE partidos SET createdAt = NOW() WHERE createdAt IS NULL',
          { transaction }
        );

        // Cambiar a NOT NULL después de actualizar
        await queryInterface.changeColumn(
          'partidos',
          'createdAt',
          {
            type: Sequelize.DATE(3),
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)')
          },
          { transaction }
        );
      }

      if (!table.updatedAt) {
        await queryInterface.addColumn(
          'partidos',
          'updatedAt',
          {
            type: Sequelize.DATE(3),
            allowNull: true
          },
          { transaction }
        );

        // Actualizar filas existentes con NOW()
        await queryInterface.sequelize.query(
          'UPDATE partidos SET updatedAt = NOW() WHERE updatedAt IS NULL',
          { transaction }
        );

        // Cambiar a NOT NULL después de actualizar
        await queryInterface.changeColumn(
          'partidos',
          'updatedAt',
          {
            type: Sequelize.DATE(3),
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)')
          },
          { transaction }
        );
      }

      // Agregar índices (verificar si no existen)
      const indexes = await queryInterface.showIndex('partidos', { transaction });
      const indexNames = indexes.map(idx => idx.name);

      if (!indexNames.includes('idx_partidos_creador')) {
        await queryInterface.addIndex(
          'partidos',
          ['idCreador'],
          { transaction, name: 'idx_partidos_creador' }
        );
      }

      if (!indexNames.includes('idx_partidos_estado')) {
        await queryInterface.addIndex(
          'partidos',
          ['estado'],
          { transaction, name: 'idx_partidos_estado' }
        );
      }

      if (!indexNames.includes('idx_partidos_fecha_estado')) {
        await queryInterface.addIndex(
          'partidos',
          ['fecha', 'estado'],
          { transaction, name: 'idx_partidos_fecha_estado' }
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
      // Remover índices
      const indexes = await queryInterface.showIndex('partidos', { transaction });
      const indexNames = indexes.map(idx => idx.name);

      if (indexNames.includes('idx_partidos_creador')) {
        await queryInterface.removeIndex(
          'partidos',
          'idx_partidos_creador',
          { transaction }
        );
      }

      if (indexNames.includes('idx_partidos_estado')) {
        await queryInterface.removeIndex(
          'partidos',
          'idx_partidos_estado',
          { transaction }
        );
      }

      if (indexNames.includes('idx_partidos_fecha_estado')) {
        await queryInterface.removeIndex(
          'partidos',
          'idx_partidos_fecha_estado',
          { transaction }
        );
      }

      // Remover columnas
      const table = await queryInterface.describeTable('partidos', { transaction });

      if (table.idCreador) {
        await queryInterface.removeColumn('partidos', 'idCreador', { transaction });
      }
      if (table.estado) {
        await queryInterface.removeColumn('partidos', 'estado', { transaction });
      }
      if (table.motivoCancelacion) {
        await queryInterface.removeColumn('partidos', 'motivoCancelacion', { transaction });
      }
      if (table.createdAt) {
        await queryInterface.removeColumn('partidos', 'createdAt', { transaction });
      }
      if (table.updatedAt) {
        await queryInterface.removeColumn('partidos', 'updatedAt', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
