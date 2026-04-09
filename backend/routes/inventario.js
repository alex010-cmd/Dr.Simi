const express = require('express');
const router = express.Router();
const Inventario = require('../models/local/Inventario');
const authenticateToken = require('../middleware/auth');
const { authorizePermission, authorizeSucursal } = require('../middleware/authorization');
const { Op } = require('sequelize');

/**
 * Rutas de Inventario
 * Base: /api/inventario
 */

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/inventario - Obtener inventario
router.get('/', authorizePermission('inventario:read'), async (req, res) => {
  try {
    const { id_sucursal, rol } = req.user;
    const { estado, bajo_stock } = req.query;

    const where = {};

    // Los empleados solo ven inventario de su sucursal
    if (rol !== 'admin') {
      where.id_sucursal = id_sucursal;
    }

    if (estado) {
      where.estado = estado;
    }

    if (bajo_stock === 'true') {
      where[Op.and] = [
        { cantidad_disponible: { [Op.lte]: Op.col('cantidad_minima') } }
      ];
    }

    const inventario = await Inventario.findAll({
      where,
      order: [['id_producto', 'ASC']]
    });

    res.json({
      success: true,
      data: inventario
    });

  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener inventario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/inventario/producto/:id_producto - Obtener inventario de un producto
router.get('/producto/:id_producto', authorizePermission('inventario:read'), async (req, res) => {
  try {
    const { id_producto } = req.params;
    const { id_sucursal, rol } = req.user;

    const where = { id_producto };

    if (rol !== 'admin') {
      where.id_sucursal = id_sucursal;
    }

    const inventario = await Inventario.findOne({ where });

    if (!inventario) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado en inventario'
      });
    }

    res.json({
      success: true,
      data: inventario
    });

  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener inventario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/inventario/alertas - Obtener alertas de inventario
router.get('/alertas', authorizePermission('inventario:read'), async (req, res) => {
  try {
    const { id_sucursal, rol } = req.user;

    const where = {};
    if (rol !== 'admin') {
      where.id_sucursal = id_sucursal;
    }

    // Productos con bajo stock
    const bajoStock = await Inventario.findAll({
      where: {
        ...where,
        estado: 'por_agotar'
      }
    });

    // Productos agotados
    const agotados = await Inventario.findAll({
      where: {
        ...where,
        estado: 'agotado'
      }
    });

    // Productos próximos a vencer (90 días)
    const proximosVencer = await Inventario.findAll({
      where: {
        ...where,
        fecha_caducidad: {
          [Op.between]: [new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)]
        }
      }
    });

    res.json({
      success: true,
      data: {
        bajo_stock: bajoStock,
        agotados: agotados,
        proximos_vencer: proximosVencer,
        resumen: {
          total_bajo_stock: bajoStock.length,
          total_agotados: agotados.length,
          total_proximos_vencer: proximosVencer.length
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/inventario/:id - Actualizar inventario
router.put('/:id', 
  authorizePermission('inventario:update'), 
  authorizeSucursal,
  async (req, res) => {
    try {
      const { id } = req.params;

      const inventario = await Inventario.findByPk(id);

      if (!inventario) {
        return res.status(404).json({
          success: false,
          message: 'Registro de inventario no encontrado'
        });
      }

      await inventario.update(req.body);

      res.json({
        success: true,
        message: 'Inventario actualizado exitosamente',
        data: inventario
      });

    } catch (error) {
      console.error('Error al actualizar inventario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar inventario',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;
