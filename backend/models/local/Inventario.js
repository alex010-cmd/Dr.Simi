const { DataTypes } = require('sequelize');
const { dbLocal } = require('../../config/database');

/**
 * Modelo de Inventario (Base de Datos Local - Distribuida)
 */

const Inventario = dbLocal.define('inventario', {
  id_inventario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_sucursal: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cantidad_disponible: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  cantidad_minima: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10
  },
  cantidad_maxima: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1000
  },
  lote: {
    type: DataTypes.STRING(50)
  },
  fecha_caducidad: {
    type: DataTypes.DATEONLY
  },
  ubicacion_fisica: {
    type: DataTypes.STRING(50)
  },
  fecha_ultima_entrada: {
    type: DataTypes.DATE
  },
  fecha_ultima_salida: {
    type: DataTypes.DATE
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  estado: {
    type: DataTypes.ENUM('disponible', 'por_agotar', 'agotado', 'vencido'),
    defaultValue: 'disponible'
  }
}, {
  tableName: 'inventario',
  timestamps: false
});

module.exports = Inventario;
