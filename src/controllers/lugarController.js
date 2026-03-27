const lugarService = require('../services/lugarService');

const obtenerLugares = async (req, res) => {
  try {
    const lugares = await lugarService.obtenerLugares();
    res.json(lugares);
  } catch (error) {
    console.error('Error al obtener lugares:', error);
    res.status(500).json({ error: 'Hubo un error al obtener los lugares' });
  }
};

const obtenerLugarPorId = async (req, res) => {
  try {
    const { idLugar } = req.params;
    const lugar = await lugarService.obtenerLugarPorId(idLugar);

    if (!lugar) {
      return res.status(404).json({ error: 'Lugar no encontrado' });
    }

    res.json(lugar);
  } catch (error) {
    console.error('Error al obtener lugar:', error);
    res.status(500).json({ error: 'Error al obtener el lugar' });
  }
};

const crearLugar = async (req, res) => {
  res.status(405).json({ error: 'No se permite crear lugares. Lugar es una colección de referencia.' });
};

module.exports = { crearLugar, obtenerLugares, obtenerLugarPorId };