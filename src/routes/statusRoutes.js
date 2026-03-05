const express = require('express');
const router = express.Router();
const { checkStatus } = require('../controllers/statusController');

router.get('/', checkStatus);

module.exports = router; 