const { Partido, Jugador, Deporte } = require('../models/index');

const crearPartido = async (req, res) => {
    try {
        const { idDeporte, fecha, hora, lugar, maxJugadores } = req.body;
        if (!idDeporte || !fecha || !hora || !lugar || !maxJugadores) {
            return res.status(400).json({
                error: 'Faltan datos. Asegúrate de enviar idDeporte, fecha, hora, lugar y maxJugadores.'
            });
        }

        const nuevoPartido = await Partido.create({ idDeporte, fecha, hora, lugar, maxJugadores });
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
        
        res.status(201).json({
            mensaje: '¡Partido programado con éxito!',
            partido: nuevoPartido
        });
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
        const partidos = await Partido.findAll({
            include: [
                {
                    model: Deporte,
                    attributes: ['nombreDeporte'] 
                },
                {
                    model: Jugador,
                    attributes: ['nombreUsuario'], 
                    through: { 
                        attributes: []
                    }
                }
            ]
        });
        res.json(partidos);
    } catch (error) {
        console.error('Error al obtener partidos:', error);
        res.status(500).json({ 
            error: 'Error al obtener los partidos',
            detalle: error.message 
        });
    }
};

module.exports = { crearPartido, obtenerPartidos };