const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const jugadorController = require('../controllers/jugadorController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { registroJugadorSchema, validate } = require('../utils/validators');

// Rate limiting para registro (5 intentos cada 15 minutos)
const registroLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Demasiados intentos de registro. Intenta de nuevo en 15 minutos.',
  skipSuccessfulRequests: true,
});

// POST /api/jugadores/registro
router.post('/registro', registroLimiter, validate(registroJugadorSchema), jugadorController.registrar);

// GET /api/jugadores
router.get('/', jugadorController.obtenerJugadores);

// GET /api/jugadores/:id/partidos
router.get('/:id/partidos', jugadorController.obtenerMisPartidos);

module.exports = router;