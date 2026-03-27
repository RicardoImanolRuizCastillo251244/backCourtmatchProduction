const { Deporte } = require('../models/index');

const obtenerDeportes = async () => {
  return await Deporte.findAll();
};

module.exports = { obtenerDeportes };