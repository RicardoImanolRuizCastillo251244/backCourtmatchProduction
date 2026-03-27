const authService = require('../services/authService');

const login = async (req, res) => {
  try {
    const { nombreUsuario, contrasena } = req.body;
    const data = await authService.login({ nombreUsuario, contrasena });

    res.json({ mensaje: '¡Bienvenido a CourtMatch!', token: data.token, idUser: data.idUser });
  } catch (error) {
    console.error('Error en login:', error);
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message });
  }
};

module.exports = { login };