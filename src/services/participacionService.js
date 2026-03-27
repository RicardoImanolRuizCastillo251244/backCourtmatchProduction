const { Participacion, Jugador, Partido } = require('../models/index');

const unirseAPartido = async ({ idUser, idMatch, nombreEquipo }) => {
  if (!idUser || !idMatch) throw new Error('Faltan datos: idUser e idMatch son obligatorios');

  const jugador = await Jugador.findByPk(idUser);
  const partido = await Partido.findByPk(idMatch);

  if (!jugador || !partido) {
    const notFound = new Error('Jugador o Partido no encontrado');
    notFound.statusCode = 404;
    throw notFound;
  }

  const participacion = await Participacion.create({ idUser, idMatch, nombreEquipo });
  return { participacion, jugador, partido };
};

module.exports = { unirseAPartido };