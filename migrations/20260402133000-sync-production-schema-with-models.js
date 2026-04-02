'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const jugadores = await queryInterface.describeTable('jugadores', { transaction });

      // Modelo Jugador no usa timestamps ni estadisticas.
      if (jugadores.createdAt) {
        await queryInterface.removeColumn('jugadores', 'createdAt', { transaction });
      }

      if (jugadores.updatedAt) {
        await queryInterface.removeColumn('jugadores', 'updatedAt', { transaction });
      }

      if (jugadores.partidosGanados) {
        await queryInterface.removeColumn('jugadores', 'partidosGanados', { transaction });
      }

      if (jugadores.partidosJugados) {
        await queryInterface.removeColumn('jugadores', 'partidosJugados', { transaction });
      }

      const partidos = await queryInterface.describeTable('partidos', { transaction });

      if (!partidos.descripcion) {
        await queryInterface.addColumn(
          'partidos',
          'descripcion',
          {
            type: Sequelize.TEXT,
            allowNull: true
          },
          { transaction }
        );
      }

      if (partidos.motivoCancelacion) {
        await queryInterface.removeColumn('partidos', 'motivoCancelacion', { transaction });
      }

      if (!partidos.estado) {
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

      if (!partidos.idCreador) {
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

      if (!partidos.createdAt) {
        await queryInterface.addColumn(
          'partidos',
          'createdAt',
          {
            type: Sequelize.DATE(3),
            allowNull: true
          },
          { transaction }
        );
      }

      await queryInterface.sequelize.query(
        'UPDATE partidos SET createdAt = NOW(3) WHERE createdAt IS NULL',
        { transaction }
      );

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

      if (!partidos.updatedAt) {
        await queryInterface.addColumn(
          'partidos',
          'updatedAt',
          {
            type: Sequelize.DATE(3),
            allowNull: true
          },
          { transaction }
        );
      }

      await queryInterface.sequelize.query(
        'UPDATE partidos SET updatedAt = NOW(3) WHERE updatedAt IS NULL',
        { transaction }
      );

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

      const [nullCreatorRows] = await queryInterface.sequelize.query(
        'SELECT COUNT(*) AS total FROM partidos WHERE idCreador IS NULL',
        { transaction }
      );

      const nullCreatorCount = Number(nullCreatorRows[0]?.total || 0);

      if (nullCreatorCount > 0) {
        const [creatorRows] = await queryInterface.sequelize.query(
          'SELECT idUser FROM jugadores ORDER BY idUser ASC LIMIT 1',
          { transaction }
        );

        const fallbackCreatorId = creatorRows[0]?.idUser;

        if (fallbackCreatorId) {
          await queryInterface.sequelize.query(
            'UPDATE partidos SET idCreador = :fallbackCreatorId WHERE idCreador IS NULL',
            {
              transaction,
              replacements: { fallbackCreatorId }
            }
          );
        } else {
          throw new Error(
            'No se puede establecer partidos.idCreador como NOT NULL: existen partidos sin idCreador y no hay jugadores para asignar un creador por defecto.'
          );
        }
      }

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

  async down() {
    // Migracion de sincronizacion para produccion. No se revierte automaticamente.
  }
};
