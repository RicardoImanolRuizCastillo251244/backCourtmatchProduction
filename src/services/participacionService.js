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
    return { participacion, jugador, partido };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Obtener participaciones de un partido
 */
const obtenerParticipacionesPorPartido = async (idMatch) => {
  const participaciones = await Participacion.findAll({
    where: { idMatch },
    include: [
      {
        model: Jugador,
        attributes: ['idUser', 'nombreUsuario', 'correo'],
      },
    ],
  });

  return participaciones;
};

module.exports = { unirseAPartido, obtenerParticipacionesPorPartido };