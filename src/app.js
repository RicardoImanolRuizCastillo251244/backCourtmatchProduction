const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const apiRoutes = require('./routes/index');
const logger = require('./utils/logger');

const app = express();

// Configurar trust proxy para Railway/proxies
app.set('trust proxy', true);
const server = http.createServer(app);

// ===== SOCKET.IO =====
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
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
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  // Los eventos públicos (status check) no requieren token
  if (!token) {
    socket.isAuthenticated = false;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_segura');
    socket.userId = decoded.id;
    socket.usuario = decoded.usuario;
    socket.isAuthenticated = true;
    next();
  } catch (error) {
    logger.warn(`Socket authentication failed: ${error.message}`);
    socket.isAuthenticated = false;
    next();
  }
});

app.set('socketio', io);

// ===== RUTAS =====
// Prefijo global /api
app.use('/api', apiRoutes);

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
    logger.warn(`Cliente sin autenticar conectado: ${socket.id}`);
  }

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