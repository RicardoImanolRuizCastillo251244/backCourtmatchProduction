const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginSchema, validate } = require('../utils/validators');

// Rate limiting para login (5 intentos cada 15 minutos)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/login
router.post('/login', loginLimiter, validate(loginSchema), authController.login);

// POST /api/auth/refresh
router.post('/refresh', authController.refreshToken);

module.exports = router;