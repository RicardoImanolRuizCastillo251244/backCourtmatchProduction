const Lugar = require('../models/Lugar');
const Jugador = require('../models/Jugador');
const Deporte = require('../models/Deporte');

console.log("Revisando Lugar:", Lugar);

const crearLugar = async (req, res) => {
    try {
        const { nombre, direccion, idUser, idDeporte } = req.body;

        // Validación siguiendo tu estructura
        if (!nombre || !idUser || !idDeporte) {
            return res.status(400).json({ 
                error: 'Faltan datos. Asegúrate de enviar nombre, idUser e idDeporte.' 
            });
        }

        const nuevoLugar = await Lugar.create({
            nombre,
            direccion,
            idUser,
            idDeporte
        });
        
        res.status(201).json({
            mensaje: 'Lugar creado con éxito',
            lugar: nuevoLugar
        });
    } catch (error) {
        // Manejo de errores de Sequelize igual que en tu controlador
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Este lugar ya está registrado con esos datos.' });
        }
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ error: 'El usuario o el deporte seleccionado no existe en la base de datos.' });
        }
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
                    // Uso 'nombreDeporte' guiándome por cómo lo llamaste en jugadorController
                    attributes: ['nombreDeporte'] 
                }
            ]
        }); 
        res.json(lugares);
    } catch (error) {
        console.error(error);
        res.status(500).send('Hubo un error al obtener los lugares');
    }
};

// Función extra basada en tu lógica para obtener los lugares de un usuario específico
const obtenerMisLugares = async (req, res) => {
    try {
        const { id } = req.params; // ID del jugador

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
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los lugares del jugador' });
    }
};

module.exports.crearLugar = crearLugar;
module.exports.obtenerLugares = obtenerLugares;
module.exports.obtenerMisLugares = obtenerMisLugares;