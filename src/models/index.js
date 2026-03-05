const Jugador = require('./Jugador');
const Partido = require('./Partido');
const Participacion = require('./Participacion');
const Deporte = require('./Deporte');
const Lugar = require('./Lugar');

Deporte.hasMany(Jugador, { foreignKey: 'idDeporteFavorito' });
Jugador.belongsTo(Deporte, { foreignKey: 'idDeporteFavorito' });

Deporte.hasMany(Partido, { foreignKey: 'idDeporte' });
Partido.belongsTo(Deporte, { foreignKey: 'idDeporte' });

Jugador.belongsToMany(Partido, { through: Participacion, foreignKey: 'idUser' });
Partido.belongsToMany(Jugador, { through: Participacion, foreignKey: 'idMatch' });

Jugador.hasMany(Lugar, { foreignKey: 'idUser' });
Lugar.belongsTo(Jugador, { foreignKey: 'idUser' });

Deporte.hasMany(Lugar, { foreignKey: 'idDeporte' });
Lugar.belongsTo(Deporte, { foreignKey: 'idDeporte' });

module.exports = { Jugador, Partido, Participacion, Deporte, Lugar };