-- ============================================================================
-- SCHEMA LOCAL - BASE DE DATOS DISTRIBUIDA FARMACIA
-- ============================================================================
-- Este schema contiene las entidades DISTRIBUIDAS específicas de cada sucursal
-- Cada sucursal tiene su propia instancia de estas tablas
-- ============================================================================

-- Base de datos local (reemplazar SUCXXX con el código de sucursal)
-- CREATE DATABASE IF NOT EXISTS farmacia_local_sucursal1;
-- USE farmacia_local_sucursal1;

-- ============================================================================
-- TABLA: inventario (DISTRIBUIDA)
-- Descripción: Inventario local de cada sucursal
-- ============================================================================
CREATE TABLE inventario (
    id_inventario INT PRIMARY KEY AUTO_INCREMENT,
    id_producto INT NOT NULL,
    id_sucursal INT NOT NULL,
    cantidad_disponible INT NOT NULL DEFAULT 0,
    cantidad_minima INT NOT NULL DEFAULT 10,
    cantidad_maxima INT NOT NULL DEFAULT 1000,
    lote VARCHAR(50),
    fecha_caducidad DATE,
    ubicacion_fisica VARCHAR(50), -- Pasillo, anaquel, etc.
    fecha_ultima_entrada TIMESTAMP NULL,
    fecha_ultima_salida TIMESTAMP NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    estado ENUM('disponible', 'por_agotar', 'agotado', 'vencido') DEFAULT 'disponible',
    INDEX idx_producto (id_producto),
    INDEX idx_sucursal (id_sucursal),
    INDEX idx_estado (estado),
    INDEX idx_caducidad (fecha_caducidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: ventas (DISTRIBUIDA)
-- Descripción: Registro de ventas de cada sucursal
-- ============================================================================
CREATE TABLE ventas (
    id_venta BIGINT PRIMARY KEY AUTO_INCREMENT,
    folio_venta VARCHAR(30) UNIQUE NOT NULL,
    id_sucursal INT NOT NULL,
    id_cliente INT NULL, -- NULL si es venta sin cliente registrado
    id_empleado INT NOT NULL, -- Empleado que realizó la venta
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10, 2) NOT NULL,
    descuento DECIMAL(10, 2) DEFAULT 0.00,
    impuestos DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    metodo_pago ENUM('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'vales') NOT NULL,
    puntos_otorgados INT DEFAULT 0,
    receta_medica VARCHAR(100), -- Número de receta si aplica
    nombre_medico VARCHAR(200), -- Médico que recetó
    observaciones TEXT,
    estado ENUM('completada', 'cancelada', 'devolucion_parcial', 'devolucion_total') DEFAULT 'completada',
    sincronizado BOOLEAN DEFAULT FALSE, -- Indica si se sincronizó con BD central
    fecha_sincronizacion TIMESTAMP NULL,
    INDEX idx_folio (folio_venta),
    INDEX idx_sucursal (id_sucursal),
    INDEX idx_cliente (id_cliente),
    INDEX idx_empleado (id_empleado),
    INDEX idx_fecha (fecha_venta),
    INDEX idx_sincronizado (sincronizado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: detalle_venta (DISTRIBUIDA)
-- Descripción: Detalle de productos vendidos en cada venta
-- ============================================================================
CREATE TABLE detalle_venta (
    id_detalle BIGINT PRIMARY KEY AUTO_INCREMENT,
    id_venta BIGINT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    descuento_linea DECIMAL(10, 2) DEFAULT 0.00,
    subtotal_linea DECIMAL(10, 2) NOT NULL,
    lote VARCHAR(50),
    fecha_caducidad DATE,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE,
    INDEX idx_venta (id_venta),
    INDEX idx_producto (id_producto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: compras (DISTRIBUIDA)
-- Descripción: Compras realizadas por cada sucursal a proveedores
-- ============================================================================
CREATE TABLE compras (
    id_compra BIGINT PRIMARY KEY AUTO_INCREMENT,
    folio_compra VARCHAR(30) UNIQUE NOT NULL,
    id_sucursal INT NOT NULL,
    id_proveedor INT NOT NULL,
    id_empleado INT NOT NULL, -- Empleado que registró la compra
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_recepcion TIMESTAMP NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    impuestos DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    factura_proveedor VARCHAR(50),
    orden_compra VARCHAR(50),
    observaciones TEXT,
    estado ENUM('pendiente', 'recibida_parcial', 'recibida_completa', 'cancelada') DEFAULT 'pendiente',
    sincronizado BOOLEAN DEFAULT FALSE,
    fecha_sincronizacion TIMESTAMP NULL,
    INDEX idx_folio (folio_compra),
    INDEX idx_sucursal (id_sucursal),
    INDEX idx_proveedor (id_proveedor),
    INDEX idx_fecha (fecha_compra),
    INDEX idx_sincronizado (sincronizado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: detalle_compra (DISTRIBUIDA)
-- Descripción: Detalle de productos en cada compra
-- ============================================================================
CREATE TABLE detalle_compra (
    id_detalle BIGINT PRIMARY KEY AUTO_INCREMENT,
    id_compra BIGINT NOT NULL,
    id_producto INT NOT NULL,
    cantidad_solicitada INT NOT NULL,
    cantidad_recibida INT DEFAULT 0,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal_linea DECIMAL(12, 2) NOT NULL,
    lote VARCHAR(50),
    fecha_caducidad DATE,
    FOREIGN KEY (id_compra) REFERENCES compras(id_compra) ON DELETE CASCADE,
    INDEX idx_compra (id_compra),
    INDEX idx_producto (id_producto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: movimientos_inventario (DISTRIBUIDA)
-- Descripción: Registro de movimientos de inventario (entradas, salidas, ajustes)
-- ============================================================================
CREATE TABLE movimientos_inventario (
    id_movimiento BIGINT PRIMARY KEY AUTO_INCREMENT,
    id_sucursal INT NOT NULL,
    id_producto INT NOT NULL,
    tipo_movimiento ENUM('entrada_compra', 'salida_venta', 'ajuste_inventario', 'merma', 'devolucion_proveedor', 'devolucion_cliente', 'transferencia_entrada', 'transferencia_salida') NOT NULL,
    cantidad INT NOT NULL,
    referencia_id BIGINT, -- ID de venta, compra, o ajuste
    id_empleado INT NOT NULL,
    lote VARCHAR(50),
    fecha_caducidad DATE,
    observaciones TEXT,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sucursal_producto (id_sucursal, id_producto),
    INDEX idx_tipo (tipo_movimiento),
    INDEX idx_fecha (fecha_movimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: caja (DISTRIBUIDA)
-- Descripción: Registro de apertura y cierre de cajas por turno
-- ============================================================================
CREATE TABLE caja (
    id_caja INT PRIMARY KEY AUTO_INCREMENT,
    id_sucursal INT NOT NULL,
    id_empleado INT NOT NULL,
    numero_caja INT NOT NULL,
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP NULL,
    monto_inicial DECIMAL(10, 2) NOT NULL,
    total_efectivo DECIMAL(10, 2),
    total_tarjeta DECIMAL(10, 2),
    total_transferencia DECIMAL(10, 2),
    total_otros DECIMAL(10, 2),
    total_ventas DECIMAL(10, 2),
    monto_cierre DECIMAL(10, 2),
    diferencia DECIMAL(10, 2),
    observaciones TEXT,
    estado ENUM('abierta', 'cerrada') DEFAULT 'abierta',
    INDEX idx_sucursal (id_sucursal),
    INDEX idx_empleado (id_empleado),
    INDEX idx_fecha_apertura (fecha_apertura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: clientes_local (DISTRIBUIDA - CACHÉ)
-- Descripción: Caché local de clientes para operación offline
-- ============================================================================
CREATE TABLE clientes_local (
    id_cliente INT PRIMARY KEY,
    numero_cliente VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    puntos_acumulados INT DEFAULT 0,
    descuento_preferente DECIMAL(5, 2) DEFAULT 0.00,
    fecha_ultima_sincronizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_numero_cliente (numero_cliente),
    INDEX idx_telefono (telefono)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: productos_local (DISTRIBUIDA - CACHÉ)
-- Descripción: Caché local de productos para operación offline
-- ============================================================================
CREATE TABLE productos_local (
    id_producto INT PRIMARY KEY,
    codigo_barras VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    precio_venta DECIMAL(10, 2) NOT NULL,
    requiere_receta BOOLEAN DEFAULT FALSE,
    laboratorio VARCHAR(150),
    presentacion VARCHAR(100),
    estado ENUM('activo', 'inactivo', 'descontinuado') DEFAULT 'activo',
    fecha_ultima_sincronizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_codigo_barras (codigo_barras),
    INDEX idx_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DATOS DE EJEMPLO - SUCURSAL 001
-- ============================================================================

-- Insertar inventario inicial
INSERT INTO inventario (id_producto, id_sucursal, cantidad_disponible, cantidad_minima, cantidad_maxima, lote, fecha_caducidad, ubicacion_fisica) VALUES
(1, 1, 150, 20, 500, 'LOT2024001', '2026-12-31', 'A1-E1'),
(2, 1, 200, 30, 600, 'LOT2024002', '2026-11-30', 'A1-E2'),
(3, 1, 80, 15, 300, 'LOT2024003', '2025-08-15', 'A2-E1'),
(4, 1, 120, 20, 400, 'LOT2024004', '2026-06-30', 'A2-E2'),
(5, 1, 100, 15, 350, 'LOT2024005', '2026-09-30', 'A1-E3');

-- Insertar venta de ejemplo
INSERT INTO ventas (folio_venta, id_sucursal, id_cliente, id_empleado, subtotal, descuento, impuestos, total, metodo_pago, puntos_otorgados) VALUES
('V001-20260405-0001', 1, 1, 2, 200.00, 20.00, 28.80, 208.80, 'efectivo', 20);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, descuento_linea, subtotal_linea, lote) VALUES
(1, 1, 2, 35.50, 0.00, 71.00, 'LOT2024001'),
(1, 2, 2, 45.00, 0.00, 90.00, 'LOT2024002'),
(1, 5, 1, 95.00, 20.00, 75.00, 'LOT2024005');

-- Insertar compra de ejemplo
INSERT INTO compras (folio_compra, id_sucursal, id_proveedor, id_empleado, subtotal, impuestos, total, factura_proveedor, orden_compra) VALUES
('C001-20260405-0001', 1, 1, 1, 5000.00, 800.00, 5800.00, 'FAC-001234', 'OC-2026-001');

INSERT INTO detalle_compra (id_compra, id_producto, cantidad_solicitada, cantidad_recibida, precio_unitario, subtotal_linea, lote, fecha_caducidad) VALUES
(1, 1, 100, 100, 20.00, 2000.00, 'LOT2024001', '2026-12-31'),
(1, 2, 100, 100, 25.00, 2500.00, 'LOT2024002', '2026-11-30'),
(1, 5, 20, 20, 55.00, 1100.00, 'LOT2024005', '2026-09-30');

-- ============================================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA DE INVENTARIO
-- ============================================================================

DELIMITER $$

-- Trigger para actualizar inventario después de una venta
CREATE TRIGGER after_detalle_venta_insert
AFTER INSERT ON detalle_venta
FOR EACH ROW
BEGIN
    UPDATE inventario 
    SET cantidad_disponible = cantidad_disponible - NEW.cantidad,
        fecha_ultima_salida = NOW()
    WHERE id_producto = NEW.id_producto 
    AND id_sucursal = (SELECT id_sucursal FROM ventas WHERE id_venta = NEW.id_venta);
    
    -- Actualizar estado según cantidad
    UPDATE inventario 
    SET estado = CASE 
        WHEN cantidad_disponible = 0 THEN 'agotado'
        WHEN cantidad_disponible <= cantidad_minima THEN 'por_agotar'
        WHEN fecha_caducidad < CURDATE() THEN 'vencido'
        ELSE 'disponible'
    END
    WHERE id_producto = NEW.id_producto 
    AND id_sucursal = (SELECT id_sucursal FROM ventas WHERE id_venta = NEW.id_venta);
END$$

-- Trigger para actualizar inventario después de una compra recibida
CREATE TRIGGER after_detalle_compra_update
AFTER UPDATE ON detalle_compra
FOR EACH ROW
BEGIN
    IF NEW.cantidad_recibida > OLD.cantidad_recibida THEN
        UPDATE inventario 
        SET cantidad_disponible = cantidad_disponible + (NEW.cantidad_recibida - OLD.cantidad_recibida),
            fecha_ultima_entrada = NOW()
        WHERE id_producto = NEW.id_producto 
        AND id_sucursal = (SELECT id_sucursal FROM compras WHERE id_compra = NEW.id_compra);
        
        -- Actualizar estado
        UPDATE inventario 
        SET estado = CASE 
            WHEN cantidad_disponible = 0 THEN 'agotado'
            WHEN cantidad_disponible <= cantidad_minima THEN 'por_agotar'
            WHEN fecha_caducidad < CURDATE() THEN 'vencido'
            ELSE 'disponible'
        END
        WHERE id_producto = NEW.id_producto 
        AND id_sucursal = (SELECT id_sucursal FROM compras WHERE id_compra = NEW.id_compra);
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista de productos con bajo inventario
CREATE VIEW v_productos_bajo_stock AS
SELECT 
    i.id_inventario,
    i.id_sucursal,
    pl.codigo_barras,
    pl.nombre,
    i.cantidad_disponible,
    i.cantidad_minima,
    i.estado,
    i.fecha_caducidad
FROM inventario i
JOIN productos_local pl ON i.id_producto = pl.id_producto
WHERE i.cantidad_disponible <= i.cantidad_minima
AND i.estado != 'vencido';

-- Vista de productos próximos a vencer
CREATE VIEW v_productos_proximos_vencer AS
SELECT 
    i.id_inventario,
    i.id_sucursal,
    pl.codigo_barras,
    pl.nombre,
    i.cantidad_disponible,
    i.lote,
    i.fecha_caducidad,
    DATEDIFF(i.fecha_caducidad, CURDATE()) as dias_restantes
FROM inventario i
JOIN productos_local pl ON i.id_producto = pl.id_producto
WHERE i.fecha_caducidad BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
AND i.cantidad_disponible > 0
ORDER BY i.fecha_caducidad;

-- Vista de ventas del día
CREATE VIEW v_ventas_dia AS
SELECT 
    v.id_venta,
    v.folio_venta,
    v.fecha_venta,
    CONCAT(cl.nombre, ' ', cl.apellido_paterno) as cliente,
    v.total,
    v.metodo_pago,
    v.estado
FROM ventas v
LEFT JOIN clientes_local cl ON v.id_cliente = cl.id_cliente
WHERE DATE(v.fecha_venta) = CURDATE()
ORDER BY v.fecha_venta DESC;
