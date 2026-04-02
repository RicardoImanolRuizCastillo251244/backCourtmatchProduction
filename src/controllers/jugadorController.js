const jugadorService = require('../services/jugadorService');
const logger = require('../utils/logger');

/**
 * POST /api/jugadores/registro - Registrar nuevo jugador
 */
const registrar = async (req, res, next) => {
  try {
    const jugador = await jugadorService.crearJugador(req.validatedBody);
    
    const io = req.app.get('socketio');
    if (io) {
      // Emitir solo campos públicos y necesarios
      io.emit('nuevoJugador', {
        mensaje: `¡Bienvenido a CourtMatch, ${jugador.nombreUsuario}!`,
        usuario: jugador.nombreUsuario,
        timestamp: new Date(),
      });
    }

    logger.info(`Nuevo jugador registrado: ${jugador.nombreUsuario}`);

    res.status(201).json({
      ok: true,
      statusCode: 201,
      message: 'Jugador creado exitosamente',
      data: {
        idUser: jugador.idUser,
        nombreUsuario: jugador.nombreUsuario,
        correo: jugador.correo,
      },
    });
  } catch (error) {
    logger.error(`Error al registrar jugador: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/jugadores - Obtener todos los jugadores (con paginación)
 */
const obtenerJugadores = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const jugadores = await jugadorService.obtenerJugadores(page, limit);

    res.json({
      ok: true,
      statusCode: 200,
      message: 'Jugadores obtenidos exitosamente',
      data: jugadores.rows,
      pagination: {
        total: jugadores.count,
        pages: Math.ceil(jugadores.count / limit),
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    logger.error(`Error al obtener jugadores: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/jugadores/:id/partidos - Obtener partidos de un jugador
 */
const obtenerMisPartidos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const jugador = await jugadorService.obtenerMisPartidos(id);

    if (!jugador) {
      return res.status(404).json({
        ok: false,
        statusCode: 404,
        message: 'Jugador no encontrado',
      });
    }

    res.json({
      ok: true,
      statusCode: 200,
      message: 'Partidos obtenidos exitosamente',
      data: {
        jugador: jugador.nombreUsuario,
        partidos: jugador.Partidos,
      },
    });
  } catch (error) {
    logger.error(`Error al obtener partidos del jugador: ${error.message}`);
    next(error);
  }
};

/**
 * PATCH /api/jugadores/perfil - Actualizar nombre de perfil del usuario autenticado
 */
const actualizarPerfil = async (req, res, next) => {
  try {
    const idUsuario = req.usuario.id;
    const perfil = await jugadorService.actualizarPerfil(idUsuario, req.validatedBody);

    logger.info(`Perfil actualizado para usuario ${idUsuario}`);

    res.json({
      ok: true,
      statusCode: 200,
      message: 'Perfil actualizado exitosamente',
      data: perfil,
    });
  } catch (error) {
    logger.error(`Error al actualizar perfil: ${error.message}`);
    next(error);
  }
};

/**
 * PATCH /api/jugadores/contrasena - Cambiar contraseña del usuario autenticado
 */
const cambiarContrasena = async (req, res, next) => {
  try {
    const idUsuario = req.usuario.id;
    await jugadorService.cambiarContrasena(idUsuario, req.validatedBody);

    logger.info(`Contraseña actualizada para usuario ${idUsuario}`);

    res.json({
      ok: true,
      statusCode: 200,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error) {
    logger.error(`Error al cambiar contraseña: ${error.message}`);
    next(error);
  }
};

module.exports = {
  registrar,
  obtenerJugadores,
  obtenerMisPartidos,
  actualizarPerfil,
  cambiarContrasena,
};