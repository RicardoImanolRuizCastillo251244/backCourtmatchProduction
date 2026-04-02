require('dotenv').config();
const { server } = require('./app');
const { io } = require('./app');
const sequelize = require('./config/db');
const logger = require('./utils/logger');
const { iniciarScheduler } = require('./services/schedulerService');
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
    // Si REDIS_URL está definido, configurar adapter Redis para socket.io
    if (process.env.REDIS_URL) {
      try {
        const { createClient } = require('redis');
        const { createAdapter } = require('@socket.io/redis-adapter');

        const pubClient = createClient({ url: process.env.REDIS_URL });
        const subClient = pubClient.duplicate();

        await pubClient.connect();
        await subClient.connect();


        const io = require('./app').io;
        io.adapter(createAdapter(pubClient, subClient));
        // Exponer cliente Redis en io para healthchecks y uso explícito
        try {
          io.redisClient = pubClient;
        } catch (attachErr) {
          logger.warn(`No se pudo adjuntar redisClient a io: ${attachErr.message}`);
        }

        // Configurar rate limiter Redis para eventos de socket
        try {
          const { RateLimiterRedis } = require('rate-limiter-flexible');
          const rateLimiter = new RateLimiterRedis({
            storeClient: pubClient,
            points: parseInt(process.env.SOCKET_RL_POINTS, 10) || 30,
            duration: parseInt(process.env.SOCKET_RL_DURATION, 10) || 60,
            keyPrefix: 'socket_rl',
          });
          io.rateLimiter = rateLimiter;
          logger.info('RateLimiterRedis configurado y adjuntado a Socket.IO');
        } catch (rlErr) {
          logger.warn(`No se pudo configurar RateLimiterRedis: ${rlErr.message}`);
        }
        logger.info('Redis adapter configurado para Socket.IO');
      } catch (err) {
        logger.error(`No se pudo configurar Redis adapter: ${err.message}`);
        // No abortamos; el app sigue funcionando en single-instance
      }
    }

    server.listen(PORT, () => {
      logger.info(`Servidor corriendo en puerto: ${PORT}`);
      logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);

      // Iniciar transiciones automáticas de estado de partidos.
      iniciarScheduler(io);
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
