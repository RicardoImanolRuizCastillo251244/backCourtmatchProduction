const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Deporte = sequelize.define('Deporte', {
    idDeporte: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombreDeporte: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true 
    }
}, {
    tableName: 'deportes',
    timestamps: false
});

module.exports = Deporte;