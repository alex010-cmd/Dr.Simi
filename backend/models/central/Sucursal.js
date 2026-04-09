const { DataTypes } = require('sequelize');
const { dbCentral } = require('../../config/database');

/**
 * Modelo de Sucursal (Base de Datos Central)
 * Información de cada sucursal de la farmacia
 */

const Sucursal = dbCentral.define('sucursales', {
  id_sucursal: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo_sucursal: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  nombre_sucursal: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  colonia: {
    type: DataTypes.STRING(100)
  },
  ciudad: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  codigo_postal: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100)
  },
  gerente_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'empleados',
      key: 'id_empleado'
    }
  },
  horario_apertura: {
    type: DataTypes.TIME
  },
  horario_cierre: {
    type: DataTypes.TIME
  },
  estado_sucursal: {
    type: DataTypes.ENUM('activa', 'inactiva', 'mantenimiento'),
    defaultValue: 'activa'
  },
  fecha_apertura: {
    type: DataTypes.DATEONLY
  },
  capacidad_almacen: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Metros cuadrados de almacén'
  },
  tipo_sucursal: {
    type: DataTypes.ENUM('matriz', 'sucursal', 'mini_sucursal'),
    defaultValue: 'sucursal'
  },
  fecha_registro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'sucursales',
  timestamps: false
});

module.exports = Sucursal;
