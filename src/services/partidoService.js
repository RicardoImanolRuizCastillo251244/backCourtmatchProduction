const { Partido, Deporte, Lugar, Participacion, Jugador, sequelize } = require('../models/index');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');

/**
 * Crear un nuevo partido con transacción
 * El creador se agrega automáticamente como participante
 */
const crearPartido = async (payload, idCreador) => {
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

  // Validar que el creador existe
  const creador = await Jugador.findByPk(idCreador);
  if (!creador) {
    throw new NotFoundError('Jugador', idCreador);
  }

  // Validar que maxJugadores sea válido
  if (maxJugadores < 2 || maxJugadores > 100) {
    throw new ValidationError('El máximo de jugadores debe estar entre 2 y 100', 'maxJugadores');
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
        estado: 'programado'
      },
      { transaction }
    );

    // Agregar creador como participante automáticamente
    await Participacion.create(
      {
        idUser: idCreador,
        idMatch: partido.idMatch,
        nombreEquipo: null
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
    where: { estado: ['programado', 'en_curso'] },
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

  return {
    ...partido.toJSON(),
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
 * Unirse a un partido
 */
const unirsePartido = async (idMatch, idUsuario, nombreEquipo = null) => {
  const transaction = await sequelize.transaction();

  try {
    const partido = await Partido.findByPk(idMatch);
    if (!partido) {
      throw new NotFoundError('Partido', idMatch);
    }

    // Validar que el partido esté disponible
    if (partido.estado !== 'programado') {
      throw new ValidationError(`No puedes unirte a un partido ${partido.estado}`);
    }

    // Validar que el usuario no esté ya registrado
    const yaRegistrado = await Participacion.findOne({
      where: { idMatch, idUser: idUsuario }
    });
    if (yaRegistrado) {
      throw new ConflictError('Ya estás registrado en este partido');
    }

    // Validar cupos disponibles
    const participantes = await Participacion.count({ where: { idMatch } });
    if (participantes >= partido.maxJugadores) {
      throw new ValidationError('No hay cupos disponibles en este partido');
    }

    // Validar que usuario existe
    const usuario = await Jugador.findByPk(idUsuario);
    if (!usuario) {
      throw new NotFoundError('Jugador', idUsuario);
    }

    // Crear participación
    const participacion = await Participacion.create(
      {
        idUser: idUsuario,
        idMatch,
        nombreEquipo
      },
      { transaction }
    );

    await transaction.commit();
    return participacion;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Remover participante de un partido (solo creador)
 */
const removerParticipante = async (idMatch, idParticipante, idCreador) => {
  const transaction = await sequelize.transaction();

  try {
    const partido = await Partido.findByPk(idMatch);
    if (!partido) {
      throw new NotFoundError('Partido', idMatch);
    }

    // Validar permisos
    if (partido.idCreador !== idCreador) {
      throw new ValidationError('Solo el creador puede remover participantes', 'permisos');
    }

    const participacion = await Participacion.findByPk(idParticipante);
    if (!participacion) {
      throw new NotFoundError('Participación', idParticipante);
    }

    // No permitir que se remueva al creador
    if (participacion.idUser === idCreador) {
      throw new ValidationError('El creador no puede abandonar su propio partido');
    }

    await participacion.destroy({ transaction });
    await transaction.commit();

    return { mensaje: 'Participante removido exitosamente' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Cancelar un partido (solo creador)
 */
const cancelarPartido = async (idMatch, idCreador, motivoCancelacion) => {
  const transaction = await sequelize.transaction();

  try {
    const partido = await Partido.findByPk(idMatch);
    if (!partido) {
      throw new NotFoundError('Partido', idMatch);
    }

    // Validar permisos
    if (partido.idCreador !== idCreador) {
      throw new ValidationError('Solo el creador puede cancelar el partido', 'permisos');
    }

    // Validar estado
    if (partido.estado !== 'programado') {
      throw new ValidationError(`No se puede cancelar un partido en estado ${partido.estado}`);
    }

    // Actualizar partido
    await partido.update(
      {
        estado: 'cancelado',
        motivoCancelacion
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
 * Cambiar estado de un partido (admin/creador)
 */
const cambiarEstadoPartido = async (idMatch, estado, idUsuario, esAdmin = false, motivo = null) => {
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

    // Actualizar
    const motivoCancelacion = estado === 'cancelado' ? motivo : null;
    await partido.update(
      {
        estado,
        motivoCancelacion
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
  removerParticipante,
  cancelarPartido,
  cambiarEstadoPartido,
  obtenerPartidosCreadosPor,
  obtenerPartidosParticipando,
  obtenerHistorialPartidos
};