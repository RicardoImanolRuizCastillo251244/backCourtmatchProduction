const { Jugador, Deporte, Partido, Lugar } = require('../models/index');
const { ValidationError, ConflictError, NotFoundError } = require('../utils/errors');

/**
 * Crear un nuevo jugador
 */
const crearJugador = async (userData) => {
  // Validar datos obligatorios
  if (!userData.nombreUsuario || !userData.correo || !userData.contrasena || !userData.idUbicacion || !userData.idDeporteFavorito) {
    throw new ValidationError('Faltan datos obligatorios para crear un jugador');
  }

  // Validar formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userData.correo)) {
    throw new ValidationError('Correo electrónico no válido. Debe contener un @ y un dominio válido.', 'correo');
  }

  // Validar longitud de contraseña
  if (userData.contrasena.length < 8) {
    throw new ValidationError('La contraseña debe tener al menos 8 caracteres.', 'contrasena');
  }

  // Verificar si el usuario o correo ya existen
  const usuarioExistente = await Jugador.findOne({
    where: { nombreUsuario: userData.nombreUsuario },
  });

  if (usuarioExistente) {
    throw new ConflictError('El nombre de usuario ya está registrado.', 'nombreUsuario');
  }

  const correoExistente = await Jugador.findOne({
    where: { correo: userData.correo },
  });

  if (correoExistente) {
    throw new ConflictError('El correo ya está registrado.', 'correo');
  }

  // Verificar que la ubicación existe
  const ubicacionExiste = await Lugar.findByPk(userData.idUbicacion);
  if (!ubicacionExiste) {
    throw new NotFoundError('Ubicación', userData.idUbicacion);
  }

  // Verificar que el deporte existe
  const deporteExiste = await Deporte.findByPk(userData.idDeporteFavorito);
  if (!deporteExiste) {
    throw new NotFoundError('Deporte', userData.idDeporteFavorito);
  }

  // Crear jugador
  const nuevoJugador = await Jugador.create(userData);
  return nuevoJugador;
};

/**
 * Obtener todos los jugadores con paginación
 */
const obtenerJugadores = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const jugadores = await Jugador.findAndCountAll({
    attributes: { exclude: ['contrasena'] },
    include: [
      { model: Deporte, attributes: ['idDeporte', 'nombreDeporte'] },
      { model: Lugar, attributes: ['idLugar', 'nombre'] },
    ],
    limit,
    offset,
    order: [['idUser', 'DESC']],
  });

  return jugadores;
};

/**
 * Obtener partidos de un jugador específico
 */
const obtenerMisPartidos = async (id) => {
  const jugador = await Jugador.findByPk(id, {
    attributes: ['idUser', 'nombreUsuario'],
    include: [
      {
        model: Partido,
        through: { attributes: [] },
        attributes: ['idMatch', 'idDeporte', 'fecha', 'hora', 'lugar', 'maxJugadores'],
      },
    ],
  });

  return jugador;
};

module.exports = { crearJugador, obtenerJugadores, obtenerMisPartidos };