const { Jugador } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'clave_segura';

const login = async (req, res) => {
    try {
        const { nombreUsuario, contraseña } = req.body;

        const jugador = await Jugador.findOne({ where: { nombreUsuario } });

        if (!jugador) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const esValida = await bcrypt.compare(contraseña, jugador.contraseña);

        if (!esValida) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const token = jwt.sign(
            { id: jugador.idUser, usuario: jugador.nombreUsuario },
            JWT_SECRET,
            { expiresIn: '2h' } 
        );

        res.json({
            mensaje: '¡Bienvenido a CourtMatch! ',
            token: token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
    }
};

module.exports = { login };