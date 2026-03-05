const { Participacion, Jugador, Partido } = require('../models');

const inscribirJugador = async (req, res) => {
    try {
        const { idUser, idMatch, nombreEquipo } = req.body;

        const jugador = await Jugador.findByPk(idUser);
        const partido = await Partido.findByPk(idMatch);

        if (!jugador || !partido) {
            return res.status(404).json({ error: 'Jugador o Partido no encontrado' });
        }

        const nuevaParticipacion = await Participacion.create({
            idUser,
            idMatch,
            nombreEquipo
        });

        res.status(201).json({
            mensaje: '¡Jugador inscrito al partido!',
            detalle: nuevaParticipacion
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { inscribirJugador };