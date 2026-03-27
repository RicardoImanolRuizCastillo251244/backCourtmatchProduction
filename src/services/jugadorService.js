const { Jugador, Deporte, Partido, Lugar } = require('../models/index');

const crearJugador = async (userData) => {
  if (!userData.nombreUsuario || !userData.correo || !userData.contrasena || !userData.idUbicacion || !userData.idDeporteFavorito) {
    throw new Error('Faltan datos obligatorios para crear un jugador');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userData.correo)) {
    const error = new Error('Correo electrónico no válido. Debe contener un @ y un dominio válido.');
    error.statusCode = 400;
    throw error;
  }

  if (userData.contrasena.length < 8) {
    const error = new Error('La contraseña debe tener al menos 8 caracteres.');
    error.statusCode = 400;
    throw error;
  }

  const nuevoJugador = await Jugador.create(userData);
  return nuevoJugador;
};

const obtenerJugadores = async () => {
  return await Jugador.findAll({
    attributes: { exclude: ['contrasena'] },
    include: [
      { model: Deporte, attributes: ['nombreDeporte'] },
      { model: Lugar, attributes: ['nombre'] }
    ]
  });
};

const obtenerMisPartidos = async (id) => {
  const jugador = await Jugador.findByPk(id, {
    attributes: ['nombreUsuario'],
    include: [{ model: Partido, through: { attributes: [] } }]
  });

  return jugador;
};

module.exports = { crearJugador, obtenerJugadores, obtenerMisPartidos };