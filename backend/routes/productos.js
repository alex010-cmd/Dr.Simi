const express = require('express');
const router = express.Router();
const Producto = require('../models/central/Producto');
const authenticateToken = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorization');
const { Op } = require('sequelize');

/**
 * Rutas de Productos
 * Base: /api/productos
 */

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/productos - Obtener productos
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      categoria, 
      laboratorio,
      estado = 'activo',
      page = 1,
      limit = 50
    } = req.query;

    const where = { estado };

    if (search) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { codigo_barras: { [Op.like]: `%${search}%` } },
        { sustancia_activa: { [Op.like]: `%${search}%` } }
      ];
    }

    if (categoria) {
      where.categoria = categoria;
    }

    if (laboratorio) {
      where.laboratorio = laboratorio;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: productos } = await Producto.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        productos,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/productos/:id - Obtener producto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: producto
    });

  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/productos/barcode/:codigo - Buscar por código de barras
router.get('/barcode/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;

    const producto = await Producto.findOne({
      where: { codigo_barras: codigo }
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: producto
    });

  } catch (error) {
    console.error('Error al buscar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/productos - Crear producto (solo admin)
router.post('/', authorizeRoles('admin'), async (req, res) => {
  try {
    const producto = await Producto.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: producto
    });

  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/productos/:id - Actualizar producto (solo admin)
router.put('/:id', authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    await producto.update(req.body);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: producto
    });

  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
