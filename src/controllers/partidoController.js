const partidoService = require('../services/partidoService');

const crearPartido = async (req, res) => {
  try {
    const nuevoPartido = await partidoService.crearPartido(req.body);
    const io = req.app.get('socketio');
    if (io) {
      io.emit('nuevaReta', {
        mensaje: '¡Nueva reta programada!',
        detalles: {
          lugar: nuevoPartido.lugar,
          fecha: nuevoPartido.fecha,
          hora: nuevoPartido.hora
        }
      });
    }

    res.status(201).json({ mensaje: '¡Partido programado con éxito!', partido: nuevoPartido });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: 'El deporte seleccionado no existe en la base de datos.' });
    }
    console.error('Error al crear partido:', error);
    res.status(400).json({ error: error.message });
  }
};

const obtenerPartidos = async (req, res) => {
  try {
    const partidos = await partidoService.obtenerPartidos();
    res.json(partidos);
  } catch (error) {
    console.error('Error al obtener partidos:', error);
    res.status(500).json({ error: 'Error al obtener los partidos', detalle: error.message });
  }
};

module.exports = { crearPartido, obtenerPartidos };