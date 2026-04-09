const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');

/**
 * Rutas de Autenticación
 * Base: /api/auth
 */

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', AuthController.register);

// POST /api/auth/login - Iniciar sesión
router.post('/login', AuthController.login);

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', authenticateToken, AuthController.logout);

// GET /api/auth/me - Obtener usuario actual
router.get('/me', authenticateToken, AuthController.getCurrentUser);

// POST /api/auth/change-password - Cambiar contraseña
router.post('/change-password', authenticateToken, AuthController.changePassword);

module.exports = router;
