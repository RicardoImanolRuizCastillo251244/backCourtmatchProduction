const { server } = require("./app");
const sequelize = require("./config/db");
require("./models/index");

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Conexion establecida.');

        // Cambia la condición temporalmente a esto:
        await sequelize.sync({ alter: true }); 
        console.log('Tablas creadas en Railway.');

        server.listen(PORT, () => {
            console.log(`Corriendo en puerto: ${PORT}`);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

startServer();
