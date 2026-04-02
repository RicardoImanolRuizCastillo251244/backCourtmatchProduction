const { Partido, Deporte, Lugar, Participacion, Jugador, sequelize } = require('../models/index');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');
const participacionService = require('./participacionService');

/**
 * Crear un nuevo partido con transacción
 * El creador se agrega automáticamente como participante
 */
const crearPartido = async (payload, idCreador) => {
  const { idDeporte, fecha, hora, idLugar, maxJugadores, equipoCreador, descripcion } = payload;

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

  // Validar que el creador existe
  const creador = await Jugador.findByPk(idCreador);
  if (!creador) {
    throw new NotFoundError('Jugador', idCreador);
  }

  // Validar que maxJugadores sea válido
  if (maxJugadores < 2 || maxJugadores > 100) {
    throw new ValidationError('El máximo de jugadores debe estar entre 2 y 100', 'maxJugadores');
  }

  if (!['A', 'B'].includes(equipoCreador)) {
    throw new ValidationError('El equipo del creador debe ser A o B', 'equipoCreador');
  }

  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const fechaPartido = new Date(`${fecha}T00:00:00`);

  if (Number.isNaN(fechaPartido.getTime()) || fechaPartido < hoy) {
    throw new ValidationError('La fecha no puede ser en el pasado', 'fecha');
  }

  // Si la fecha es hoy, la hora del partido no puede ser anterior a la hora actual.
  if (fechaPartido.getTime() === hoy.getTime()) {
    const [horas, minutos] = String(hora).split(':').map(Number);
    const fechaHoraPartido = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate(),
      horas,
      minutos,
      0,
      0
    );

    if (fechaHoraPartido < ahora) {
      throw new ValidationError('La hora no puede ser en el pasado para la fecha actual', 'hora');
    }
  }

  // Usar transacción para garantizar consistencia
  const transaction = await sequelize.transaction();

  try {
    // Crear partido
    const partido = await Partido.create(
      { 
        idDeporte, 
        fecha, 
        hora, 
        idLugar, 
        maxJugadores,
        idCreador,
        descripcion: descripcion ?? null,
        estado: 'programado'
      },
      { transaction }
    );

    // Agregar creador como participante automáticamente
    await Participacion.create(
      {
        idUser: idCreador,
        idMatch: partido.idMatch,
        nombreEquipo: equipoCreador
      },
      { transaction }
    );

    await transaction.commit();
    
    // Retornar partido con datos del creador
    return {
      ...partido.toJSON(),
      creador: {
        idUser: creador.idUser,
        nombreUsuario: creador.nombreUsuario,
        correo: creador.correo
      }
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Obtener todos los partidos con paginación
 */
const obtenerPartidos = async (page = 1, limit = 10, estado) => {
  const offset = (page - 1) * limit;

  const estadosValidos = ['programado', 'en_curso', 'finalizado', 'cancelado'];
  const where = {};

  if (typeof estado === 'string' && estado.trim().length > 0) {
    const estadoNormalizado = estado.trim().toLowerCase();

    if (estadoNormalizado === 'activos') {
      where.estado = ['programado', 'en_curso'];
    } else if (estadoNormalizado === 'todos') {
      // Sin filtro de estado para incluir todos los registros.
    } else if (estadosValidos.includes(estadoNormalizado)) {
      where.estado = estadoNormalizado;
    } else {
      throw new ValidationError('El parámetro estado es inválido. Usa: activos, todos, programado, en_curso, finalizado o cancelado', 'estado');
    }
  } else {
    // Por defecto se incluyen los finalizados para historial y consultas administrativas.
    where.estado = ['programado', 'en_curso', 'finalizado'];
  }

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
    attributes: {
      include: [
        [
          sequelize.literal('(SELECT COUNT(*) FROM participaciones WHERE participaciones.idMatch = Partido.idMatch)'),
          'participantesActuales'
        ]
      ]
    },
    where,
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
        attributes: ['idDeporte', 'nombreDeporte']
      },
      {
        model: Lugar,
        attributes: ['idLugar', 'nombre']
      }
    ],
  });

  if (!partido) {
    throw new NotFoundError('Partido', idMatch);
  }

  // Contar participantes
  const participantes = await Participacion.count({
    where: { idMatch },
  });

  const partidoData = partido.toJSON();

  return {
    ...partidoData,
    nombre: `${partidoData.Deporte?.nombreDeporte ?? ''} - ${partidoData.Lugar?.nombre ?? ''}`,
    participantesActuales: participantes,
    cuposDisponibles: Math.max(0, partido.maxJugadores - participantes),
  };
};

/**
 * Obtener creador de un partido
 */
const obtenerCreador = async (idMatch) => {
  const partido = await Partido.findByPk(idMatch);
  if (!partido) {
    throw new NotFoundError('Partido', idMatch);
  }

  const creador = await Jugador.findByPk(partido.idCreador, {
    attributes: ['idUser', 'nombreUsuario', 'correo', 'idUbicacion']
  });

  if (!creador) {
    throw new NotFoundError('Creador del partido', partido.idCreador);
  }

  return creador;
};

/**
 * Obtener participantes de un partido
 */
const obtenerParticipantes = async (idMatch) => {
  const partido = await Partido.findByPk(idMatch);
  if (!partido) {
    throw new NotFoundError('Partido', idMatch);
  }

  const participantes = await Participacion.findAll({
    where: { idMatch },
    include: [
      {
        model: Jugador,
        attributes: ['idUser', 'nombreUsuario', 'correo', 'idUbicacion'],
        as: 'Jugador'
      }
    ]
  });

  return participantes.map(p => ({
    idParticipacion: p.idParticipacion,
    nombreEquipo: p.nombreEquipo,
    usuario: p.Jugador,
    esCreador: p.idUser === partido.idCreador
  }));
};

/**
 * Unirse a un partido — delega a participacionService (fuente única de verdad)
 */
const unirsePartido = async (idMatch, idUsuario, equipo) => {
  return participacionService.unirseAPartido({
    idUser: Number(idUsuario),
    idMatch: Number(idMatch),
    nombreEquipo: equipo
  });
};

/**
 * Cancelar un partido (solo creador)
 */
const cancelarPartido = async (idMatch, idCreador) => {
  const transaction = await sequelize.transaction();

  try {
    const partido = await Partido.findByPk(idMatch, { transaction });
    if (!partido) {
      throw new NotFoundError('Partido', idMatch);
    }

    // Validar permisos
    if (partido.idCreador !== idCreador) {
      throw new ValidationError('Solo el creador puede cancelar el partido', 'permisos');
    }

    // Un partido en curso o finalizado no se elimina desde este endpoint.
    // Si ya estaba marcado como cancelado por datos previos, se permite purgarlo.
    if (['en_curso', 'finalizado'].includes(partido.estado)) {
      throw new ValidationError(`No se puede cancelar un partido en estado ${partido.estado}`);
    }

    await Participacion.destroy({
      where: { idMatch },
      transaction,
    });

    await partido.destroy({ transaction });

    await transaction.commit();

    return {
      idMatch: Number(idMatch),
      eliminado: true,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Cambiar estado de un partido (admin/creador)
 */
const cambiarEstadoPartido = async (idMatch, estado, idUsuario, esAdmin = false) => {
  const transaction = await sequelize.transaction();

  try {
    const partido = await Partido.findByPk(idMatch);
    if (!partido) {
      throw new NotFoundError('Partido', idMatch);
    }

    // Validar permisos
    if (!esAdmin && partido.idCreador !== idUsuario) {
      throw new ValidationError('Solo el creador o admin pueden cambiar el estado', 'permisos');
    }

    // Actualizar estado solamente; motivoCancelacion ya no se persiste
    await partido.update(
      {
        estado
      },
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
 * Obtener partidos creados por un usuario
 */
const obtenerPartidosCreadosPor = async (idUsuario, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const partidos = await Partido.findAndCountAll({
    where: { idCreador: idUsuario },
    include: [
      { model: Deporte, attributes: ['idDeporte', 'nombreDeporte'] },
      { model: Lugar, attributes: ['idLugar', 'nombre'] }
    ],
    limit,
    offset,
    order: [['fecha', 'DESC']]
  });

  return partidos;
};

/**
 * Obtener partidos donde participa un usuario
 */
const obtenerPartidosParticipando = async (idUsuario, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const participaciones = await Participacion.findAndCountAll({
    where: { idUser: idUsuario },
    include: [
      {
        as: 'Partido',
        model: Partido,
        include: [
          { model: Deporte, attributes: ['idDeporte', 'nombreDeporte'] },
          { model: Lugar, attributes: ['idLugar', 'nombre'] }
        ]
      }
    ],
    limit,
    offset,
    order: [[{ model: Partido }, 'fecha', 'DESC']]
  });

  return {
    rows: participaciones.rows.map(p => p.Partido),
    count: participaciones.count
  };
};

/**
 * Obtener historial completo de partidos de usuario
 */
const obtenerHistorialPartidos = async (idUsuario, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  // Obtener partidos creados
  const partidos = await sequelize.query(`
    SELECT 
      p.idMatch, p.idDeporte, p.fecha, p.hora, p.idLugar, 
      p.maxJugadores, p.estado, p.createdAt, p.updatedAt,
      d.nombreDeporte, l.nombre as lugarNombre,
      'creado' as tipo,
      '${idUsuario}' as rol
    FROM partidos p
    JOIN deportes d ON p.idDeporte = d.idDeporte
    JOIN lugares l ON p.idLugar = l.idLugar
    WHERE p.idCreador = :idUsuario
    
    UNION ALL
    
    SELECT 
      p.idMatch, p.idDeporte, p.fecha, p.hora, p.idLugar,
      p.maxJugadores, p.estado, p.createdAt, p.updatedAt,
      d.nombreDeporte, l.nombre as lugarNombre,
      'participante' as tipo,
      '${idUsuario}' as rol
    FROM partidos p
    JOIN deportes d ON p.idDeporte = d.idDeporte
    JOIN lugares l ON p.idLugar = l.idLugar
    JOIN participaciones part ON p.idMatch = part.idMatch
    WHERE part.idUser = :idUsuario AND p.idCreador != :idUsuario
    
    ORDER BY fecha DESC
    LIMIT :limit OFFSET :offset
  `, {
    replacements: { idUsuario, limit, offset },
    type: sequelize.QueryTypes.SELECT
  });

  return partidos;
};

module.exports = {
  crearPartido,
  obtenerPartidos,
  obtenerPartidoPorId,
  obtenerCreador,
  obtenerParticipantes,
  unirsePartido,
  cancelarPartido,
  cambiarEstadoPartido,
  obtenerPartidosCreadosPor,
  obtenerPartidosParticipando,
  obtenerHistorialPartidos
};