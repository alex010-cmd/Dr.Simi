require('dotenv').config();

/**
 * Configuración de Autenticación JWT
 */

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'farmacia_secret_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'farmacia_refresh_secret_key',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Opciones de bcrypt
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,
  
  // Roles y permisos
  roles: {
    ADMIN: 'admin',
    GERENTE: 'gerente',
    EMPLEADO: 'empleado'
  },
  
  // Permisos por rol
  permissions: {
    admin: [
      'all'
    ],
    gerente: [
      'ventas:read',
      'ventas:create',
      'ventas:delete',
      'inventario:read',
      'inventario:update',
      'compras:read',
      'compras:create',
      'reportes:read',
      'clientes:all',
      'empleados:read'
    ],
    empleado: [
      'ventas:read',
      'ventas:create',
      'inventario:read',
      'clientes:read',
      'clientes:create'
    ]
  }
};
