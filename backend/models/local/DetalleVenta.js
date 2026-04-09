const { DataTypes } = require('sequelize');
const { dbLocal } = require('../../config/database');

/**
 * Modelo de DetalleVenta (Base de Datos Local - Distribuida)
 * Registra cada producto vendido en una venta
 */

const DetalleVenta = dbLocal.define('detalle_ventas', {
  id_detalle: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  id_venta: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'ventas',
      key: 'id_venta'
    }
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  codigo_producto: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  nombre_producto: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  cantidad: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  descuento: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  impuestos: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  lote: {
    type: DataTypes.STRING(50)
  },
  fecha_caducidad: {
    type: DataTypes.DATEONLY
  },
  requiere_receta: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'detalle_ventas',
  timestamps: false
});

module.exports = DetalleVenta;
