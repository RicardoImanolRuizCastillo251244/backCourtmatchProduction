const partidoService = require('../services/partidoService');
const logger = require('../utils/logger');

/**
 * POST /api/partidos/programar - Crear nuevo partido (requiere auth)
 */
const crearPartido = async (req, res, next) => {
  try {
    const nuevoPartido = await partidoService.crearPartido(req.validatedBody);
    
    const io = req.app.get('socketio');
    if (io) {
      io.emit('nuevaReta', {
        mensaje: '¡Nueva reta programada!',
        detalles: {
          idLugar: nuevoPartido.idLugar,
          fecha: nuevoPartido.fecha,
          hora: nuevoPartido.hora,
          deporte: nuevoPartido.idDeporte,
        },
        timestamp: new Date(),
      });
    }

    logger.info(`Nuevo partido creado: ${nuevoPartido.idMatch}`);

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
 * GET /api/partidos - Obtener todos los partidos (requiere auth, con paginación)
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

module.exports = { crearPartido, obtenerPartidos };