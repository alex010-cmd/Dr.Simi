const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Configuración de Conexiones a Bases de Datos
 * - dbCentral: Conexión a la base de datos centralizada
 * - dbLocal: Conexión a la base de datos local de la sucursal
 */

// Conexión a Base de Datos Central
const dbCentral = new Sequelize(
  process.env.DB_CENTRAL_NAME,
  process.env.DB_CENTRAL_USER,
  process.env.DB_CENTRAL_PASSWORD,
  {
    host: process.env.DB_CENTRAL_HOST,
    port: process.env.DB_CENTRAL_PORT,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: false,
      freezeTableName: true
    }
  }
);

// Conexión a Base de Datos Local (Sucursal)
const dbLocal = new Sequelize(
  process.env.DB_LOCAL_NAME,
  process.env.DB_LOCAL_USER,
  process.env.DB_LOCAL_PASSWORD,
  {
    host: process.env.DB_LOCAL_HOST,
    port: process.env.DB_LOCAL_PORT,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 15,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: false,
      freezeTableName: true
    }
  }
);

/**
 * Verificar conexiones a las bases de datos
 */
const testConnections = async () => {
  try {
    await dbCentral.authenticate();
    console.log('✅ Conexión a BD Central establecida correctamente');
  } catch (error) {
    console.error('❌ Error conectando a BD Central:', error.message);
  }

  try {
    await dbLocal.authenticate();
    console.log('✅ Conexión a BD Local establecida correctamente');
  } catch (error) {
    console.error('❌ Error conectando a BD Local:', error.message);
  }
};

module.exports = {
  dbCentral,
  dbLocal,
  testConnections
};
