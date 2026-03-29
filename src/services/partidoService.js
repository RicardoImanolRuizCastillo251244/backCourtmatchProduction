const { Partido, Deporte, Lugar, Participacion, sequelize } = require('../models/index');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');

/**
 * Crear un nuevo partido con transacción
 */
const crearPartido = async (payload) => {
  const { idDeporte, fecha, hora, idLugar, maxJugadores } = payload;

  // Validar datos obligatorios
  if (!idDeporte || !fecha || !hora || !idLugar || !maxJugadores) {
    throw new ValidationError('Faltan datos: idDeporte, fecha, hora, idLugar y maxJugadores son obligatorios');
  }

  // Validar que el deporte existe
  const deporte = await Deporte.findByPk(idDeporte);
  if (!deporte) {
    throw new NotFoundError('Deporte', idDeporte);
  }

  // Validar que el lugar existe
  const lugarExistente = await Lugar.findByPk(idLugar);
  if (!lugarExistente) {
    throw new NotFoundError('Lugar', idLugar);
  }

  // Validar que maxJugadores sea válido
  if (maxJugadores < 2 || maxJugadores > 100) {
    throw new ValidationError('El máximo de jugadores debe estar entre 2 y 100', 'maxJugadores');
  }

  // Usar transacción
  const transaction = await sequelize.transaction();

  try {
    const partido = await Partido.create(
      { idDeporte, fecha, hora, idLugar, maxJugadores },
      { transaction }
    );

    await transaction.commit();
    return partido;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Obtener todos los partidos con paginación
 */
const obtenerPartidos = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const partidos = await Partido.findAndCountAll({
    include: [
      { 
        model: Deporte, 
        attributes: ['idDeporte', 'nombreDeporte']
      },
      {
        model: Lugar,
        attributes: ['idLugar', 'nombre']
      }
    ],
    limit,
    offset,
    order: [['fecha', 'ASC'], ['hora', 'ASC']],
  });

  return partidos;
};

/**
 * Obtener un partido específico con sus participantes
 */
const obtenerPartidoPorId = async (idMatch) => {
  const partido = await Partido.findByPk(idMatch, {
    include: [
      { 
        model: Deporte, 
        attributes: ['nombreDeporte']
      },
    ],
  });

  if (!partido) {
    throw new NotFoundError('Partido', idMatch);
  }

  // Contar participantes
  const participantes = await Participacion.count({
    where: { idMatch },
  });

  return {
    ...partido.toJSON(),
    participantesActuales: participantes,
    cuposDisponibles: partido.maxJugadores - participantes,
  };
};

module.exports = { crearPartido, obtenerPartidos, obtenerPartidoPorId };