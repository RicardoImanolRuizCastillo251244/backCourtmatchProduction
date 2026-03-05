const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Partido = sequelize.define('Partido', {
    idMatch: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    idDeporte: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: {
            model: 'deportes', 
            key: 'idDeporte'
        }
    },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    hora: { type: DataTypes.TIME, allowNull: false },
    lugar: { type: DataTypes.STRING, allowNull: false },
    maxJugadores: { type: DataTypes.INTEGER, allowNull: false }
}, { 
    tableName: 'Partido', 
    timestamps: false 
});

module.exports = Partido;