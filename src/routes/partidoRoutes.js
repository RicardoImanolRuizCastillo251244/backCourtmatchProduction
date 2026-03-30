const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const partidoController = require('../controllers/partidoController');
const {
  crearPartidoSchema,
  unirsePartidoSchema,
  cancelarPartidoSchema,
  cambiarEstadoPartidoSchema,
  validate
} = require('../utils/validators');
const { verificarToken } = require('../middlewares/authMiddleware');

// Rate limiters
const crearPartidoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 partidos
  message: 'Demasiados partidos creados. Intenta de nuevo más tarde.',
  keyGenerator: (req) => req.usuario?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: 1,
});

const unirsePartidoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 30, // 30 solicitudes
  message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
  keyGenerator: (req) => req.usuario?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: 1,
});

// ==================== PÚBLICOS ====================

// GET /api/partidos - Obtener todos los partidos disponibles (requiere auth)
router.get('/', verificarToken, partidoController.obtenerPartidos);

// GET /api/partidos/:idMatch - Obtener detalles de un partido específico
router.get('/:idMatch', verificarToken, partidoController.obtenerPartidoPorId);

// GET /api/partidos/:idMatch/creador - Obtener creador del partido
router.get('/:idMatch/creador', verificarToken, partidoController.obtenerCreador);

// GET /api/partidos/:idMatch/participantes - Obtener participantes de un partido
router.get('/:idMatch/participantes', verificarToken, partidoController.obtenerParticipantes);

// ==================== PRIVADOS (Requieren Autenticación) ====================

// POST /api/partidos/programar - Crear nuevo partido
router.post(
  '/programar',
  verificarToken,
  crearPartidoLimiter,
  validate(crearPartidoSchema),
  partidoController.crearPartido
);

// POST /api/partidos/:idMatch/unirse - Unirse a un partido
router.post(
  '/:idMatch/unirse',
  verificarToken,
  unirsePartidoLimiter,
  validate(unirsePartidoSchema),
  partidoController.unirsePartido
);

// DELETE /api/partidos/:idMatch - Cancelar partido (solo creador)
router.delete(
  '/:idMatch',
  verificarToken,
  validate(cancelarPartidoSchema),
  partidoController.cancelarPartido
);

// PATCH /api/partidos/:idMatch/estado - Cambiar estado (creador/admin)
router.patch(
  '/:idMatch/estado',
  verificarToken,
  validate(cambiarEstadoPartidoSchema),
  partidoController.cambiarEstado
);

// ==================== ENDPOINTS DE USUARIO ====================

// GET /api/usuarios/:idUser/partidos-creados - Partidos creados por usuario
router.get(
  '/usuario/:idUser/creados',
  verificarToken,
  partidoController.obtenerPartidosCreadosPor
);

// GET /api/usuarios/:idUser/partidos-participando - Partidos donde participa
router.get(
  '/usuario/:idUser/participando',
  verificarToken,
  partidoController.obtenerPartidosParticipando
);

// GET /api/usuarios/:idUser/historial-partidos - Historial completo
router.get(
  '/usuario/:idUser/historial',
  verificarToken,
  partidoController.obtenerHistorialPartidos
);

module.exports = router;