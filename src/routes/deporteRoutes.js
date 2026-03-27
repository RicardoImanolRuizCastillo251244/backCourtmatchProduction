const express = require('express');
const router = express.Router();
const deporteController = require('../controllers/deporteController');

router.get('/', deporteController.obtenerDeportes);

module.exports = router;    