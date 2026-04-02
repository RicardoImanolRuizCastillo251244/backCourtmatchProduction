const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const jugadorController = require('../controllers/jugadorController');
const { verificarToken } = require('../middlewares/authMiddleware');
const {
  registroJugadorSchema,
  actualizarPerfilSchema,
  cambiarContrasenaSchema,
  validate,
} = require('../utils/validators');

// Rate limiting para registro (5 intentos cada 15 minutos)
const registroLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Demasiados intentos de registro. Intenta de nuevo en 15 minutos.',
  skipSuccessfulRequests: true,
});

const actualizarPerfilLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Demasiados intentos de actualización de perfil. Intenta de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: 1,
});

const cambiarContrasenaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: 'Demasiados intentos de cambio de contraseña. Intenta de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: 1,
});

// POST /api/jugadores/registro
router.post('/registro', registroLimiter, validate(registroJugadorSchema), jugadorController.registrar);

// GET /api/jugadores
router.get('/', jugadorController.obtenerJugadores);

// GET /api/jugadores/:id/partidos
router.get('/:id/partidos', jugadorController.obtenerMisPartidos);

// PATCH /api/jugadores/perfil
router.patch(
  '/perfil',
  verificarToken,
  actualizarPerfilLimiter,
  validate(actualizarPerfilSchema),
  jugadorController.actualizarPerfil
);

// PATCH /api/jugadores/contrasena
router.patch(
  '/contrasena',
  verificarToken,
  cambiarContrasenaLimiter,
  validate(cambiarContrasenaSchema),
  jugadorController.cambiarContrasena
);

module.exports = router;