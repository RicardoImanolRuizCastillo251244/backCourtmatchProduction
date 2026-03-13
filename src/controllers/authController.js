const { Jugador } = require('../models/index');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'clave_segura';

const login = async (req, res) => {
    try {
        const { nombreUsuario, contrasena } = req.body; 

        const jugador = await Jugador.findOne({ where: { nombreUsuario } });

        if (!jugador) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const esValida = await bcrypt.compare(contrasena, jugador.contrasena);

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
            token: token,
            idUser: jugador.idUser
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
    }
};

module.exports = { login };