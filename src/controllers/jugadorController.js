const jugadorService = require('../services/jugadorService');
const { Jugador, Partido, Deporte } = require('../models'); 

const registrar = async (req, res) => {
    try {
        const { nombreUsuario, correo, contraseña, ubicacion, idDeporteFavorito } = req.body;

        if (!nombreUsuario || !correo || !contraseña || !ubicacion || !idDeporteFavorito) {
            return res.status(400).json({ 
                error: 'Faltan datos. Asegúrate de enviar nombreUsuario, correo, contraseña, ubicacion e idDeporteFavorito.' 
            });
        }

        const jugador = await jugadorService.crearJugador(req.body);
        
        res.status(201).json({
            mensaje: 'Jugador creado con éxito',
            jugador: jugador
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'El usuario o el correo ya están registrados.' });
        }
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ error: 'El deporte seleccionado no existe en la base de datos.' });
        }
        res.status(400).json({ error: error.message });
    }
};

const obtenerJugadores = async (req, res) => {
    try {
        const jugadores = await Jugador.findAll({
            include: [{
                model: Deporte,
                attributes: ['nombreDeporte'] 
            }]
        }); 
        res.json(jugadores);
    } catch (error) {
        console.error(error);
        res.status(500).send('Hubo un error al obtener los jugadores');
    }
};

const obtenerMisPartidos = async (req, res) => {
    try {
        const { id } = req.params; 

        const jugador = await Jugador.findByPk(id, {
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
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los partidos del jugador' });
    }
};

module.exports = { 
    registrar, 
    obtenerJugadores,
    obtenerMisPartidos 
};