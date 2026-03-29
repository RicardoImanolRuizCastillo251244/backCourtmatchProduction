const deporteService = require('../services/deporteService');
const logger = require('../utils/logger');

/**
 * GET /api/deportes - Obtener todos los deportes
 */
const obtenerDeportes = async (req, res, next) => {
  try {
    const deportes = await deporteService.obtenerDeportes();
    
    res.json({
      ok: true,
      statusCode: 200,
      message: 'Deportes obtenidos exitosamente',
      data: deportes,
    });
  } catch (error) {
    logger.error(`Error en obtenerDeportes: ${error.message}`);
    next(error);
  }
};

/**
 * POST /api/deportes - Crear deporte (NO PERMITIDO)
 */
const crearDeporte = async (req, res) => {
  res.status(405).json({
    ok: false,
    statusCode: 405,
    message: 'No se permite crear deportes. Estos datos son una colección predefinida.',
  });
};

module.exports = { crearDeporte, obtenerDeportes };