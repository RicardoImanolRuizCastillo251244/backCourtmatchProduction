const sequelize = require('../config/db'); 
const Jugador = require('./Jugador');
const Partido = require('./Partido');
const Participacion = require('./Participacion');
const Deporte = require('./Deporte');
const Lugar = require('./Lugar');

// Relaciones: Deporte
Deporte.hasMany(Jugador, { foreignKey: 'idDeporteFavorito' });
Jugador.belongsTo(Deporte, { foreignKey: 'idDeporteFavorito' });

Deporte.hasMany(Partido, { foreignKey: 'idDeporte' });
Partido.belongsTo(Deporte, { foreignKey: 'idDeporte' });

// Relaciones: Lugar
Lugar.hasMany(Jugador, { foreignKey: 'idUbicacion' });
Jugador.belongsTo(Lugar, { foreignKey: 'idUbicacion' });

Lugar.hasMany(Partido, { foreignKey: 'idLugar' });
Partido.belongsTo(Lugar, { foreignKey: 'idLugar' });

// Relaciones: Creador de Partidos
Jugador.hasMany(Partido, { foreignKey: 'idCreador', as: 'PartidosCreadosPor' });
Partido.belongsTo(Jugador, { foreignKey: 'idCreador', as: 'Creador' });

// Relaciones: Participación (Many-to-Many)
Jugador.belongsToMany(Partido, { through: Participacion, foreignKey: 'idUser', otherKey: 'idMatch' });
Partido.belongsToMany(Jugador, { through: Participacion, foreignKey: 'idMatch', otherKey: 'idUser' });

// Relaciones directas de Participacion
Participacion.belongsTo(Jugador, { foreignKey: 'idUser', as: 'Jugador' });
Jugador.hasMany(Participacion, { foreignKey: 'idUser' });

Participacion.belongsTo(Partido, { foreignKey: 'idMatch', as: 'Partido' });
Partido.hasMany(Participacion, { foreignKey: 'idMatch' });

module.exports = { sequelize, Jugador, Partido, Participacion, Deporte, Lugar };