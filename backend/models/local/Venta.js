const { DataTypes } = require('sequelize');
const { dbLocal } = require('../../config/database');

/**
 * Modelo de Venta (Base de Datos Local - Distribuida)
 */

const Venta = dbLocal.define('ventas', {
  id_venta: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  folio_venta: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true
  },
  id_sucursal: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_cliente: {
    type: DataTypes.INTEGER
  },
  id_empleado: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fecha_venta: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  descuento: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  impuestos: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  metodo_pago: {
    type: DataTypes.ENUM('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'vales'),
    allowNull: false
  },
  puntos_otorgados: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  receta_medica: {
    type: DataTypes.STRING(100)
  },
  nombre_medico: {
    type: DataTypes.STRING(200)
  },
  observaciones: {
    type: DataTypes.TEXT
  },
  estado: {
    type: DataTypes.ENUM('completada', 'cancelada', 'devolucion_parcial', 'devolucion_total'),
    defaultValue: 'completada'
  },
  sincronizado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fecha_sincronizacion: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'ventas',
  timestamps: false
});

module.exports = Venta;
