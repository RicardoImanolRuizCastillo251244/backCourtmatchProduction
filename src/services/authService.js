const { Jugador } = require('../models/index');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ValidationError, AuthenticationError } = require('../utils/errors');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const JWT_EXPIRE_TIME = process.env.JWT_EXPIRE_TIME || '20m';
const REFRESH_TOKEN_EXPIRE_TIME = process.env.REFRESH_TOKEN_EXPIRE_TIME || '7d';

// Validar que los secrets existan
if (!JWT_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error('JWT_SECRET y REFRESH_TOKEN_SECRET deben estar configurados en las variables de entorno');
}

/**
 * Realizar login
 */
const login = async ({ correo, contrasena }) => {
  // Validaciones básicas
  if (!correo || !contrasena) {
    throw new ValidationError('Correo y contraseña son obligatorios');
  }

  if (typeof correo !== 'string' || !correo.includes('@')) {
    throw new ValidationError('El correo debe ser válido', 'correo');
  }

  if (typeof contrasena !== 'string' || contrasena.length < 8) {
    throw new ValidationError('La contraseña debe tener al menos 8 caracteres', 'contrasena');
  }

  // Buscar jugador
  const jugador = await Jugador.findOne({ where: { correo } });
  if (!jugador) {
    logger.warn(`Intento de login fallido: correo no encontrado - ${correo}`);
    throw new AuthenticationError('Correo o contraseña incorrectos');
  }

  // Verificar contraseña
  const esValida = await bcrypt.compare(contrasena, jugador.contrasena);
  if (!esValida) {
    logger.warn(`Intento de login fallido: contraseña incorrecta - ${correo}`);
    throw new AuthenticationError('Correo o contraseña incorrectos');
  }

  // Crear token de acceso
  const token = jwt.sign(
    { id: jugador.idUser, usuario: jugador.nombreUsuario },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE_TIME }
  );

  // Crear refresh token
  const refreshToken = jwt.sign(
    { id: jugador.idUser, tipo: 'refresh' },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRE_TIME }
  );

  logger.info(`Login exitoso: ${correo}`);

  return {
    token,
    refreshToken,
    idUser: jugador.idUser,
    nombreUsuario: jugador.nombreUsuario,
    expiresIn: JWT_EXPIRE_TIME,
  };
};

/**
 * Refrescar token de acceso
 */
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AuthenticationError('Refresh token requerido');
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    const jugador = await Jugador.findByPk(decoded.id);
    if (!jugador) {
      throw new AuthenticationError('Usuario no encontrado');
    }

    const newToken = jwt.sign(
      { id: jugador.idUser, usuario: jugador.nombreUsuario },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE_TIME }
    );

    logger.info(`Token refrescado para usuario: ${jugador.nombreUsuario}`);

    return {
      token: newToken,
      expiresIn: JWT_EXPIRE_TIME,
    };
  } catch (error) {
    logger.warn(`Error al refrescar token: ${error.message}`);
    throw new AuthenticationError('Refresh token inválido o expirado');
  }
};

module.exports = { login, refreshAccessToken };