const jugadorService = require('../services/jugadorService');

const registrar = async (req, res) => {
  try {
    const { idUbicacion } = req.body;
    if (!idUbicacion) {
      return res.status(400).json({ error: 'idUbicacion es obligatorio' });
    }

    const jugador = await jugadorService.crearJugador(req.body);
    const io = req.app.get('socketio');
    if (io) {
      io.emit('nuevoJugador', {
        mensaje: `¡Bienvenido a CourtMatch, ${jugador.nombreUsuario}!`,
        usuario: jugador.nombreUsuario
      });
    }

    res.status(201).json({
      mensaje: 'Jugador creado con éxito',
      jugador: {
        idUser: jugador.idUser,
        nombreUsuario: jugador.nombreUsuario,
        correo: jugador.correo
      }
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'El usuario o el correo ya están registrados.' });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: 'El deporte seleccionado no existe en la base de datos.' });
    }
    const status = error.statusCode || 400;
    console.error('Error al registrar:', error);
    res.status(status).json({ error: error.message });
  }
};

const obtenerJugadores = async (req, res) => {
  try {
    const jugadores = await jugadorService.obtenerJugadores();
    res.json(jugadores);
  } catch (error) {
    console.error('Error al obtener jugadores:', error);
    res.status(500).json({ error: 'Hubo un error al obtener los jugadores' });
  }
};

const obtenerMisPartidos = async (req, res) => {
  try {
    const { id } = req.params;
    const jugador = await jugadorService.obtenerMisPartidos(id);

    if (!jugador) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }

    res.json({
      jugador: jugador.nombreUsuario,
      misPartidos: jugador.Partidos
    });
  } catch (error) {
    console.error('Error al obtener partidos:', error);
    res.status(500).json({ error: 'Error al obtener los partidos del jugador' });
  }
};

module.exports = { registrar, obtenerJugadores, obtenerMisPartidos };