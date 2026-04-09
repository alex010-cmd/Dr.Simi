const { permissions } = require('../config/auth');

/**
 * Middleware de Autorización
 * Verifica que el usuario tenga permisos para realizar la acción
 */

/**
 * Autorizar por rol
 * @param {Array} allowedRoles - Roles permitidos para acceder
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado.'
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para realizar esta acción.'
      });
    }

    next();
  };
};

/**
 * Autorizar por permiso específico
 * @param {String} requiredPermission - Permiso requerido (ej: 'ventas:create')
 */
const authorizePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado.'
      });
    }

    const userRole = req.user.rol;
    const userPermissions = permissions[userRole] || [];

    // Admin tiene todos los permisos
    if (userPermissions.includes('all')) {
      return next();
    }

    // Verificar permiso específico
    const hasPermission = userPermissions.some(permission => {
      if (permission === requiredPermission) return true;
      
      // Verificar permisos comodín (ej: 'clientes:all' permite 'clientes:create')
      const [resource, action] = permission.split(':');
      const [reqResource, reqAction] = requiredPermission.split(':');
      
      return resource === reqResource && action === 'all';
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `No tiene permiso para: ${requiredPermission}`
      });
    }

    next();
  };
};

/**
 * Verificar acceso a sucursal
 * Los empleados solo pueden acceder a datos de su propia sucursal
 * (excepto admin que puede acceder a todas)
 */
const authorizeSucursal = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado.'
    });
  }

  // Admin puede acceder a cualquier sucursal
  if (req.user.rol === 'admin') {
    return next();
  }

  // Obtener id_sucursal de la petición (puede venir en params, body o query)
  const requestedSucursal = 
    req.params.id_sucursal || 
    req.body.id_sucursal || 
    req.query.id_sucursal;

  if (requestedSucursal && parseInt(requestedSucursal) !== req.user.id_sucursal) {
    return res.status(403).json({
      success: false,
      message: 'No tiene acceso a esta sucursal.'
    });
  }

  next();
};

module.exports = {
  authorizeRoles,
  authorizePermission,
  authorizeSucursal
};
