const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');
const Empleado = require('../models/central/Empleado');

/**
 * Middleware de Autenticación JWT
 * Verifica que el token sea válido y extrae la información del usuario
 */

const authenticateToken = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. No se proporcionó token de autenticación.'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, jwtSecret);

    // Verificar que el empleado existe y está activo
    const empleado = await Empleado.findByPk(decoded.id_empleado);

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'El usuario ya no existe en el sistema.'
      });
    }

    if (empleado.estado !== 'activo') {
      return res.status(403).json({
        success: false,
        message: 'Cuenta de usuario inactiva.'
      });
    }

    // Agregar información del usuario a la petición
    req.user = {
      id_empleado: empleado.id_empleado,
      numero_empleado: empleado.numero_empleado,
      usuario: empleado.usuario,
      nombre: `${empleado.nombre} ${empleado.apellido_paterno}`,
      rol: empleado.rol,
      puesto: empleado.puesto,
      id_sucursal: empleado.id_sucursal
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Por favor inicie sesión nuevamente.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido.'
      });
    }

    console.error('Error en autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en el servidor al verificar autenticación.'
    });
  }
};

module.exports = authenticateToken;
