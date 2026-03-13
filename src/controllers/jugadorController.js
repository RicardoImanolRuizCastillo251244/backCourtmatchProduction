const jugadorService = require('../services/jugadorService');
const { Jugador, Partido, Deporte } = require('../models/index'); 

const registrar = async (req, res) => {
    try {
        const { nombreUsuario, correo, contrasena, ubicacion, idDeporteFavorito } = req.body;

        if (!nombreUsuario || !correo || !contrasena || !ubicacion || !idDeporteFavorito) {
            return res.status(400).json({ 
                error: 'Faltan datos. Asegúrate de enviar nombreUsuario, correo, contrasena, ubicacion e idDeporteFavorito.' 
            });
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
        console.error('Error al registrar:', error);
        res.status(400).json({ error: error.message });
    }
};

const obtenerJugadores = async (req, res) => {
    try {
        const jugadores = await Jugador.findAll({
            attributes: { exclude: ['contrasena'] }, 
            include: [{
                model: Deporte,
                attributes: ['nombreDeporte'] 
            }]
        }); 
        res.json(jugadores);
    } catch (error) {
        console.error('Error al obtener jugadores:', error);
        res.status(500).json({ error: 'Hubo un error al obtener los jugadores' });
    }
};

const obtenerMisPartidos = async (req, res) => {
    try {
        const { id } = req.params; 

        const jugador = await Jugador.findByPk(id, {
            attributes: ['nombreUsuario'],
            include: [{
                model: Partido,
                through: { attributes: [] } 
            }]
        });

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