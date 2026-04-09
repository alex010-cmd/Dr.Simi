const { DataTypes } = require('sequelize');
const { dbCentral } = require('../../config/database');

/**
 * Modelo de Producto (Base de Datos Central)
 * Tabla centralizada que contiene el catálogo maestro de productos
 */

const Producto = dbCentral.define('productos', {
  id_producto: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo_barras: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  nombre: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  categoria: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  precio_venta: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  precio_compra: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  requiere_receta: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sustancia_activa: {
    type: DataTypes.STRING(200)
  },
  laboratorio: {
    type: DataTypes.STRING(150)
  },
  presentacion: {
    type: DataTypes.STRING(100)
  },
  fecha_registro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo', 'descontinuado'),
    defaultValue: 'activo'
  }
}, {
  tableName: 'productos',
  timestamps: false
});

module.exports = Producto;
