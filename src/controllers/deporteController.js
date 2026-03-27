const deporteService = require('../services/deporteService');

const obtenerDeportes = async (req, res) => {
  try {
    const deportes = await deporteService.obtenerDeportes();
    res.json(deportes);
  } catch (error) {
    console.error('Error en obtenerDeportes:', error);
    res.status(500).json({ error: 'Error al obtener los deportes' });
  }
};

const crearDeporte = async (req, res) => {
  res.status(405).json({ error: 'No se permite crear deportes. Estos datos son una colección predefinida.' });
};

module.exports = { crearDeporte, obtenerDeportes };