const express = require('express');
const router = express.Router();
const deporteController = require('../controllers/deporteController');

router.get('/', deporteController.obtenerDeportes);

router.post('/crear', deporteController.crearDeporte);

module.exports = router;    