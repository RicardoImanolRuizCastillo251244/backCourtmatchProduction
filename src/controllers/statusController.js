const { sequelize, Deporte, Jugador, Partido } = require('../models/index');
const logger = require('../utils/logger');

/**
 * GET /api/status - Verificar estado del servidor y base de datos
 */
const checkStatus = async (req, res, next) => {
  try {
    await sequelize.authenticate();

    const [totalDeportes, totalJugadores, totalPartidos] = await Promise.all([
      Deporte.count(),
      Jugador.count(),
      Partido.count(),
    ]);

    logger.info('Health check exitoso');

    res.status(200).json({
      ok: true,
      statusCode: 200,
      status: 'Conexión exitosa',
      database: 'MySQL Conectada (Sequelize)',
      timestamp: new Date().toISOString(),
      message: '¡Todo listo para las retas!',
      data: {
        estadisticas: {
          deportes: totalDeportes,
          jugadores: totalJugadores,
          partidos: totalPartidos,
        },
      },
    });
  } catch (error) {
    logger.error(`Error de conexión a la DB: ${error.message}`);
    
    res.status(500).json({
      ok: false,
      statusCode: 500,
      status: 'Error',
      database: 'Desconectada',
      timestamp: new Date().toISOString(),
      message: error.message,
    });
  }
};

module.exports = { checkStatus };