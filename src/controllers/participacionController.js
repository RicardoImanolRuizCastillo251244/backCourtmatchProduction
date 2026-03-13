const { Participacion, Jugador, Partido } = require('../models/index');

const unirseAPartido = async (req, res) => {
    try {
        const { idUser, idMatch, nombreEquipo } = req.body;

        const jugador = await Jugador.findByPk(idUser);
        const partido = await Partido.findByPk(idMatch);

        if (!jugador || !partido) {
            return res.status(404).json({ error: 'Jugador o Partido no encontrado' });
        }

        const nuevaParticipacion = await Participacion.create({ idUser, idMatch, nombreEquipo });

        const io = req.app.get('socketio');
        if (io) {
            io.emit('jugadorUnido', {
                mensaje: `¡${jugador.nombreUsuario} se ha unido a la reta! `,
                lugar: partido.lugar,
                idMatch: idMatch
            });
        }

        res.status(201).json({
            mensaje: '¡Te has unido al partido con exito! ',
            detalle: nuevaParticipacion
        });
    } catch (error) {
        console.error('Error en unirseAPartido:', error);
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Ya estás inscrito en este partido.' });
        }

        res.status(500).json({ error: 'Error al procesar la unión', detalle: error.message });
    }
};

module.exports = { unirseAPartido };