const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const apiRoutes = require('./routes/index');
const logger = require('./utils/logger');
const sequelize = require('./config/db');

const app = express();

// Configurar trust proxy para producción detrás de un proxy (Railway u otros)
// Se recomienda un valor numérico como 1 en lugar de true para evitar advertencias de express-rate-limit.
app.set('trust proxy', 1);
const server = http.createServer(app);

// ===== SOCKET.IO =====
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Keep connections responsive and limit large payloads
  pingInterval: 25000,
  pingTimeout: 60000,
  maxHttpBufferSize: 1e6,
});

// ===== MIDDLEWARE DE SEGURIDAD =====
app.use(helmet());
app.use(compression());

// ===== CORS CONFIGURADO =====
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600,
};

app.use(cors(corsOptions));

// ===== PARSERS =====
app.use(express.json({ limit: '10kb' })); // Limitar tamaño de body
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// ===== REQUEST LOGGING =====
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.path}`);
  next();
});

// ===== SOCKET.IO AUTHENTICATION =====
// En producción el secreto JWT es obligatorio. Fallar rápido si no está definido.
if (!process.env.JWT_SECRET) {
  logger.error('JWT_SECRET no está definido. Abortando arranque para evitar secretos inseguros.');
  process.exit(1);
}

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  // Eventos públicos (status check) pueden conectarse sin token.
  if (!token) {
    socket.isAuthenticated = false;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.usuario = decoded.usuario;
    socket.isAuthenticated = true;
    return next();
  } catch (error) {
    logger.warn(`Socket authentication failed: ${error.message}`);
    // Rechazar handshake para evitar conexiones con tokens inválidos
    return next(new Error('Unauthorized'));
  }
});

app.set('socketio', io);

// ===== RUTAS =====
// Prefijo global /api
app.use('/api', apiRoutes);

// Health / readiness probe
app.get('/healthz', async (req, res) => {
  try {
    // Chequear DB
    await sequelize.authenticate();

    // Chequear Redis si está adjuntado al io
    if (io && io.redisClient) {
      try {
        // redis v4 client exposes ping()
        await io.redisClient.ping();
      } catch (redisErr) {
        logger.warn(`Healthcheck: Redis ping falló: ${redisErr.message}`);
        return res.status(503).json({ ok: false, message: 'redis_unavailable' });
      }
    }

    return res.json({ ok: true, status: 'healthy' });
  } catch (err) {
    logger.error(`Healthcheck error: ${err.message}`);
    return res.status(503).json({ ok: false, message: 'unhealthy', error: err.message });
  }
});

// ===== MANEJO DE ERRORES GLOBAL =====
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  // Log del error
  if (process.env.NODE_ENV === 'production') {
    logger.error({
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      userId: req.usuario?.id,
      ...(err.isOperational ? {} : { stack: err.stack }),
    });
  } else {
    logger.error(err);
  }

  // Respuesta
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      ok: false,
      statusCode: err.statusCode,
      message: err.message,
    });
  }

  // Error no operacional - No exponer detalles
  return res.status(500).json({
    ok: false,
    statusCode: 500,
    message: 'Error interno del servidor',
  });
});

// ===== RUTA NO ENCONTRADA =====
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    statusCode: 404,
    message: 'Ruta no encontrada',
  });
});

// ===== SOCKET.IO EVENTOS =====
io.on('connection', (socket) => {
  if (socket.isAuthenticated) {
    logger.info(`Usuario ${socket.usuario} conectado (${socket.id})`);
    socket.join(`user_${socket.userId}`);
  } else {
    logger.info(`Cliente sin autenticar conectado: ${socket.id}`);
  }

  // Simple rate limiter por socket (ventana 60s)
  socket._rateWindowMs = 60 * 1000;
  socket._rateMax = 30; // acciones permitidas por ventana
  socket._rateMap = new Map();

  const checkRate = async (key) => {
    // Si hay un rate limiter Redis adjuntado al server, usarlo (global y compartido)
    const serverRateLimiter = socket.server && socket.server.rateLimiter;
    if (serverRateLimiter) {
      try {
        // key por IP y tipo de evento
        const remoteAddr = socket.handshake.address || socket.id;
        await serverRateLimiter.consume(`${key}:${remoteAddr}`);
        return false; // no excedido
      } catch (rejRes) {
        return true; // excedido
      }
    }

    // Fallback en memoria por socket
    const now = Date.now();
    const windowStart = now - socket._rateWindowMs;
    const arr = socket._rateMap.get(key) || [];
    const filtered = arr.filter((t) => t > windowStart);
    filtered.push(now);
    socket._rateMap.set(key, filtered);
    return filtered.length > socket._rateMax;
  };

  // Unirse a sala de un partido para recibir eventos específicos de estado.
  socket.on('joinPartido', async (payload = {}, ack) => {
    const idMatch = Number(payload.idMatch);

    // Requerir autenticación para unirse a salas privadas
    if (!socket.isAuthenticated) {
      if (typeof ack === 'function') {
        ack({ ok: false, message: 'Autenticación requerida' });
      }
      return;
    }

    if (await checkRate('joinPartido')) {
      if (typeof ack === 'function') {
        ack({ ok: false, message: 'Rate limit excedido, intenta más tarde' });
      }
      return;
    }

    if (!Number.isInteger(idMatch) || idMatch <= 0) {
      if (typeof ack === 'function') {
        ack({ ok: false, message: 'idMatch inválido' });
      }
      return;
    }

    const room = `partido_${idMatch}`;
    socket.join(room);
    logger.info(`Socket ${socket.id} unido a sala ${room}`);

    if (typeof ack === 'function') {
      ack({ ok: true, room });
    }
  });

  // Salir de sala de partido cuando ya no se visualiza su detalle.
  socket.on('leavePartido', async (payload = {}, ack) => {
    const idMatch = Number(payload.idMatch);

    // Requerir autenticación para salir de salas privadas
    if (!socket.isAuthenticated) {
      if (typeof ack === 'function') {
        ack({ ok: false, message: 'Autenticación requerida' });
      }
      return;
    }

    if (await checkRate('leavePartido')) {
      if (typeof ack === 'function') {
        ack({ ok: false, message: 'Rate limit excedido, intenta más tarde' });
      }
      return;
    }

    if (!Number.isInteger(idMatch) || idMatch <= 0) {
      if (typeof ack === 'function') {
        ack({ ok: false, message: 'idMatch inválido' });
      }
      return;
    }

    const room = `partido_${idMatch}`;
    socket.leave(room);
    logger.info(`Socket ${socket.id} salió de sala ${room}`);

    if (typeof ack === 'function') {
      ack({ ok: true, room });
    }
  });

  socket.on('disconnect', () => {
    if (socket.isAuthenticated) {
      logger.info(`Usuario ${socket.usuario} desconectado`);
    } else {
      logger.info(`Cliente desconectado: ${socket.id}`);
    }
  });

  socket.on('error', (error) => {
    logger.error(`Socket error from ${socket.id}: ${error}`);
  });
});

module.exports = { server, io };