const express = require('express');
const router = express.Router();
const lugarController = require('../controllers/lugarController');

router.post('/crear', lugarController.crearLugar);
router.get('/listar', lugarController.obtenerLugares);
router.get('/mis-lugares/:idUser', lugarController.obtenerMisLugares);

module.exports = router;