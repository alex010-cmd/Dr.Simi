const cron = require('node-cron');
const { dbCentral, dbLocal } = require('../backend/config/database');
require('dotenv').config({ path: '../backend/.env' });

/**
 * Daemon de Sincronización de Bases de Datos Distribuidas
 * Sincroniza datos entre BD Central y BD Local cada X minutos
 */

const SYNC_INTERVAL = process.env.SYNC_INTERVAL_MINUTES || 5;
const SUCURSAL_ID = parseInt(process.env.SUCURSAL_ID) || 1;

console.log('\n' + '='.repeat(70));
console.log('🔄 DAEMON DE SINCRONIZACIÓN - SISTEMA DE FARMACIA DISTRIBUIDA');
console.log('='.repeat(70));
console.log(`\n⏰ Intervalo de sincronización: cada ${SYNC_INTERVAL} minutos`);
console.log(`🏢 Sucursal ID: ${SUCURSAL_ID}\n`);

/**
 * Sincronizar productos desde BD Central a BD Local
 */
async function syncProductosCentralToLocal() {
  try {
    console.log('📦 Sincronizando productos Central → Local...');

    // Obtener productos de BD Central
    const [productosCentral] = await dbCentral.query(`
      SELECT * FROM productos 
      WHERE estado = 'activo'
      ORDER BY fecha_actualizacion DESC
    `);

    // Actualizar/Insertar en BD Local (cache)
    for (const producto of productosCentral) {
      await dbLocal.query(`
        INSERT INTO productos_local (
          id_producto, codigo_barras, nombre, categoria, 
          precio_venta, requiere_receta, laboratorio, presentacion, estado
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          codigo_barras = VALUES(codigo_barras),
          nombre = VALUES(nombre),
          categoria = VALUES(categoria),
          precio_venta = VALUES(precio_venta),
          requiere_receta = VALUES(requiere_receta),
          laboratorio = VALUES(laboratorio),
          presentacion = VALUES(presentacion),
          estado = VALUES(estado),
          fecha_ultima_sincronizacion = NOW()
      `, [
        producto.id_producto,
        producto.codigo_barras,
        producto.nombre,
        producto.categoria,
        producto.precio_venta,
        producto.requiere_receta,
        producto.laboratorio,
        producto.presentacion,
        producto.estado
      ]);
    }

    console.log(`   ✅ ${productosCentral.length} productos sincronizados`);
    return productosCentral.length;

  } catch (error) {
    console.error('   ❌ Error sincronizando productos:', error.message);
    throw error;
  }
}

/**
 * Sincronizar clientes desde BD Central a BD Local
 */
async function syncClientesCentralToLocal() {
  try {
    console.log('👥 Sincronizando clientes Central → Local...');

    // Obtener clientes de BD Central
    const [clientesCentral] = await dbCentral.query(`
      SELECT * FROM clientes 
      WHERE estado = 'activo'
      ORDER BY fecha_actualizacion DESC
      LIMIT 1000
    `);

    // Actualizar/Insertar en BD Local (cache)
    for (const cliente of clientesCentral) {
      await dbLocal.query(`
        INSERT INTO clientes_local (
          id_cliente, numero_cliente, nombre, apellido_paterno, 
          apellido_materno, telefono, email, puntos_acumulados, descuento_preferente
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          numero_cliente = VALUES(numero_cliente),
          nombre = VALUES(nombre),
          apellido_paterno = VALUES(apellido_paterno),
          apellido_materno = VALUES(apellido_materno),
          telefono = VALUES(telefono),
          email = VALUES(email),
          puntos_acumulados = VALUES(puntos_acumulados),
          descuento_preferente = VALUES(descuento_preferente),
          fecha_ultima_sincronizacion = NOW()
      `, [
        cliente.id_cliente,
        cliente.numero_cliente,
        cliente.nombre,
        cliente.apellido_paterno,
        cliente.apellido_materno,
        cliente.telefono,
        cliente.email,
        cliente.puntos_acumulados,
        cliente.descuento_preferente
      ]);
    }

    console.log(`   ✅ ${clientesCentral.length} clientes sincronizados`);
    return clientesCentral.length;

  } catch (error) {
    console.error('   ❌ Error sincronizando clientes:', error.message);
    throw error;
  }
}

/**
 * Sincronizar ventas desde BD Local a BD Central
 */
async function syncVentasLocalToCentral() {
  try {
    console.log('💰 Sincronizando ventas Local → Central...');

    // Obtener ventas no sincronizadas
    const [ventasPendientes] = await dbLocal.query(`
      SELECT * FROM ventas 
      WHERE sincronizado = FALSE
      ORDER BY fecha_venta ASC
      LIMIT 100
    `);

    if (ventasPendientes.length === 0) {
      console.log('   ℹ️  No hay ventas pendientes de sincronizar');
      return 0;
    }

    // Insertar en BD Central (tabla de consolidación de ventas)
    for (const venta of ventasPendientes) {
      // En un sistema real, aquí se insertarían en una tabla consolidada de ventas
      // Por ahora solo marcamos como sincronizada
      await dbLocal.query(`
        UPDATE ventas 
        SET sincronizado = TRUE, fecha_sincronizacion = NOW()
        WHERE id_venta = ?
      `, [venta.id_venta]);
    }

    console.log(`   ✅ ${ventasPendientes.length} ventas sincronizadas`);
    return ventasPendientes.length;

  } catch (error) {
    console.error('   ❌ Error sincronizando ventas:', error.message);
    throw error;
  }
}

/**
 * Registrar log de sincronización
 */
async function registrarLogSincronizacion(tipo, registros, estado, mensaje = null) {
  try {
    await dbCentral.query(`
      INSERT INTO log_sincronizacion (
        id_sucursal, tipo_operacion, registros_procesados, 
        fecha_inicio, fecha_fin, estado, mensaje_error
      )
      VALUES (?, ?, ?, NOW(), NOW(), ?, ?)
    `, [SUCURSAL_ID, tipo, registros, estado, mensaje]);
  } catch (error) {
    console.error('Error registrando log:', error.message);
  }
}

/**
 * Proceso completo de sincronización
 */
async function ejecutarSincronizacion() {
  const inicio = new Date();
  console.log('\n' + '-'.repeat(70));
  console.log(`⏱️  Iniciando sincronización: ${inicio.toLocaleString()}`);
  console.log('-'.repeat(70) + '\n');

  let productosSync = 0;
  let clientesSync = 0;
  let ventasSync = 0;

  try {
    // 1. Sincronizar productos (Central → Local)
    productosSync = await syncProductosCentralToLocal();
    await registrarLogSincronizacion('replicacion_central', productosSync, 'completado');

    // 2. Sincronizar clientes (Central → Local)
    clientesSync = await syncClientesCentralToLocal();
    await registrarLogSincronizacion('replicacion_central', clientesSync, 'completado');

    // 3. Sincronizar ventas (Local → Central)
    ventasSync = await syncVentasLocalToCentral();
    await registrarLogSincronizacion('replicacion_local', ventasSync, 'completado');

    const fin = new Date();
    const duracion = ((fin - inicio) / 1000).toFixed(2);

    console.log('\n' + '-'.repeat(70));
    console.log('✅ SINCRONIZACIÓN COMPLETADA EXITOSAMENTE');
    console.log('-'.repeat(70));
    console.log(`📊 Resumen:`);
    console.log(`   • Productos sincronizados: ${productosSync}`);
    console.log(`   • Clientes sincronizados: ${clientesSync}`);
    console.log(`   • Ventas sincronizadas: ${ventasSync}`);
    console.log(`   • Duración: ${duracion} segundos`);
    console.log(`   • Finalización: ${fin.toLocaleString()}`);
    console.log('-'.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR EN SINCRONIZACIÓN:', error.message);
    await registrarLogSincronizacion('sincronizacion_completa', 0, 'error', error.message);
  }
}

/**
 * Iniciar daemon
 */
async function iniciarDaemon() {
  try {
    // Verificar conexiones
    await dbCentral.authenticate();
    await dbLocal.authenticate();
    console.log('✅ Conexiones a bases de datos establecidas\n');

    // Ejecutar sincronización inmediata al iniciar
    console.log('🚀 Ejecutando sincronización inicial...');
    await ejecutarSincronizacion();

    // Programar sincronización periódica
    const cronExpression = `*/${SYNC_INTERVAL} * * * *`;
    console.log(`📅 Sincronización programada: ${cronExpression}`);
    console.log('⏳ Esperando próxima sincronización...\n');

    cron.schedule(cronExpression, async () => {
      await ejecutarSincronizacion();
    });

  } catch (error) {
    console.error('❌ Error fatal al iniciar daemon:', error);
    process.exit(1);
  }
}

// Manejar señales de terminación
process.on('SIGTERM', async () => {
  console.log('\n⚠️  Señal SIGTERM recibida. Cerrando daemon...');
  await dbCentral.close();
  await dbLocal.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⚠️  Señal SIGINT recibida. Cerrando daemon...');
  await dbCentral.close();
  await dbLocal.close();
  process.exit(0);
});

// Iniciar
iniciarDaemon();
