const { DataTypes } = require('sequelize');
const { dbCentral } = require('../../config/database');

/**
 * Modelo de Empleado (Base de Datos Central)
 */

const Empleado = dbCentral.define('empleados', {
  id_empleado: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_empleado: {
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
  curp: {
    type: DataTypes.STRING(18),
    unique: true
  },
  rfc: {
    type: DataTypes.STRING(13)
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
  id_sucursal: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  puesto: {
    type: DataTypes.ENUM('gerente', 'farmaceutico', 'vendedor', 'cajero', 'almacenista', 'auxiliar'),
    allowNull: false
  },
  cedula_profesional: {
    type: DataTypes.STRING(20)
  },
  fecha_contratacion: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  salario: {
    type: DataTypes.DECIMAL(10, 2)
  },
  usuario: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM('admin', 'gerente', 'empleado'),
    defaultValue: 'empleado'
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
    type: DataTypes.ENUM('activo', 'inactivo', 'baja'),
    defaultValue: 'activo'
  }
}, {
  tableName: 'empleados',
  timestamps: false,
  defaultScope: {
    attributes: { exclude: ['password_hash'] }
  },
  scopes: {
    withPassword: {
      attributes: {}
    }
  }
});

module.exports = Empleado;
