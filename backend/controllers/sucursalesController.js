const { dbCentral } = require('../config/database');
const { dbLocal } = require('../config/database');

// Obtener todas las sucursales
exports.listarSucursales = async (req, res) => {
  try {
    const [sucursales] = await dbCentral.query(`
      SELECT 
        s.*,
        CONCAT(e.nombre, ' ', e.apellido_paterno) as nombre_gerente
      FROM sucursales s
      LEFT JOIN empleados e ON s.gerente_id = e.id_empleado
      ORDER BY s.codigo_sucursal
    `);

    res.json(sucursales);
  } catch (error) {
    console.error('Error obteniendo sucursales:', error);
    res.status(500).json({ 
      error: 'Error al obtener sucursales',
      detalle: error.message 
    });
  }
};

// Obtener una sucursal por ID
exports.obtenerSucursal = async (req, res) => {
  try {
    const { id } = req.params;

    const [sucursal] = await dbCentral.query(`
      SELECT 
        s.*,
        CONCAT(e.nombre, ' ', e.apellido_paterno) as nombre_gerente,
        e.telefono as telefono_gerente,
        e.email as email_gerente
      FROM sucursales s
      LEFT JOIN empleados e ON s.gerente_id = e.id_empleado
      WHERE s.id_sucursal = ?
    `, [id]);

    if (sucursal.length === 0) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    res.json(sucursal[0]);
  } catch (error) {
    console.error('Error obteniendo sucursal:', error);
    res.status(500).json({ 
      error: 'Error al obtener sucursal',
      detalle: error.message 
    });
  }
};

// Obtener estadísticas de una sucursal
exports.estadisticasSucursal = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener datos de la base central
    const [empleados] = await dbCentral.query(`
      SELECT COUNT(*) as total
      FROM empleados
      WHERE id_sucursal = ? AND estado = 'activo'
    `, [id]);

    const [clientes] = await dbCentral.query(`
      SELECT COUNT(*) as total
      FROM clientes
      WHERE sucursal_registro = ? AND estado = 'activo'
    `, [id]);

    res.json({
      empleados: empleados[0].total,
      clientes: clientes[0].total,
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas',
      detalle: error.message 
    });
  }
};

// Obtener estadísticas detalladas para el admin central
exports.estadisticasDetalladas = async (req, res) => {
  try {
    const { id } = req.params;

    // Información de la sucursal
    const [sucursal] = await dbCentral.query(`
      SELECT 
        s.*,
        CONCAT(e.nombre, ' ', e.apellido_paterno, ' ', e.apellido_materno) as nombre_gerente,
        e.telefono as telefono_gerente,
        e.email as email_gerente,
        e.puesto as puesto_gerente
      FROM sucursales s
      LEFT JOIN empleados e ON s.gerente_id = e.id_empleado
      WHERE s.id_sucursal = ?
    `, [id]);

    if (sucursal.length === 0) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    // Total de empleados activos
    const [totalEmpleados] = await dbCentral.query(`
      SELECT COUNT(*) as total
      FROM empleados
      WHERE id_sucursal = ? AND estado = 'activo'
    `, [id]);

    // Empleados por rol
    const [empleadosPorRol] = await dbCentral.query(`
      SELECT 
        rol,
        COUNT(*) as total
      FROM empleados
      WHERE id_sucursal = ? AND estado = 'activo'
      GROUP BY rol
    `, [id]);

    // Lista de jefes de turno (gerentes y supervisores)
    const [jefesTurno] = await dbCentral.query(`
      SELECT 
        CONCAT(nombre, ' ', apellido_paterno) as nombre_completo,
        numero_empleado,
        puesto,
        turno,
        telefono,
        email
      FROM empleados
      WHERE id_sucursal = ? 
        AND estado = 'activo'
        AND (rol = 'gerente' OR puesto LIKE '%supervisor%' OR puesto LIKE '%jefe%')
      ORDER BY puesto, nombre
    `, [id]);

    // Total de clientes registrados
    const [totalClientes] = await dbCentral.query(`
      SELECT COUNT(*) as total
      FROM clientes
      WHERE sucursal_registro = ? AND estado = 'activo'
    `, [id]);

    // Productos en inventario (base local)
    let inventarioStats = { total: 0, productos_bajo_stock: 0 };
    try {
      const [inventario] = await dbLocal.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN stock_actual <= stock_minimo THEN 1 ELSE 0 END) as productos_bajo_stock
        FROM inventario
        WHERE id_sucursal = ?
      `, [id]);
      
      if (inventario && inventario.length > 0) {
        inventarioStats = inventario[0];
      }
    } catch (error) {
      console.warn('No se pudo obtener información de inventario local:', error.message);
    }

    // Ventas del día (base local)
    let ventasHoy = { total_ventas: 0, monto_total: 0 };
    try {
      const [ventas] = await dbLocal.query(`
        SELECT 
          COUNT(*) as total_ventas,
          COALESCE(SUM(total), 0) as monto_total
        FROM ventas
        WHERE id_sucursal = ? 
          AND DATE(fecha_venta) = CURDATE()
          AND estado = 'completada'
      `, [id]);
      
      if (ventas && ventas.length > 0) {
        ventasHoy = ventas[0];
      }
    } catch (error) {
      console.warn('No se pudo obtener información de ventas locales:', error.message);
    }

    // Ventas del mes (base local)
    let ventasMes = { total_ventas: 0, monto_total: 0 };
    try {
      const [ventas] = await dbLocal.query(`
        SELECT 
          COUNT(*) as total_ventas,
          COALESCE(SUM(total), 0) as monto_total
        FROM ventas
        WHERE id_sucursal = ? 
          AND YEAR(fecha_venta) = YEAR(CURDATE())
          AND MONTH(fecha_venta) = MONTH(CURDATE())
          AND estado = 'completada'
      `, [id]);
      
      if (ventas && ventas.length > 0) {
        ventasMes = ventas[0];
      }
    } catch (error) {
      console.warn('No se pudo obtener información de ventas mensuales:', error.message);
    }

    // Respuesta completa
    res.json({
      sucursal: sucursal[0],
      empleados: {
        total: totalEmpleados[0].total,
        por_rol: empleadosPorRol,
        jefes_turno: jefesTurno
      },
      clientes: {
        total: totalClientes[0].total
      },
      inventario: {
        total_productos: inventarioStats.total || 0,
        productos_bajo_stock: inventarioStats.productos_bajo_stock || 0
      },
      ventas: {
        hoy: {
          cantidad: ventasHoy.total_ventas || 0,
          monto: parseFloat(ventasHoy.monto_total || 0)
        },
        mes: {
          cantidad: ventasMes.total_ventas || 0,
          monto: parseFloat(ventasMes.monto_total || 0)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas detalladas:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas detalladas',
      detalle: error.message 
    });
  }
};

// Obtener datos completos para vista local de una sucursal
exports.datosVistaLocal = async (req, res) => {
  try {
    const { id } = req.params;
    const idSucursal = Number(id);

    if (Number.isNaN(idSucursal)) {
      return res.status(400).json({
        success: false,
        message: 'ID de sucursal inválido.'
      });
    }

    // Solo admin puede consultar cualquier sucursal; otros usuarios solo la suya
    if (req.user.rol !== 'admin' && Number(req.user.id_sucursal) !== idSucursal) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para consultar esta sucursal.'
      });
    }

    const [sucursal] = await dbCentral.query(`
      SELECT id_sucursal, codigo_sucursal, nombre, ciudad, estado_geografico, direccion, telefono, estado_sucursal
      FROM sucursales
      WHERE id_sucursal = ?
      LIMIT 1
    `, { replacements: [idSucursal] });

    if (!sucursal || sucursal.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada.'
      });
    }

    const [clientes] = await dbCentral.query(`
      SELECT
        id_cliente,
        numero_cliente,
        nombre,
        apellido_paterno,
        apellido_materno,
        telefono,
        email,
        puntos_acumulados,
        estado,
        fecha_registro
      FROM clientes
      WHERE sucursal_registro = ?
        AND estado = 'activo'
      ORDER BY fecha_registro DESC
    `, { replacements: [idSucursal] });

    const [empleados] = await dbCentral.query(`
      SELECT
        id_empleado,
        numero_empleado,
        nombre,
        apellido_paterno,
        apellido_materno,
        puesto,
        rol,
        telefono,
        email,
        estado
      FROM empleados
      WHERE id_sucursal = ?
        AND estado = 'activo'
      ORDER BY puesto, apellido_paterno, nombre
    `, { replacements: [idSucursal] });

    let inventario = [];
    try {
      const [inventarioRows] = await dbLocal.query(`
        SELECT
          id_inventario,
          id_producto,
          id_sucursal,
          cantidad_disponible,
          cantidad_minima,
          cantidad_maxima,
          lote,
          fecha_caducidad,
          ubicacion_fisica,
          estado
        FROM inventario
        WHERE id_sucursal = ?
        ORDER BY id_producto ASC
      `, { replacements: [idSucursal] });

      if (inventarioRows.length > 0) {
        const idsProducto = [...new Set(inventarioRows.map(item => item.id_producto))];

        const [productos] = await dbCentral.query(`
          SELECT id_producto, codigo_barras, nombre, categoria
          FROM productos
          WHERE id_producto IN (?)
        `, { replacements: [idsProducto] });

        const productosMap = new Map(productos.map(producto => [producto.id_producto, producto]));

        inventario = inventarioRows.map(item => {
          const producto = productosMap.get(item.id_producto);
          return {
            ...item,
            producto_nombre: producto?.nombre || `Producto #${item.id_producto}`,
            producto_codigo_barras: producto?.codigo_barras || null,
            producto_categoria: producto?.categoria || null
          };
        });
      }
    } catch (error) {
      console.warn('No se pudo obtener inventario local en vista local:', error.message);
    }

    const resumen = {
      productos_en_sucursal: inventario.length,
      inventario_total_unidades: inventario.reduce((total, item) => total + Number(item.cantidad_disponible || 0), 0),
      clientes_activos: clientes.length,
      empleados_activos: empleados.length
    };

    return res.json({
      success: true,
      data: {
        sucursal: sucursal[0],
        resumen,
        clientes,
        empleados,
        inventario
      }
    });
  } catch (error) {
    console.error('Error obteniendo datos de vista local:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener datos de vista local.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
