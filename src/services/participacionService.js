const { Participacion, Jugador, Partido, sequelize } = require('../models/index');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');

/**
 * Inscribir a un jugador en un partido con validaciones y transacción
 */
const unirseAPartido = async ({ idUser, idMatch, nombreEquipo }) => {
  // Validar datos obligatorios
  if (!idUser || !idMatch) {
    throw new ValidationError('Faltan datos: idUser e idMatch son obligatorios');
  }

  // Validar que sean del tipo correcto
  if (typeof idUser !== 'number' || typeof idMatch !== 'number') {
    throw new ValidationError('idUser e idMatch deben ser números', 'id');
  }

  // Usar transacción
  const transaction = await sequelize.transaction();

  try {
    // Verificar que jugador existe
    const jugador = await Jugador.findByPk(idUser, { transaction });
    if (!jugador) {
      await transaction.rollback();
      throw new NotFoundError('Jugador', idUser);
    }

    // Verificar que partido existe
    const partido = await Partido.findByPk(idMatch, { transaction });
    if (!partido) {
      await transaction.rollback();
      throw new NotFoundError('Partido', idMatch);
    }

    if (partido.estado !== 'programado') {
      await transaction.rollback();
      throw new ValidationError(`No puedes unirte a un partido ${partido.estado}`);
    }

    // Verificar que el jugador no está ya inscrito
    const yaInscrito = await Participacion.findOne({
      where: { idUser, idMatch },
      transaction,
    });

    if (yaInscrito) {
      await transaction.rollback();
      throw new ConflictError('Ya estás inscrito en este partido.', 'idMatch');
    }

    // Contar participantes actuales
    const participantesActuales = await Participacion.count({
      where: { idMatch },
      transaction,
    });

    // Verificar que hay cupos disponibles
    if (participantesActuales >= partido.maxJugadores) {
      await transaction.rollback();
      throw new ConflictError('El partido está lleno.', 'maxJugadores');
    }

    // Crear participación
    const participacion = await Participacion.create(
      { idUser, idMatch, nombreEquipo },
      { transaction }
    );

    await transaction.commit();

    const participantesTotales = participantesActuales + 1;

    return {
      participacion,
      jugador,
      partido,
      resumenCupos: {
        maxJugadores: partido.maxJugadores,
        participantesActuales: participantesTotales,
        cuposDisponibles: Math.max(0, partido.maxJugadores - participantesTotales)
      }
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Obtener participaciones de un partido
 */
const obtenerParticipacionesPorPartido = async (idMatch) => {
  const partido = await Partido.findByPk(idMatch, {
    attributes: ['idMatch', 'maxJugadores', 'estado']
  });

  if (!partido) {
    throw new NotFoundError('Partido', idMatch);
  }

  const participaciones = await Participacion.findAll({
    where: { idMatch },
    include: [
      {
        model: Jugador,
        attributes: ['idUser', 'nombreUsuario', 'correo'],
      },
    ],
  });

  return {
    idMatch: partido.idMatch,
    estado: partido.estado,
    maxJugadores: partido.maxJugadores,
    participantesActuales: participaciones.length,
    cuposDisponibles: Math.max(0, partido.maxJugadores - participaciones.length),
    participaciones
  };
};

/**
 * Cancelar la asistencia propia a un partido
 * El creador NO puede abandonar así — debe cancelar el partido completo
 */
const cancelarAsistencia = async (idParticipacion, idUsuario) => {
  const transaction = await sequelize.transaction();

  try {
    const participacion = await Participacion.findByPk(idParticipacion, { transaction });
    if (!participacion) {
      await transaction.rollback();
      throw new NotFoundError('Participación', idParticipacion);
    }

    // Solo el dueño de la participación puede cancelarla
    if (participacion.idUser !== idUsuario) {
      await transaction.rollback();
      throw new ValidationError('No puedes cancelar la asistencia de otro jugador', 'permisos');
    }

    const partido = await Partido.findByPk(participacion.idMatch, { transaction });
    if (!partido) {
      await transaction.rollback();
      throw new NotFoundError('Partido', participacion.idMatch);
    }

    // El creador no puede abandonar su propio partido — debe cancelarlo
    if (partido.idCreador === idUsuario) {
      await transaction.rollback();
      throw new ValidationError(
        'Eres el creador de este partido. Para salir debes cancelar el partido completo.',
        'permisos'
      );
    }

    // Solo se puede salir de un partido programado
    if (partido.estado !== 'programado') {
      await transaction.rollback();
      throw new ValidationError(`No puedes cancelar tu asistencia a un partido ${partido.estado}`);
    }

    await participacion.destroy({ transaction });
    await transaction.commit();

    return { mensaje: 'Asistencia cancelada exitosamente' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = { unirseAPartido, obtenerParticipacionesPorPartido, cancelarAsistencia };