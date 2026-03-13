const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Participacion = sequelize.define('Participacion', {
    idParticipacion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombreEquipo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    idUser: {
        type: DataTypes.INTEGER,
        references: { model: 'jugadores', key: 'idUser' }
    },
    idMatch: { 
        type: DataTypes.INTEGER,
        references: { model: 'partidos', key: 'idMatch' }
    }
}, {
    tableName: 'participaciones',
    timestamps: false
});

module.exports = Participacion;