const lugarService = require('../services/lugarService');
const logger = require('../utils/logger');

/**
 * GET /api/lugares/listar - Obtener todos los lugares
 */
const obtenerLugares = async (req, res, next) => {
  try {
    const lugares = await lugarService.obtenerLugares();
    
    res.json({
      ok: true,
      statusCode: 200,
      message: 'Lugares obtenidos exitosamente',
      data: lugares,
    });
  } catch (error) {
    logger.error(`Error al obtener lugares: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/lugares/:idLugar - Obtener un lugar específico
 */
const obtenerLugarPorId = async (req, res, next) => {
  try {
    const { idLugar } = req.params;
    const lugar = await lugarService.obtenerLugarPorId(idLugar);

    if (!lugar) {
      return res.status(404).json({
        ok: false,
        statusCode: 404,
        message: 'Lugar no encontrado',
      });
    }

    res.json({
      ok: true,
      statusCode: 200,
      message: 'Lugar obtenido exitosamente',
      data: lugar,
    });
  } catch (error) {
    logger.error(`Error al obtener lugar: ${error.message}`);
    next(error);
  }
};

/**
 * POST /api/lugares - Crear lugar (NO PERMITIDO)
 */
const crearLugar = async (req, res) => {
  res.status(405).json({
    ok: false,
    statusCode: 405,
    message: 'No se permite crear lugares. Lugar es una colección de referencia.',
  });
};

module.exports = { crearLugar, obtenerLugares, obtenerLugarPorId };