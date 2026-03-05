const express = require('express');
const cors = require('cors'); 
require('dotenv').config(); 

const sequelize = require('./config/db');

const statusRoutes = require('./routes/statusRoutes.js');
const jugadorRoutes = require('./routes/jugadorRoutes'); 
const partidoRoutes = require('./routes/partidoRoutes'); 
const participacionRoutes = require('./routes/participacionRoutes');
const authRoutes = require('./routes/authRoutes'); 
const deporteRoutes = require('./routes/deporteRoutes');
const lugarRoutes = require('./routes/lugarRoutes');

// Importamos todo desde el index de modelos
const { Jugador, Partido, Participacion, Deporte } = require('./models');

const app = express(); 

app.use(cors()); 
app.use(express.json()); 

app.use('/api/status', statusRoutes);
app.use('/api/jugadores', jugadorRoutes); 
app.use('/api/partidos', partidoRoutes); 
app.use('/api/participaciones', participacionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/deportes', deporteRoutes);
app.use('/api/lugares', lugarRoutes);

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await sequelize.sync({ alter: true });
        console.log(' Conexión exitosa. Base de datos actualizada.');
        app.listen(PORT, () => {
            console.log(` CourtMatch corriendo en: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error(' Error de conexión:', error);
    }
}

startServer();