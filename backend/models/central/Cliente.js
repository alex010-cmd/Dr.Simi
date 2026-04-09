const { DataTypes } = require('sequelize');
const { dbCentral } = require('../../config/database');

/**
 * Modelo de Cliente (Base de Datos Central)
 */

const Cliente = dbCentral.define('clientes', {
  id_cliente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_cliente: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  apellido_paterno: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  apellido_materno: {
    type: DataTypes.STRING(100)
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY
  },
  telefono: {
    type: DataTypes.STRING(20)
  },
  email: {
    type: DataTypes.STRING(100)
  },
  direccion: {
    type: DataTypes.TEXT
  },
  ciudad: {
    type: DataTypes.STRING(100)
  },
  estado: {
    type: DataTypes.STRING(100)
  },
  codigo_postal: {
    type: DataTypes.STRING(10)
  },
  rfc: {
    type: DataTypes.STRING(13)
  },
  sucursal_registro: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  puntos_acumulados: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  descuento_preferente: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
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
    type: DataTypes.ENUM('activo', 'inactivo'),
    defaultValue: 'activo'
  }
}, {
  tableName: 'clientes',
  timestamps: false
});

module.exports = Cliente;
