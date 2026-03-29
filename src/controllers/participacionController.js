const participacionService = require('../services/participacionService');
const logger = require('../utils/logger');

/**
 * POST /api/participaciones/inscribir - Inscribir a un jugador en un partido
 */
const unirseAPartido = async (req, res, next) => {
  try {
    const { idUser, idMatch, nombreEquipo } = req.validatedBody;

    const { participacion, jugador, partido } = await participacionService.unirseAPartido({
      idUser,
      idMatch,
      nombreEquipo,
    });

    const io = req.app.get('socketio');
    if (io) {
      io.emit('jugadorUnido', {
        mensaje: `¡${jugador.nombreUsuario} se ha unido a la reta!`,
        lugar: partido.lugar,
        idMatch: idMatch,
        timestamp: new Date(),
      });
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
        },
      },
    });
  } catch (error) {
    logger.error(`Error en unirseAPartido: ${error.message}`);
    next(error);
  }
};

module.exports = { unirseAPartido };