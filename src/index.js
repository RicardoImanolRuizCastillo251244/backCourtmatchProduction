require('dotenv').config();
const { server } = require('./app');
const sequelize = require('./config/db');
const logger = require('./utils/logger');
require('./models/index');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    logger.info('Iniciando servidor...');

    // Verificar conexión a base de datos
    await sequelize.authenticate();
    logger.info('Conexión a MySQL establecida correctamente');

    // Sincronizar modelos según el ambiente
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Ejecutando en DESARROLLO - Sincronizando base de datos');
      await sequelize.sync({ alter: true });
      logger.info('Base de datos sincronizada correctamente');
    } else {
      logger.info('Ejecutando en PRODUCCIÓN - Verificando conexión');
      await sequelize.authenticate();
      logger.info('Conexión de producción verificada - No se sincroniza automáticamente');
    }

    // Iniciar servidor
    server.listen(PORT, () => {
      logger.info(`Servidor corriendo en puerto: ${PORT}`);
      logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error(`Error fatal al iniciar el servidor: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled Rejection: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
});

// Iniciar
startServer();
