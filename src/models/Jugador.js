const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); 
const bcrypt = require('bcryptjs'); 

const Jugador = sequelize.define('Jugador', {
    idUser: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombreUsuario: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    correo: { 
        type: DataTypes.STRING,
        allowNull: false,
        unique: true 
    },
    contrasena: {
        type: DataTypes.STRING,
        allowNull: false
    },
    idUbicacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'lugares',
            key: 'idLugar'
        }
    },
    idDeporteFavorito: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'deportes',
            key: 'idDeporte'
        }
    }
}, {
    tableName: 'jugadores',
    timestamps: false,
    hooks: {
        beforeCreate: async (jugador) => {
            const salt = await bcrypt.genSalt(10);
            jugador.contrasena = await bcrypt.hash(jugador.contrasena, salt);
        }
    }
});

module.exports = Jugador;