const { sequelize } = require('../models/index');

const checkStatus = async (req, res) => {
    try {
        await sequelize.authenticate();
        
        res.status(200).json({
            status: "Conexión exitosa",
            database: "MySQL Conectada (Sequelize)",
            timestamp: new Date(),
            mensaje: "¡Todo listo para las retas! "
        });
    } catch (error) {
        console.error('Error de conexión a la DB:', error);
        res.status(500).json({
            status: "Error",
            database: "Desconectada",
            detalle: error.message,
            timestamp: new Date()
        });
    }
};

module.exports = { checkStatus };