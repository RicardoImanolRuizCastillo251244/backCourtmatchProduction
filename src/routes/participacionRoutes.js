const express = require('express');
const rateLimit = require('express-rate-limit');
const { verificarToken } = require('../middlewares/authMiddleware');
const router = express.Router();
const participacionController = require('../controllers/participacionController');
const { inscripcionPartidoSchema, validate } = require('../utils/validators');

// Rate limiting para inscripciones (30 inscripciones cada hora por IP)
const inscripcionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 30,
  message: 'Demasiadas inscripciones. Intenta de nuevo más tarde.',
});

// POST /api/participaciones/inscribir (requiere auth)
router.post('/inscribir', verificarToken, inscripcionLimiter, validate(inscripcionPartidoSchema), participacionController.unirseAPartido);

// GET /api/participaciones/:idMatch - Obtener participaciones y cupos de un partido (requiere auth)
router.get('/:idMatch', verificarToken, participacionController.obtenerParticipacionesPorPartido);

// DELETE /api/participaciones/:idParticipacion - Cancelar propia asistencia (requiere auth)
router.delete('/:idParticipacion', verificarToken, participacionController.cancelarAsistencia);

module.exports = router;