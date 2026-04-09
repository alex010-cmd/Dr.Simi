const app = require('./app');
const { testConnections } = require('./config/database');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

/**
 * Iniciar servidor
 */

const startServer = async () => {
  try {
    // Verificar conexiones a bases de datos
    console.log('\n🔌 Verificando conexiones a bases de datos...\n');
    await testConnections();

    // Iniciar servidor HTTP
    app.listen(PORT, HOST, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 SERVIDOR INICIADO CORRECTAMENTE');
      console.log('='.repeat(60));
      console.log(`\n📡 Servidor escuchando en: http://${HOST}:${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🏢 Sucursal: ${process.env.SUCURSAL_CODIGO || 'SUC001'}`);
      console.log(`\n📚 API Endpoints:`);
      console.log(`   - Health Check: http://${HOST}:${PORT}/health`);
      console.log(`   - Auth: http://${HOST}:${PORT}/api/auth`);
      console.log(`   - Productos: http://${HOST}:${PORT}/api/productos`);
      console.log(`   - Ventas: http://${HOST}:${PORT}/api/ventas`);
      console.log(`   - Inventario: http://${HOST}:${PORT}/api/inventario`);
      console.log('\n' + '='.repeat(60) + '\n');
    });

  } catch (error) {
    console.error('\n❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejar errores no capturados
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Promise Rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar servidor
startServer();
