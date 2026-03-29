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

// ===== RUTAS PÚBLICAS (Sin autenticación) =====
router.use('/status', statusRoutes);
router.use('/auth', authRoutes);

// Estos endpoints son públicos pero pueden incluir lógica de validación
router.use('/jugadores', jugadorRoutes);
router.use('/participaciones', participacionRoutes);
router.use('/deportes', deporteRoutes);
router.use('/lugares', lugarRoutes);

// ===== RUTAS PROTEGIDAS (Con autenticación JWT) =====
// Nota: la protección se maneja en partidoRoutes para permitir GET público en /api/partidos
router.use('/partidos', partidoRoutes);

// ===== 404 - RUTA NO ENCONTRADA =====
router.use((req, res) => {
  res.status(404).json({
    ok: false,
    statusCode: 404,
    message: 'Ruta no encontrada',
  });
});

module.exports = router;

module.exports = router;