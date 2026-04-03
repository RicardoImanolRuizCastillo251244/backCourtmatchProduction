const authService = require('../services/authService');
const logger = require('../utils/logger');

/**
 * Login - POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { correo, contrasena } = req.body;
    const data = await authService.login({ correo, contrasena });

    res.json({
      ok: true,
      statusCode: 200,
      message: '¡Bienvenido a CourtMatch!',
      session: {
        token: data.token,
        refreshToken: data.refreshToken,
        user: {
          idUser: data.idUser,
          nombreUsuario: data.nombreUsuario,
        },
        expiresIn: data.expiresIn,
      },
      data: {
        token: data.token,
        refreshToken: data.refreshToken,
        idUser: data.idUser,
        nombreUsuario: data.nombreUsuario,
        expiresIn: data.expiresIn,
      },
    });
  } catch (error) {
    logger.error(`Error en login: ${error.message}`);
    next(error);
  }
};

/**
 * Refresh Token - POST /api/auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    const data = await authService.refreshAccessToken(token);

    res.json({
      ok: true,
      statusCode: 200,
      message: 'Token refrescado exitosamente',
      data: {
        token: data.token,
        expiresIn: data.expiresIn,
      },
    });
  } catch (error) {
    logger.error(`Error al refrescar token: ${error.message}`);
    next(error);
  }
};

module.exports = { login, refreshToken };