const participacionService = require('../services/participacionService');

const unirseAPartido = async (req, res) => {
  try {
    const { idUser, idMatch, nombreEquipo } = req.body;

    const { participacion, jugador, partido } = await participacionService.unirseAPartido({ idUser, idMatch, nombreEquipo });
    const io = req.app.get('socketio');
    if (io) {
      io.emit('jugadorUnido', {
        mensaje: `¡${jugador.nombreUsuario} se ha unido a la reta! `,
        lugar: partido.lugar,
        idMatch: idMatch
      });
    }

    res.status(201).json({ mensaje: '¡Te has unido al partido con exito! ', detalle: participacion });
  } catch (error) {
    console.error('Error en unirseAPartido:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya estás inscrito en este partido.' });
    }

    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message, detalle: error.message });
  }
};

module.exports = { unirseAPartido };