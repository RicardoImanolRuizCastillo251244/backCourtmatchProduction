const { Deporte } = require('../models/index');

const crearDeporte = async (req, res) => {
    try {
        const { nombreDeporte } = req.body;

        if (!nombreDeporte) {
            return res.status(400).json({ error: 'El nombre del deporte es obligatorio' });
        }

        const nuevoDeporte = await Deporte.create({ nombreDeporte });
        
        res.status(201).json({
            mensaje: '¡Deporte agregado con éxito!',
            deporte: nuevoDeporte
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Este deporte ya existe en la base de datos.' });
        }
        console.error('Error en crearDeporte:', error);
        res.status(500).json({ error: 'Error al crear el deporte' });
    }
};

const obtenerDeportes = async (req, res) => {
    try {
        const deportes = await Deporte.findAll();
        res.json(deportes);
    } catch (error) {
        console.error('Error en obtenerDeportes:', error);
        res.status(500).json({ error: 'Error al obtener los deportes' });
    }
};

module.exports = { crearDeporte, obtenerDeportes };