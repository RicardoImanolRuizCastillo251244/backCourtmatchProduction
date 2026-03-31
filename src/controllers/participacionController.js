const participacionService = require('../services/participacionService');
const logger = require('../utils/logger');

/**
 * POST /api/participaciones/inscribir - Inscribir a un jugador en un partido
 */
const unirseAPartido = async (req, res, next) => {
  try {
    const { idUser, idMatch, nombreEquipo } = req.validatedBody;

    const { participacion, jugador, partido, resumenCupos } = await participacionService.unirseAPartido({
      idUser,
      idMatch,
      nombreEquipo,
    });

    const io = req.app.get('socketio');
    if (io) {
      const payload = {
        mensaje: `¡${jugador.nombreUsuario} se ha unido a la reta!`,
        lugar: partido.lugar,
        idMatch: idMatch,
        timestamp: new Date(),
      };

      // Emitir preferentemente a la sala del partido y emitir un fallback global resumen
      io.to(`partido_${idMatch}`).emit('jugadorUnido', payload);
      io.emit('partidosEstadoActualizado', { idsMatch: [idMatch], timestamp: new Date() });
    }

    logger.info(`Jugador ${jugador.nombreUsuario} inscrito en partido ${idMatch}`);

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
    logger.error(`Error en unirseAPartido: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/participaciones/:idMatch - Obtener participaciones y cupos de un partido
 */
const obtenerParticipacionesPorPartido = async (req, res, next) => {
  try {
    const idMatch = parseInt(req.params.idMatch, 10);
    const resultado = await participacionService.obtenerParticipacionesPorPartido(idMatch);

    res.json({
      ok: true,
      statusCode: 200,
      message: 'Participaciones obtenidas exitosamente',
      data: resultado,
    });
  } catch (error) {
    logger.error(`Error al obtener participaciones del partido ${req.params.idMatch}: ${error.message}`);
    next(error);
  }
};

/**
 * DELETE /api/participaciones/:idParticipacion - Cancelar asistencia propia
 */
const cancelarAsistencia = async (req, res, next) => {
  try {
    const idParticipacion = parseInt(req.params.idParticipacion, 10);
    const idUsuario = req.usuario.id;

    const resultado = await participacionService.cancelarAsistencia(idParticipacion, idUsuario);

    logger.info(`Usuario ${idUsuario} canceló su asistencia (participación ${idParticipacion})`);

    res.json({
      ok: true,
      statusCode: 200,
      message: resultado.mensaje,
    });
  } catch (error) {
    logger.error(`Error al cancelar asistencia ${req.params.idParticipacion}: ${error.message}`);
    next(error);
  }
};

module.exports = { unirseAPartido, obtenerParticipacionesPorPartido, cancelarAsistencia };