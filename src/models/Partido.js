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
    fecha: { 
        type: DataTypes.DATEONLY, 
        allowNull: false,
        validate: {
            isDate: true,
            isFuture(value) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (new Date(value) < today) {
                    throw new Error('La fecha no puede ser en el pasado');
                }
            }
        }
    },
    hora: { 
        type: DataTypes.TIME, 
        allowNull: false
    },
    idLugar: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'lugares',
            key: 'idLugar'
        }
    },
    maxJugadores: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        validate: {
            min: 2,
            max: 100
        }
    }
}, { 
    tableName: 'partidos',
    timestamps: false 
});

module.exports = Partido;