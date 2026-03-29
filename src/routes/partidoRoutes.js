const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const partidoController = require('../controllers/partidoController');
const { crearPartidoSchema, validate } = require('../utils/validators');
const { verificarToken } = require('../middlewares/authMiddleware');

// Rate limiting para crear partidos (20 partidos cada hora)
const crearPartidoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 partidos
  message: 'Demasiados partidos creados. Intenta de nuevo más tarde.',
  keyGenerator: (req) => req.usuario.id,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
});

// POST /api/partidos/programar (requiere autenticación)
router.post('/programar', verificarToken, crearPartidoLimiter, validate(crearPartidoSchema), partidoController.crearPartido);

// GET /api/partidos (pública)
router.get('/', partidoController.obtenerPartidos);

module.exports = router;