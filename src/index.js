const { server } = require("./app");
const sequelize = require("./config/db");
require("./models/index");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Conexion a MySQL establecida correctamente.");

    // En src/index.js
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: true });
      console.log("Base de datos sincronizada correctamente.");
    } else {
      // En producción solo verificamos la conexión, no alteramos tablas
      await sequelize.authenticate();
      console.log("Conexión de producción verificada.");
    }

    server.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto: ${PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
  }
}

startServer();
