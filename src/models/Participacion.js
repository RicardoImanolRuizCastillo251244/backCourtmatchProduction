const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Participacion = sequelize.define('Participacion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombreEquipo: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'participaciones',
    timestamps: false
});

module.exports = Participacion;