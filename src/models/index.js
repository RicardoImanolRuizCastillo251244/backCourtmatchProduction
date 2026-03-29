const sequelize = require('../config/db'); 
const Jugador = require('./Jugador');
const Partido = require('./Partido');
const Participacion = require('./Participacion');
const Deporte = require('./Deporte');
const Lugar = require('./Lugar');

Deporte.hasMany(Jugador, { foreignKey: 'idDeporteFavorito' });
Jugador.belongsTo(Deporte, { foreignKey: 'idDeporteFavorito' });

Deporte.hasMany(Partido, { foreignKey: 'idDeporte' });
Partido.belongsTo(Deporte, { foreignKey: 'idDeporte' });

Lugar.hasMany(Jugador, { foreignKey: 'idUbicacion' });
Jugador.belongsTo(Lugar, { foreignKey: 'idUbicacion' });

Lugar.hasMany(Partido, { foreignKey: 'idLugar' });
Partido.belongsTo(Lugar, { foreignKey: 'idLugar' });

Jugador.belongsToMany(Partido, { through: Participacion, foreignKey: 'idUser', otherKey: 'idMatch' });
Partido.belongsToMany(Jugador, { through: Participacion, foreignKey: 'idMatch', otherKey: 'idUser' });

module.exports = { sequelize, Jugador, Partido, Participacion, Deporte, Lugar };