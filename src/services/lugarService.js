const { Lugar } = require('../models/index');

const obtenerLugares = async () => {
  return await Lugar.findAll();
};

const obtenerLugarPorId = async (idLugar) => {
  return await Lugar.findByPk(idLugar);
};

module.exports = { obtenerLugares, obtenerLugarPorId };