const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 
require('dotenv').config();

const { sequelize, Jugador, Partido, Participacion, Deporte, Lugar } = require('./models/index');

const statusRoutes = require('./routes/statusRoutes.js');
const jugadorRoutes = require('./routes/jugadorRoutes');
const partidoRoutes = require('./routes/partidoRoutes');
const participacionRoutes = require('./routes/participacionRoutes'); 
const authRoutes = require('./routes/authRoutes');
const deporteRoutes = require('./routes/deporteRoutes');
const lugarRoutes = require('./routes/lugarRoutes');

const { verificarToken } = require('./middlewares/authMiddleware');

const app = express();
const server = http.createServer(app); 

const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

app.set('socketio', io);

app.use('/api/status', statusRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/jugadores', jugadorRoutes);
app.use('/api/participaciones', participacionRoutes); 
app.use('/api/deportes', deporteRoutes);
app.use('/api/lugares', lugarRoutes);

app.use('/api/partidos', verificarToken, partidoRoutes);

io.on('connection', (socket) => {
    console.log(' Nuevo jugador conectado:', socket.id);

    socket.on('disconnect', () => {
        console.log(' Jugador desconectado');
    });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await sequelize.sync({ alter: true });
        
        console.log(' Conexión exitosa. Base de datos CourtMatch actualizada.');
        
        server.listen(PORT, () => {
            console.log(` CourtMatch corriendo en: http://localhost:${PORT}`);
            console.log(` WebSockets habilitados y listos`);
        });
    } catch (error) {
        console.error(' Error de conexión o sincronización:', error);
    }
}

startServer();