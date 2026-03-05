const express = require('express');
const router = express.Router();
const jugadorController = require('../controllers/jugadorController');
router.post('/registro', jugadorController.registrar);
router.get('/', jugadorController.obtenerJugadores);

router.get('/:id/partidos', jugadorController.obtenerMisPartidos);

module.exports = router;