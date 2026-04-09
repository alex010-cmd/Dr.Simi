const express = require('express');
const router = express.Router();
const sucursalesController = require('../controllers/sucursalesController');
const authMiddleware = require('../middleware/auth');

// Listar todas las sucursales
router.get('/', sucursalesController.listarSucursales);

// El resto de rutas requieren autenticación
router.use(authMiddleware);

// Obtener una sucursal específica
router.get('/:id', sucursalesController.obtenerSucursal);

// Obtener estadísticas de una sucursal
router.get('/:id/estadisticas', sucursalesController.estadisticasSucursal);

// Obtener estadísticas detalladas para admin (incluye ventas, inventario, empleados, etc)
router.get('/:id/admin-stats', sucursalesController.estadisticasDetalladas);

// Obtener detalle para vista local por sucursal (clientes, empleados, inventario/productos)
router.get('/:id/local-view', sucursalesController.datosVistaLocal);

module.exports = router;
