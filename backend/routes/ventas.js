const express = require('express');
const router = express.Router();
const VentasController = require('../controllers/ventasController');
const authenticateToken = require('../middleware/auth');
const { authorizePermission } = require('../middleware/authorization');

/**
 * Rutas de Ventas
 * Base: /api/ventas
 */

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/ventas - Obtener ventas
router.get('/', 
  authorizePermission('ventas:read'),
  VentasController.obtenerVentas
);

// GET /api/ventas/:id - Obtener venta por ID
router.get('/:id', 
  authorizePermission('ventas:read'),
  VentasController.obtenerVentaPorId
);

// GET /api/ventas/:id/ticket - Obtener ticket completo de venta
router.get('/:id/ticket', 
  authorizePermission('ventas:read'),
  VentasController.obtenerTicket
);

// POST /api/ventas - Crear nueva venta
router.post('/', 
  authorizePermission('ventas:create'),
  VentasController.crearVenta
);

// PUT /api/ventas/:id/cancelar - Cancelar venta
router.put('/:id/cancelar', 
  authorizePermission('ventas:delete'),
  VentasController.cancelarVenta
);

module.exports = router;
