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
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'lugares',
  timestamps: false
});

module.exports = Lugar;