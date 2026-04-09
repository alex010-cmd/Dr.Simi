-- ============================================================================
-- SCHEMA CENTRAL - BASE DE DATOS DISTRIBUIDA FARMACIA
-- ============================================================================
-- Este schema contiene las entidades CENTRALIZADAS que se comparten
-- entre todas las sucursales de la farmacia
-- ============================================================================

-- Base de datos central
CREATE DATABASE IF NOT EXISTS farmacia_central;
USE farmacia_central;

-- ============================================================================
-- TABLA: productos (CENTRALIZADA)
-- Descripción: Catálogo maestro de productos de todas las sucursales
-- ============================================================================
CREATE TABLE productos (
    id_producto INT PRIMARY KEY AUTO_INCREMENT,
    codigo_barras VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100) NOT NULL,
    precio_venta DECIMAL(10, 2) NOT NULL,
    precio_compra DECIMAL(10, 2) NOT NULL,
    requiere_receta BOOLEAN DEFAULT FALSE,
    sustancia_activa VARCHAR(200),
    laboratorio VARCHAR(150),
    presentacion VARCHAR(100),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    estado ENUM('activo', 'inactivo', 'descontinuado') DEFAULT 'activo',
    INDEX idx_categoria (categoria),
    INDEX idx_laboratorio (laboratorio),
    INDEX idx_codigo_barras (codigo_barras)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: proveedores (CENTRALIZADA)
-- Descripción: Catálogo de proveedores para todas las sucursales
-- ============================================================================
CREATE TABLE proveedores (
    id_proveedor INT PRIMARY KEY AUTO_INCREMENT,
    razon_social VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(200),
    rfc VARCHAR(13) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    ciudad VARCHAR(100),
    estado_geografico VARCHAR(100),
    codigo_postal VARCHAR(10),
    contacto_principal VARCHAR(150),
    telefono_contacto VARCHAR(20),
    dias_credito INT DEFAULT 0,
    limite_credito DECIMAL(12, 2) DEFAULT 0.00,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    estado ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo',
    INDEX idx_rfc (rfc),
    INDEX idx_razon_social (razon_social)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: empleados (CENTRALIZADA)
-- Descripción: Registro de empleados de todas las sucursales
-- ============================================================================
CREATE TABLE empleados (
    id_empleado INT PRIMARY KEY AUTO_INCREMENT,
    numero_empleado VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    curp VARCHAR(18) UNIQUE,
    rfc VARCHAR(13),
    fecha_nacimiento DATE,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    ciudad VARCHAR(100),
    estado_geografico VARCHAR(100),
    codigo_postal VARCHAR(10),
    id_sucursal INT NOT NULL,
    puesto ENUM('gerente', 'farmaceutico', 'vendedor', 'cajero', 'almacenista', 'auxiliar') NOT NULL,
    cedula_profesional VARCHAR(20),
    fecha_contratacion DATE NOT NULL,
    salario DECIMAL(10, 2),
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'gerente', 'empleado') DEFAULT 'empleado',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    estado ENUM('activo', 'inactivo', 'baja') DEFAULT 'activo',
    INDEX idx_numero_empleado (numero_empleado),
    INDEX idx_sucursal (id_sucursal),
    INDEX idx_usuario (usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: sucursales (CENTRALIZADA)
-- Descripción: Catálogo de sucursales de la farmacia
-- ============================================================================
CREATE TABLE sucursales (
    id_sucursal INT PRIMARY KEY AUTO_INCREMENT,
    codigo_sucursal VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    estado_geografico VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(10),
    telefono VARCHAR(20),
    email VARCHAR(100),
    gerente_id INT,
    servidor_bd VARCHAR(100) NOT NULL, -- IP o hostname del servidor de BD local
    puerto_bd INT DEFAULT 3306,
    nombre_bd VARCHAR(100) NOT NULL,
    fecha_apertura DATE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_sucursal ENUM('activa', 'inactiva', 'mantenimiento') DEFAULT 'activa',
    FOREIGN KEY (gerente_id) REFERENCES empleados(id_empleado),
    INDEX idx_codigo_sucursal (codigo_sucursal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: log_sincronizacion (CENTRALIZADA)
-- Descripción: Registro de sincronizaciones entre BD central y locales
-- ============================================================================
CREATE TABLE log_sincronizacion (
    id_log BIGINT PRIMARY KEY AUTO_INCREMENT,
    id_sucursal INT NOT NULL,
    tipo_operacion ENUM('replicacion_central', 'replicacion_local', 'sincronizacion_completa') NOT NULL,
    tabla_afectada VARCHAR(100),
    registros_procesados INT DEFAULT 0,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP NULL,
    estado ENUM('en_proceso', 'completado', 'error') DEFAULT 'en_proceso',
    mensaje_error TEXT,
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal),
    INDEX idx_sucursal_fecha (id_sucursal, fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: clientes (CENTRALIZADA)
-- Descripción: Base de datos unificada de clientes de todas las sucursales
-- ============================================================================
CREATE TABLE clientes (
    id_cliente INT PRIMARY KEY AUTO_INCREMENT,
    numero_cliente VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    fecha_nacimiento DATE,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    ciudad VARCHAR(100),
    estado_geografico VARCHAR(100),
    codigo_postal VARCHAR(10),
    rfc VARCHAR(13),
    sucursal_registro INT NOT NULL, -- Sucursal donde se registró originalmente
    puntos_acumulados INT DEFAULT 0,
    descuento_preferente DECIMAL(5, 2) DEFAULT 0.00,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    FOREIGN KEY (sucursal_registro) REFERENCES sucursales(id_sucursal),
    INDEX idx_numero_cliente (numero_cliente),
    INDEX idx_telefono (telefono),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DATOS DE EJEMPLO
-- ============================================================================

-- Insertar sucursales
INSERT INTO sucursales (codigo_sucursal, nombre, direccion, ciudad, estado_geografico, telefono, servidor_bd, nombre_bd, fecha_apertura) VALUES
('SUC001', 'Farmacia Centro', 'Av. Principal 123', 'Ciudad de México', 'CDMX', '5512345678', 'localhost', 'farmacia_suc001', '2020-01-15'),
('SUC002', 'Farmacia Norte', 'Blvd. Norte 456', 'Monterrey', 'Nuevo León', '8187654321', '192.168.1.100', 'farmacia_suc002', '2020-06-20'),
('SUC003', 'Farmacia Sur', 'Calle Sur 789', 'Guadalajara', 'Jalisco', '3398765432', '192.168.1.101', 'farmacia_suc003', '2021-03-10');

-- Insertar empleados
INSERT INTO empleados (numero_empleado, nombre, apellido_paterno, apellido_materno, id_sucursal, puesto, fecha_contratacion, usuario, password_hash, rol) VALUES
('EMP001', 'Juan', 'Pérez', 'García', 1, 'gerente', '2020-01-15', 'jperez', '$2b$10$encrypted_password_here', 'gerente'),
('EMP002', 'María', 'López', 'Hernández', 1, 'farmaceutico', '2020-02-01', 'mlopez', '$2b$10$encrypted_password_here', 'empleado'),
('EMP003', 'Carlos', 'Ramírez', 'Torres', 2, 'gerente', '2020-06-20', 'cramirez', '$2b$10$encrypted_password_here', 'gerente');

-- Insertar proveedores
INSERT INTO proveedores (razon_social, nombre_comercial, rfc, telefono, email, ciudad, estado_geografico, dias_credito, limite_credito) VALUES
('Laboratorios Farma SA de CV', 'LabFarma', 'LFA850101ABC', '5551234567', 'ventas@labfarma.com', 'Ciudad de México', 'CDMX', 30, 500000.00),
('Distribuidora Médica del Norte', 'MediNorte', 'DMN900215XYZ', '8187654321', 'contacto@medinorte.com', 'Monterrey', 'Nuevo León', 15, 300000.00),
('Productos Farmacéuticos Guadalajara', 'FarmaGDL', 'PFG910320QRS', '3398765432', 'ventas@farmagdl.com', 'Guadalajara', 'Jalisco', 30, 400000.00);

-- Insertar productos
INSERT INTO productos (codigo_barras, nombre, descripcion, categoria, precio_venta, precio_compra, requiere_receta, sustancia_activa, laboratorio, presentacion) VALUES
('7501234567890', 'Paracetamol 500mg', 'Analgésico y antipirético', 'Analgésicos', 35.50, 20.00, FALSE, 'Paracetamol', 'LabFarma', 'Caja con 20 tabletas'),
('7501234567891', 'Ibuprofeno 400mg', 'Antiinflamatorio no esteroideo', 'Antiinflamatorios', 45.00, 25.00, FALSE, 'Ibuprofeno', 'LabFarma', 'Caja con 30 tabletas'),
('7501234567892', 'Amoxicilina 500mg', 'Antibiótico de amplio espectro', 'Antibióticos', 120.00, 70.00, TRUE, 'Amoxicilina', 'MediNorte', 'Caja con 12 cápsulas'),
('7501234567893', 'Losartán 50mg', 'Antihipertensivo', 'Cardiovasculares', 85.00, 50.00, TRUE, 'Losartán', 'FarmaGDL', 'Caja con 30 tabletas'),
('7501234567894', 'Omeprazol 20mg', 'Inhibidor de la bomba de protones', 'Gastrointestinales', 95.00, 55.00, FALSE, 'Omeprazol', 'LabFarma', 'Caja con 14 cápsulas');

-- Insertar clientes
INSERT INTO clientes (numero_cliente, nombre, apellido_paterno, apellido_materno, telefono, email, ciudad, estado_geografico, sucursal_registro, puntos_acumulados) VALUES
('CLI0001', 'Ana', 'Martínez', 'Sánchez', '5512341234', 'ana.martinez@email.com', 'Ciudad de México', 'CDMX', 1, 150),
('CLI0002', 'Roberto', 'González', 'Ruiz', '8187651234', 'roberto.gonzalez@email.com', 'Monterrey', 'Nuevo León', 2, 230),
('CLI0003', 'Laura', 'Fernández', 'Castro', '3398761234', 'laura.fernandez@email.com', 'Guadalajara', 'Jalisco', 3, 80);
