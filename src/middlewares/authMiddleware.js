const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { AuthenticationError } = require('../utils/errors');

// Validar que JWT_SECRET exista
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no está configurado en las variables de entorno');
}

/**
 * Middleware para verificar token JWT
 */
const verificarToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.warn(`Token no proporcionado para ${req.path}`);
      throw new AuthenticationError('Acceso denegado. No se proporcionó un token.');
    }

    const decodificado = jwt.verify(token, JWT_SECRET);
    req.usuario = decodificado;
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(error.statusCode).json({
        ok: false,
        statusCode: error.statusCode,
        message: error.message,
      });
    }

    if (error.name === 'TokenExpiredError') {
      logger.warn('Token expirado');
      return res.status(401).json({
        ok: false,
        statusCode: 401,
        message: 'Token expirado. Por favor inicia sesión nuevamente.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      logger.warn('Token inválido');
      return res.status(401).json({
        ok: false,
        statusCode: 401,
        message: 'Token inválido.',
      });
    }

    logger.error(`Error de autenticación: ${error.message}`);
    return res.status(401).json({
      ok: false,
      statusCode: 401,
      message: 'Token inválido o expirado.',
    });
  }
};

module.exports = { verificarToken };