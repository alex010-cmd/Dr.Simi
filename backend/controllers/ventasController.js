const Venta = require('../models/local/Venta');
const { dbLocal } = require('../config/database');
const { Op } = require('sequelize');

/**
 * Controlador de Ventas
 */

class VentasController {
  /**
   * Crear nueva venta
   * POST /api/ventas
   */
  static async crearVenta(req, res) {
    const transaction = await dbLocal.transaction();
    
    try {
      const { id_empleado, id_sucursal } = req.user;
      const {
        id_cliente,
        detalles, // Array de productos
        metodo_pago,
        receta_medica,
        nombre_medico,
        observaciones
      } = req.body;

      // Validar datos
      if (!detalles || detalles.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Debe incluir al menos un producto en la venta.'
        });
      }

      // Calcular totales
      let subtotal = 0;
      let descuento = 0;

      for (const detalle of detalles) {
        const subtotal_linea = detalle.cantidad * detalle.precio_unitario;
        subtotal += subtotal_linea;
        descuento += detalle.descuento_linea || 0;
      }

      const impuestos = (subtotal - descuento) * 0.16; // IVA 16%
      const total = subtotal - descuento + impuestos;

      // Calcular puntos (1 punto por cada $10 pesos)
      const puntos_otorgados = Math.floor(total / 10);

      // Generar folio único
      const fecha = new Date();
      const folio = `V${String(id_sucursal).padStart(3, '0')}-${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}-${String(fecha.getHours()).padStart(2, '0')}${String(fecha.getMinutes()).padStart(2, '0')}${String(fecha.getSeconds()).padStart(2, '0')}`;

      // Crear venta
      const venta = await Venta.create({
        folio_venta: folio,
        id_sucursal,
        id_cliente: id_cliente || null,
        id_empleado,
        subtotal,
        descuento,
        impuestos,
        total,
        metodo_pago,
        puntos_otorgados,
        receta_medica,
        nombre_medico,
        observaciones
      }, { transaction });

      // Crear detalles de venta
      const DetalleVenta = require('../models/local/DetalleVenta');
      
      for (const detalle of detalles) {
        await DetalleVenta.create({
          id_venta: venta.id_venta,
          id_producto: detalle.id_producto,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          descuento_linea: detalle.descuento_linea || 0,
          subtotal_linea: detalle.cantidad * detalle.precio_unitario - (detalle.descuento_linea || 0),
          lote: detalle.lote,
          fecha_caducidad: detalle.fecha_caducidad
        }, { transaction });
      }

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: 'Venta registrada exitosamente',
        data: {
          id_venta: venta.id_venta,
          folio_venta: venta.folio_venta,
          total: venta.total,
          puntos_otorgados: venta.puntos_otorgados
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error al crear venta:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor al crear la venta.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener ventas
   * GET /api/ventas
   */
  static async obtenerVentas(req, res) {
    try {
      const { id_sucursal, rol } = req.user;
      const { 
        fecha_inicio, 
        fecha_fin, 
        metodo_pago, 
        estado,
        page = 1,
        limit = 20
      } = req.query;

      // Construir filtros
      const where = {};
      
      // Los empleados solo ven ventas de su sucursal
      if (rol !== 'admin') {
        where.id_sucursal = id_sucursal;
      }

      if (fecha_inicio && fecha_fin) {
        where.fecha_venta = {
          [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
        };
      }

      if (metodo_pago) {
        where.metodo_pago = metodo_pago;
      }

      if (estado) {
        where.estado = estado;
      }

      // Paginación
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: ventas } = await Venta.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [['fecha_venta', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          ventas,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Error al obtener ventas:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor al obtener ventas.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener detalle de una venta
   * GET /api/ventas/:id
   */
  static async obtenerVentaPorId(req, res) {
    try {
      const { id } = req.params;
      const { id_sucursal, rol } = req.user;

      const venta = await Venta.findByPk(id);

      if (!venta) {
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada.'
        });
      }

      // Verificar acceso a sucursal
      if (rol !== 'admin' && venta.id_sucursal !== id_sucursal) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a esta venta.'
        });
      }

      // Obtener detalles
      const DetalleVenta = require('../models/local/DetalleVenta');
      const detalles = await DetalleVenta.findAll({
        where: { id_venta: venta.id_venta }
      });

      res.json({
        success: true,
        data: {
          venta,
          detalles
        }
      });

    } catch (error) {
      console.error('Error al obtener venta:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor al obtener la venta.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener ticket completo de una venta
   * GET /api/ventas/:id/ticket
   */
  static async obtenerTicket(req, res) {
    try {
      const { id } = req.params;
      const { id_sucursal, rol } = req.user;

      // Obtener venta
      const venta = await Venta.findByPk(id);

      if (!venta) {
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada.'
        });
      }

      // Verificar acceso a sucursal
      if (rol !== 'admin' && venta.id_sucursal !== id_sucursal) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a esta venta.'
        });
      }

      // Obtener información del vendedor
      const Empleado = require('../models/central/Empleado');
      const vendedor = await Empleado.findByPk(venta.id_empleado, {
        attributes: ['numero_empleado', 'nombre', 'apellido_paterno', 'apellido_materno', 'puesto']
      });

      // Obtener información de la sucursal
      const Sucursal = require('../models/central/Sucursal');
      const sucursal = await Sucursal.findByPk(venta.id_sucursal);

      // Obtener información del cliente
      let cliente = null;
      if (venta.id_cliente) {
        const Cliente = require('../models/central/Cliente');
        cliente = await Cliente.findByPk(venta.id_cliente, {
          attributes: ['nombre', 'apellido_paterno', 'apellido_materno', 'telefono', 'email']
        });
      }

      // Obtener detalles con información de productos
      const DetalleVenta = require('../models/local/DetalleVenta');
      const Producto = require('../models/central/Producto');
      
      const detalles = await DetalleVenta.findAll({
        where: { id_venta: venta.id_venta }
      });

      // Enriquecer detalles con información de productos
      const detallesConProductos = await Promise.all(
        detalles.map(async (detalle) => {
          const producto = await Producto.findByPk(detalle.id_producto, {
            attributes: ['codigo_barras', 'nombre', 'descripcion']
          });
          
          return {
            ...detalle.toJSON(),
            producto: producto ? producto.toJSON() : null
          };
        })
      );

      // Construir ticket completo
      const ticket = {
        venta: {
          id_venta: venta.id_venta,
          folio_venta: venta.folio_venta,
          fecha_venta: venta.fecha_venta,
          subtotal: parseFloat(venta.subtotal),
          descuento: parseFloat(venta.descuento),
          impuestos: parseFloat(venta.impuestos),
          total: parseFloat(venta.total),
          metodo_pago: venta.metodo_pago,
          puntos_otorgados: venta.puntos_otorgados,
          estado: venta.estado
        },
        vendedor: vendedor ? {
          numero_empleado: vendedor.numero_empleado,
          nombre_completo: `${vendedor.nombre} ${vendedor.apellido_paterno} ${vendedor.apellido_materno || ''}`.trim(),
          puesto: vendedor.puesto
        } : null,
        sucursal: sucursal ? {
          codigo_sucursal: sucursal.codigo_sucursal,
          nombre: sucursal.nombre,
          direccion: sucursal.direccion,
          ciudad: sucursal.ciudad,
          estado: sucursal.estado_geografico,
          telefono: sucursal.telefono,
          email: sucursal.email
        } : null,
        cliente: cliente ? {
          nombre_completo: `${cliente.nombre} ${cliente.apellido_paterno} ${cliente.apellido_materno || ''}`.trim(),
          telefono: cliente.telefono,
          email: cliente.email
        } : {
          nombre_completo: 'Público General',
          telefono: null,
          email: null
        },
        productos: detallesConProductos.map(detalle => ({
          cantidad: detalle.cantidad,
          codigo_barras: detalle.producto?.codigo_barras,
          nombre: detalle.producto?.nombre,
          descripcion: detalle.producto?.descripcion,
          precio_unitario: parseFloat(detalle.precio_unitario),
          descuento_linea: parseFloat(detalle.descuento_linea),
          subtotal_linea: parseFloat(detalle.subtotal_linea),
          lote: detalle.lote,
          fecha_caducidad: detalle.fecha_caducidad
        }))
      };

      res.json({
        success: true,
        data: ticket
      });

    } catch (error) {
      console.error('Error al obtener ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor al obtener el ticket.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Cancelar venta
   * PUT /api/ventas/:id/cancelar
   */
  static async cancelarVenta(req, res) {
    try {
      const { id } = req.params;
      const { id_sucursal, rol } = req.user;
      const { motivo } = req.body;

      const venta = await Venta.findByPk(id);

      if (!venta) {
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada.'
        });
      }

      // Verificar acceso a sucursal
      if (rol !== 'admin' && venta.id_sucursal !== id_sucursal) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a esta venta.'
        });
      }

      if (venta.estado === 'cancelada') {
        return res.status(400).json({
          success: false,
          message: 'La venta ya está cancelada.'
        });
      }

      await venta.update({
        estado: 'cancelada',
        observaciones: `${venta.observaciones || ''}\nCANCELADA: ${motivo}`
      });

      res.json({
        success: true,
        message: 'Venta cancelada exitosamente.',
        data: venta
      });

    } catch (error) {
      console.error('Error al cancelar venta:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor al cancelar la venta.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

// Crear modelo de DetalleVenta
const { DataTypes } = require('sequelize');
const DetalleVenta = dbLocal.define('detalle_venta', {
  id_detalle: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  id_venta: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  descuento_linea: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  subtotal_linea: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  lote: {
    type: DataTypes.STRING(50)
  },
  fecha_caducidad: {
    type: DataTypes.DATEONLY
  }
}, {
  tableName: 'detalle_venta',
  timestamps: false
});

module.exports = VentasController;
