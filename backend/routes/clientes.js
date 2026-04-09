const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
const authenticateToken = require('../middleware/auth');

/**
 * Rutas para gestión de clientes
 * Base: /api/clientes
 * Todas las rutas requieren autenticación
 */

// Listar todos los clientes
// GET /api/clientes?sucursal=1&estado=activo&search=nombre
router.get('/', authenticateToken, clientesController.listarClientes);

// Obtener un cliente por ID
// GET /api/clientes/:id
router.get('/:id', authenticateToken, clientesController.obtenerCliente);

// Crear un nuevo cliente
// POST /api/clientes
router.post('/', authenticateToken, clientesController.crearCliente);

// Actualizar un cliente
// PUT /api/clientes/:id
router.put('/:id', authenticateToken, clientesController.actualizarCliente);

// Eliminar (desactivar) un cliente
// DELETE /api/clientes/:id
router.delete('/:id', authenticateToken, clientesController.eliminarCliente);

// Actualizar puntos de un cliente
// PATCH /api/clientes/:id/puntos
router.patch('/:id/puntos', authenticateToken, clientesController.actualizarPuntos);

module.exports = router;
