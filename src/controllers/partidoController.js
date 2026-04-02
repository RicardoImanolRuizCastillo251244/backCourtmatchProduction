const partidoService = require('../services/partidoService');
const logger = require('../utils/logger');

/**
 * POST /api/partidos/programar - Crear nuevo partido (requiere auth)
 * El creador se agrega automáticamente como participante
 */
const crearPartido = async (req, res, next) => {
  try {
    const idCreador = req.usuario.id; // Del token JWT
    const nuevoPartido = await partidoService.crearPartido(req.validatedBody, idCreador);
    
    const io = req.app.get('socketio');
    if (io) {
      const detalles = {
        idMatch: nuevoPartido.idMatch,
        idLugar: nuevoPartido.idLugar,
        fecha: nuevoPartido.fecha,
        hora: nuevoPartido.hora,
        deporte: nuevoPartido.idDeporte,
        creador: nuevoPartido.creador?.nombreUsuario,
        descripcion: nuevoPartido.descripcion ?? null,
      };

      // Nueva reta: emitir resumen público (DTO) para vistas generales
      io.emit('nuevaReta', { mensaje: '¡Nueva reta programada!', detalles, timestamp: new Date() });
      io.emit('partidosEstadoActualizado', { idsMatch: [nuevoPartido.idMatch], timestamp: new Date() });
    }

    logger.info(`Nuevo partido creado: ${nuevoPartido.idMatch} por usuario ${idCreador}`);

    res.status(201).json({
      ok: true,
      statusCode: 201,
      message: '¡Partido programado exitosamente!',
      data: nuevoPartido,
    });
  } catch (error) {
    logger.error(`Error al crear partido: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/partidos - Obtener todos los partidos disponibles (requiere auth, con paginación)
 */
const obtenerPartidos = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const partidos = await partidoService.obtenerPartidos(page, limit);

    res.json({
      ok: true,
      statusCode: 200,
      message: 'Partidos obtenidos exitosamente',
      data: partidos.rows,
      pagination: {
        total: partidos.count,
        pages: Math.ceil(partidos.count / limit),
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    logger.error(`Error al obtener partidos: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/partidos/:idMatch - Obtener detalles de un partido
 */
const obtenerPartidoPorId = async (req, res, next) => {
  try {
    const { idMatch } = req.params;
    const partido = await partidoService.obtenerPartidoPorId(idMatch);

    res.json({
      ok: true,
      statusCode: 200,
      message: 'Partido obtenido exitosamente',
      data: partido,
    });
  } catch (error) {
    logger.error(`Error al obtener partido ${req.params.idMatch}: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/partidos/:idMatch/creador - Obtener creador del partido
 */
const obtenerCreador = async (req, res, next) => {
  try {
    const { idMatch } = req.params;
    const creador = await partidoService.obtenerCreador(idMatch);

    res.json({
      ok: true,
      statusCode: 200,
      message: 'Creador obtenido exitosamente',
      data: creador,
    });
  } catch (error) {
    logger.error(`Error al obtener creador del partido ${req.params.idMatch}: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/partidos/:idMatch/participantes - Obtener participantes de un partido
 */
const obtenerParticipantes = async (req, res, next) => {
  try {
    const { idMatch } = req.params;
    const participantes = await partidoService.obtenerParticipantes(idMatch);

    res.json({
      ok: true,
      statusCode: 200,
      message: 'Participantes obtenidos exitosamente',
      data: participantes,
    });
  } catch (error) {
    logger.error(`Error al obtener participantes del partido ${req.params.idMatch}: ${error.message}`);
    next(error);
  }
};

/**
 * POST /api/partidos/:idMatch/unirse - Unirse a un partido
 */
const unirsePartido = async (req, res, next) => {
  try {
    const { idMatch } = req.params;
    const idUsuario = req.usuario.id;
    const { equipo } = req.validatedBody;

    const { participacion, jugador, partido, resumenCupos } = await partidoService.unirsePartido(idMatch, idUsuario, equipo);

    const io = req.app.get('socketio');
    if (io) {
      const payload = {
        idMatch,
        idUsuario,
        mensaje: '¡Nuevo participante en el partido!',
        timestamp: new Date(),
      };

      // Emitir al room del partido y emitir resumen global
      io.to(`partido_${idMatch}`).emit('nuevoParticipante', payload);
      io.emit('partidosEstadoActualizado', { idsMatch: [idMatch], timestamp: new Date() });
    }

    logger.info(`Usuario ${idUsuario} se unió al partido ${idMatch}`);

    res.status(201).json({
      ok: true,
      statusCode: 201,
      message: '¡Te has unido al partido exitosamente!',
      data: {
        participacion,
        jugador: {
          nombreUsuario: jugador.nombreUsuario,
          correo: jugador.correo,
        },
        partido: {
          lugar: partido.lugar,
          fecha: partido.fecha,
          hora: partido.hora,
          maxJugadores: resumenCupos.maxJugadores,
          participantesActuales: resumenCupos.participantesActuales,
          cuposDisponibles: resumenCupos.cuposDisponibles,
        },
      },
    });
  } catch (error) {
    logger.error(`Error al unirse al partido ${req.params.idMatch}: ${error.message}`);
    next(error);
  }
};

/**
 * DELETE /api/partidos/:idMatch - Cancelar partido (solo creador)
 */
const cancelarPartido = async (req, res, next) => {
  try {
    const { idMatch } = req.params;
    const idCreador = req.usuario.id;
    const { motivoCancelacion } = req.validatedBody;

    const partido = await partidoService.cancelarPartido(idMatch, idCreador, motivoCancelacion);

    const io = req.app.get('socketio');
    if (io) {
      const payload = { idMatch, motivo: motivoCancelacion, timestamp: new Date() };
      io.to(`partido_${idMatch}`).emit('partidoCancelado', payload);
      io.emit('partidosEstadoActualizado', { idsMatch: [idMatch], estado: 'cancelado', timestamp: new Date() });
    }

    logger.info(`Partido ${idMatch} cancelado por usuario ${idCreador}`);

    res.json({
      ok: true,
      statusCode: 200,
      message: 'Partido cancelado exitosamente',
      data: partido,
    });
  } catch (error) {
    logger.error(`Error al cancelar partido ${req.params.idMatch}: ${error.message}`);
    next(error);
  }
};

/**
 * PATCH /api/partidos/:idMatch/estado - Cambiar estado de partido (creador/admin)
 */
const cambiarEstado = async (req, res, next) => {
  try {
    const { idMatch } = req.params;
    const idUsuario = req.usuario.id;
    const esAdmin = req.usuario.esAdmin || false;
    const { estado, motivoCancelacion } = req.validatedBody;

    const partido = await partidoService.cambiarEstadoPartido(
      idMatch,
      estado,
      idUsuario,
      esAdmin,
      motivoCancelacion
    );

    logger.info(`Estado del partido ${idMatch} cambiado a ${estado} por usuario ${idUsuario}`);

    res.json({
      ok: true,
      statusCode: 200,
      message: 'Estado del partido actualizado',
      data: partido,
    });
  } catch (error) {
    logger.error(`Error al cambiar estado: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/usuarios/:idUser/partidos-creados - Partidos creados por un usuario
 */
const obtenerPartidosCreadosPor = async (req, res, next) => {
  try {
    const { idUser } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const partidos = await partidoService.obtenerPartidosCreadosPor(idUser, page, limit);

    res.json({
      ok: true,
      statusCode: 200,
      message: 'Partidos creados obtenidos',
      data: partidos.rows,
      pagination: {
        total: partidos.count,
        pages: Math.ceil(partidos.count / limit),
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    logger.error(`Error al obtener partidos creados por ${req.params.idUser}: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/usuarios/:idUser/partidos-participando - Partidos donde user participa
 */
const obtenerPartidosParticipando = async (req, res, next) => {
  try {
    const { idUser } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const partidos = await partidoService.obtenerPartidosParticipando(idUser, page, limit);

    res.json({
      ok: true,
      statusCode: 200,
      message: 'Partidos participando obtenidos',
      data: partidos.rows,
      pagination: {
        total: partidos.count,
        pages: Math.ceil(partidos.count / limit),
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    logger.error(`Error al obtener partidos participando por ${req.params.idUser}: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/usuarios/:idUser/historial-partidos - Historial completo de partidos
 */
const obtenerHistorialPartidos = async (req, res, next) => {
  try {
    const { idUser } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const partidos = await partidoService.obtenerHistorialPartidos(idUser, page, limit);

    res.json({
      ok: true,
      statusCode: 200,
      message: 'Historial de partidos obtenido',
      data: partidos,
      pagination: {
        page,
        limit,
        totalRecords: partidos.length,
      },
    });
  } catch (error) {
    logger.error(`Error al obtener historial de ${req.params.idUser}: ${error.message}`);
    next(error);
  }
};

module.exports = {
  crearPartido,
  obtenerPartidos,
  obtenerPartidoPorId,
  obtenerCreador,
  obtenerParticipantes,
  unirsePartido,
  cancelarPartido,
  cambiarEstado,
  obtenerPartidosCreadosPor,
  obtenerPartidosParticipando,
  obtenerHistorialPartidos
};