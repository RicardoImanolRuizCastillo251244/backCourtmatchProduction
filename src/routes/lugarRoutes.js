const express = require('express');
const router = express.Router();
const lugarController = require('../controllers/lugarController');

router.get('/listar', lugarController.obtenerLugares);
router.get('/:idLugar', lugarController.obtenerLugarPorId);

module.exports = router;