const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const apiRoutes = require('./routes/index');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

app.set('socketio', io);

// Prefijo global /api
app.use('/api', apiRoutes);

// Middleware global de errores
app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({
        ok: false,
        message: err.message || 'Error interno del servidor'
    });
});

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);
    socket.on('disconnect', () => console.log('Cliente desconectado'));
});

module.exports = { server, io };