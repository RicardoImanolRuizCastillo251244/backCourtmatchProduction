const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Lugar = sequelize.define('Lugar', {
    idLugar: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    direccion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    idUser: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'jugadores', 
            key: 'idUser'
        }
    },
    idDeporte: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'deportes',
            key: 'idDeporte'
        }
    }
}, {
    tableName: 'lugares',
    timestamps: true
});

module.exports = Lugar;