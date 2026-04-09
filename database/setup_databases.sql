-- Script de configuración de bases de datos
-- Ejecutar con: sudo mariadb < setup_databases.sql

-- Crear base de datos central
CREATE DATABASE IF NOT EXISTS farmacia_central CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear base de datos local (sucursal 1)
CREATE DATABASE IF NOT EXISTS farmacia_local_sucursal1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario para la aplicación
CREATE USER IF NOT EXISTS 'farmacia_user'@'localhost' IDENTIFIED BY 'farmacia_password_2024';

-- Otorgar permisos al usuario
GRANT ALL PRIVILEGES ON farmacia_central.* TO 'farmacia_user'@'localhost';
GRANT ALL PRIVILEGES ON farmacia_local_sucursal1.* TO 'farmacia_user'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Mostrar bases de datos creadas
SHOW DATABASES;

-- Mostrar mensaje de confirmación
SELECT 'Bases de datos creadas exitosamente!' AS mensaje;
