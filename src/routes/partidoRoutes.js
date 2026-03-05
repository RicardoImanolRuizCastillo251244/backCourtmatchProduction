const express = require('express');
const router = express.Router();
const partidoController = require('../controllers/partidoController');

router.post('/programar', partidoController.crearPartido);
router.get('/', partidoController.obtenerPartidos);

module.exports = router;