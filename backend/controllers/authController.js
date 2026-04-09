const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Empleado = require('../models/central/Empleado');
const { jwtSecret, jwtExpiresIn, bcryptSaltRounds } = require('../config/auth');

/**
 * Código único para registro de Admin Central
 * Este código debe ser proporcionado solo a usuarios autorizados
 */
const ADMIN_CENTRAL_CODE = 'SR123456789SR';

/**
 * Controlador de Autenticación
 */

class AuthController {
  /**
   * Login de usuario
   * POST /api/auth/login
   */
  static async login(req, res) {
    try {
      const { usuario, password } = req.body;

      // Validar datos
      if (!usuario || !password) {
        return res.status(400).json({
          success: false,
          message: 'Usuario y contraseña son requeridos.'
        });
      }

      // Buscar empleado con password (usar scope withPassword)
      const empleado = await Empleado.scope('withPassword').findOne({
        where: { usuario }
      });

      if (!empleado) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas.'
        });
      }

      // Verificar estado del empleado
      if (empleado.estado !== 'activo') {
        return res.status(403).json({
          success: false,
          message: 'Cuenta de usuario inactiva. Contacte al administrador.'
        });
      }

      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(password, empleado.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas.'
        });
      }

      // Generar token JWT
      const token = jwt.sign(
        {
          id_empleado: empleado.id_empleado,
          usuario: empleado.usuario,
          rol: empleado.rol,
          id_sucursal: empleado.id_sucursal
        },
        jwtSecret,
        { expiresIn: jwtExpiresIn }
      );

      // Respuesta exitosa
      res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
          token,
          empleado: {
            id_empleado: empleado.id_empleado,
            numero_empleado: empleado.numero_empleado,
            nombre: empleado.nombre,
            apellido_paterno: empleado.apellido_paterno,
            apellido_materno: empleado.apellido_materno,
            usuario: empleado.usuario,
            rol: empleado.rol,
            puesto: empleado.puesto,
            id_sucursal: empleado.id_sucursal,
            email: empleado.email
          }
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor al iniciar sesión.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Registro de nuevo empleado
   * POST /api/auth/register
   */
  static async register(req, res) {
    try {
      const {
        // Datos personales
        nombre,
        apellido_paterno,
        apellido_materno,
        curp,
        rfc,
        fecha_nacimiento,
        telefono,
        email,
        // Dirección
        direccion,
        ciudad,
        estado_geografico,
        codigo_postal,
        // Datos laborales
        id_sucursal,
        puesto,
        cedula_profesional,
        salario,
        // Credenciales
        usuario,
        password,
        // Código de admin (opcional)
        codigo_admin
      } = req.body;

      // Validaciones básicas
      if (!nombre || !apellido_paterno || !usuario || !password || !id_sucursal || !puesto) {
        return res.status(400).json({
          success: false,
          message: 'Los campos nombre, apellido paterno, usuario, contraseña, sucursal y puesto son obligatorios.'
        });
      }

      // Validar longitud de contraseña
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres.'
        });
      }

      // Verificar si el usuario ya existe
      const usuarioExistente = await Empleado.findOne({ where: { usuario } });
      if (usuarioExistente) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de usuario ya está en uso.'
        });
      }

      // Determinar el rol del usuario
      let rol = 'empleado';
      
      // Si se proporcionó código de admin, validarlo
      if (codigo_admin) {
        if (codigo_admin === ADMIN_CENTRAL_CODE) {
          rol = 'admin';
        } else {
          return res.status(400).json({
            success: false,
            message: 'Código de administrador inválido.'
          });
        }
      } else if (puesto === 'gerente') {
        rol = 'gerente';
      }

      // Generar número de empleado único y robusto
      const maxIdEmpleado = await Empleado.max('id_empleado');
      let siguienteNumero = (maxIdEmpleado || 0) + 1;
      let nuevoNumero = `EMP${String(siguienteNumero).padStart(3, '0')}`;

      // Evitar colisiones si existen numeraciones manuales/atípicas
      let numeroExiste = await Empleado.findOne({
        where: { numero_empleado: nuevoNumero },
        attributes: ['id_empleado']
      });

      while (numeroExiste) {
        siguienteNumero += 1;
        nuevoNumero = `EMP${String(siguienteNumero).padStart(3, '0')}`;
        numeroExiste = await Empleado.findOne({
          where: { numero_empleado: nuevoNumero },
          attributes: ['id_empleado']
        });
      }

      // Encriptar contraseña con bcrypt
      const salt = await bcrypt.genSalt(bcryptSaltRounds);
      const password_hash = await bcrypt.hash(password, salt);

      // Crear empleado con datos encriptados
      const nuevoEmpleado = await Empleado.create({
        numero_empleado: nuevoNumero,
        nombre,
        apellido_paterno,
        apellido_materno,
        curp,
        rfc,
        fecha_nacimiento,
        telefono,
        email,
        direccion,
        ciudad,
        estado_geografico,
        codigo_postal,
        id_sucursal,
        puesto,
        cedula_profesional,
        fecha_contratacion: new Date(),
        salario,
        usuario,
        password_hash,
        rol,
        estado: 'activo'
      });

      // Generar token JWT automáticamente
      const token = jwt.sign(
        {
          id_empleado: nuevoEmpleado.id_empleado,
          usuario: nuevoEmpleado.usuario,
          rol: nuevoEmpleado.rol,
          id_sucursal: nuevoEmpleado.id_sucursal
        },
        jwtSecret,
        { expiresIn: jwtExpiresIn }
      );

      // Respuesta exitosa
      res.status(201).json({
        success: true,
        message: 'Registro exitoso. Bienvenido al sistema.',
        data: {
          token,
          empleado: {
            id_empleado: nuevoEmpleado.id_empleado,
            numero_empleado: nuevoEmpleado.numero_empleado,
            nombre: nuevoEmpleado.nombre,
            apellido_paterno: nuevoEmpleado.apellido_paterno,
            apellido_materno: nuevoEmpleado.apellido_materno,
            usuario: nuevoEmpleado.usuario,
            rol: nuevoEmpleado.rol,
            puesto: nuevoEmpleado.puesto,
            id_sucursal: nuevoEmpleado.id_sucursal,
            email: nuevoEmpleado.email
          }
        }
      });

    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor al registrar usuario.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Cambiar contraseña
   * POST /api/auth/change-password
   */
  static async changePassword(req, res) {
    try {
      const { id_empleado } = req.user;
      const { currentPassword, newPassword } = req.body;

      // Validar datos
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual y nueva contraseña son requeridas.'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres.'
        });
      }

      // Buscar empleado
      const empleado = await Empleado.scope('withPassword').findByPk(id_empleado);

      // Verificar contraseña actual
      const isPasswordValid = await bcrypt.compare(currentPassword, empleado.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'La contraseña actual es incorrecta.'
        });
      }

      // Hash de nueva contraseña
      const salt = await bcrypt.genSalt(bcryptSaltRounds);
      const newPasswordHash = await bcrypt.hash(newPassword, salt);

      // Actualizar contraseña
      await empleado.update({ password_hash: newPasswordHash });

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente.'
      });

    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor al cambiar contraseña.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener información del usuario autenticado
   * GET /api/auth/me
   */
  static async getCurrentUser(req, res) {
    try {
      const { id_empleado } = req.user;

      const empleado = await Empleado.findByPk(id_empleado);

      if (!empleado) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado.'
        });
      }

      res.json({
        success: true,
        data: empleado
      });

    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Logout (invalida token en el cliente)
   * POST /api/auth/logout
   */
  static async logout(req, res) {
    // En JWT, el logout se maneja del lado del cliente eliminando el token
    // Aquí podríamos agregar el token a una lista negra si fuera necesario
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente.'
    });
  }
}

module.exports = AuthController;
