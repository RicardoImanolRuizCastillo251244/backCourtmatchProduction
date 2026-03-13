const express = require('express');
const router = express.Router();
const participacionController = require('../controllers/participacionController');

router.post('/inscribir', participacionController.unirseAPartido);

module.exports = router;