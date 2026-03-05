const { Jugador } = require('../models');

const crearJugador = async (userData) => {
   
    const nuevoJugador = await Jugador.create(userData);
    
    return nuevoJugador;
};

module.exports = { crearJugador };