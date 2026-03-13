const { Lugar, Jugador, Deporte } = require('../models/index');

const crearLugar = async (req, res) => {
    try {
        const { nombre, direccion, idUser, idDeporte } = req.body;

        if (!nombre || !idUser || !idDeporte) {
            return res.status(400).json({ 
                error: 'Faltan datos. Asegúrate de enviar nombre, idUser e idDeporte.' 
            });
        }

        const nuevoLugar = await Lugar.create({nombre, direccion, idUser, idDeporte });
        
        res.status(201).json({
            mensaje: 'Lugar creado con exito',
            lugar: nuevoLugar
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Este lugar ya está registrado con esos datos.' });
        }
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ error: 'El usuario o el deporte seleccionado no existe en la base de datos.' });
        }
        console.error('Error al crear lugar:', error);
        res.status(400).json({ error: error.message });
    }
};

const obtenerLugares = async (req, res) => {
    try {
        const lugares = await Lugar.findAll({
            include: [
                {
                    model: Jugador,
                    attributes: ['nombreUsuario'] 
                },
                {
                    model: Deporte,
                    attributes: ['nombreDeporte'] 
                }
            ]
        }); 
        res.json(lugares);
    } catch (error) {
        console.error('Error al obtener lugares:', error);
        res.status(500).json({ error: 'Hubo un error al obtener los lugares' });
    }
};

const obtenerMisLugares = async (req, res) => {
    try {
        const { id } = req.params; 
        const jugadorLugares = await Lugar.findAll({
            where: { idUser: id },
            include: [{
                model: Deporte,
                attributes: ['nombreDeporte'] 
            }]
        });

        if (!jugadorLugares || jugadorLugares.length === 0) {
            return res.status(404).json({ error: 'No se encontraron lugares para este jugador' });
        }

        res.json({
            misLugares: jugadorLugares 
        });

    } catch (error) {
        console.error('Error al obtener mis lugares:', error);
        res.status(500).json({ error: 'Error al obtener los lugares del jugador' });
    }
};

module.exports = { crearLugar, obtenerLugares, obtenerMisLugares };