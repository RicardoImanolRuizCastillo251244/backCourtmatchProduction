const { Partido, Jugador, Deporte } = require('../models/index');

const crearPartido = async (payload) => {
  const { idDeporte, fecha, hora, lugar, maxJugadores } = payload;
  if (!idDeporte || !fecha || !hora || !lugar || !maxJugadores) throw new Error('Faltan datos: idDeporte, fecha, hora, lugar y maxJugadores son obligatorios');

  const partido = await Partido.create({ idDeporte, fecha, hora, lugar, maxJugadores });
  return partido;
};

const obtenerPartidos = async () => {
  return await Partido.findAll({
    include: [
      { model: Deporte, attributes: ['nombreDeporte'] },
      {
        model: Jugador,
        attributes: ['nombreUsuario'],
        through: { attributes: [] }
      }
    ]
  });
};

module.exports = { crearPartido, obtenerPartidos };