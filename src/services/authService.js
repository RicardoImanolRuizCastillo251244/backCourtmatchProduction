const { Jugador } = require('../models/index');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'clave_segura';

const login = async ({ nombreUsuario, contrasena }) => {
  if (!nombreUsuario || !contrasena) {
    const error = new Error('Usuario y contraseña son obligatorios');
    error.statusCode = 400;
    throw error;
  }

  if (typeof nombreUsuario !== 'string' || nombreUsuario.trim().length < 3) {
    const error = new Error('El nombre de usuario debe tener al menos 3 caracteres');
    error.statusCode = 400;
    throw error;
  }

  if (typeof contrasena !== 'string' || contrasena.length < 8) {
    const error = new Error('La contraseña debe tener al menos 8 caracteres');
    error.statusCode = 400;
    throw error;
  }

  const jugador = await Jugador.findOne({ where: { nombreUsuario } });
  if (!jugador) {
    const error = new Error('Usuario o contraseña incorrectos');
    error.statusCode = 401;
    throw error;
  }

  const esValida = await bcrypt.compare(contrasena, jugador.contrasena);
  if (!esValida) {
    const error = new Error('Usuario o contraseña incorrectos');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign({ id: jugador.idUser, usuario: jugador.nombreUsuario }, JWT_SECRET, { expiresIn: '2h' });
  return { token, idUser: jugador.idUser, nombreUsuario: jugador.nombreUsuario };
};

module.exports = { login };