const express = require('express');
const router = express.Router();

const statusRoutes = require('./statusRoutes');
const authRoutes = require('./authRoutes');
const jugadorRoutes = require('./jugadorRoutes');
const partidoRoutes = require('./partidoRoutes');
const participacionRoutes = require('./participacionRoutes');
const deporteRoutes = require('./deporteRoutes');
const lugarRoutes = require('./lugarRoutes');

const { verificarToken } = require('../middlewares/authMiddleware');

router.use('/status', statusRoutes);
router.use('/auth', authRoutes);
router.use('/jugadores', jugadorRoutes);
router.use('/participaciones', participacionRoutes);
router.use('/deportes', deporteRoutes);
router.use('/lugares', lugarRoutes);

// Rutas protegidas
router.use('/partidos', verificarToken, partidoRoutes);

module.exports = router;