const Cliente = require('../models/central/Cliente');

/**
 * Controlador de Clientes
 * Gestiona las operaciones CRUD de clientes en la base de datos central
 */

// Listar todos los clientes
exports.listarClientes = async (req, res) => {
  try {
    const { sucursal, estado, search } = req.query;
    
    let whereClause = {};
    
    // Filtrar por sucursal si se especifica
    if (sucursal) {
      whereClause.sucursal_registro = sucursal;
    }
    
    // Filtrar por estado si se especifica
    if (estado) {
      whereClause.estado = estado;
    }
    
    // Búsqueda por nombre, teléfono o RFC
    if (search) {
      const { Op } = require('sequelize');
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { nombre: { [Op.like]: `%${search}%` } },
          { apellido_paterno: { [Op.like]: `%${search}%` } },
          { apellido_materno: { [Op.like]: `%${search}%` } },
          { telefono: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { rfc: { [Op.like]: `%${search}%` } },
          { numero_cliente: { [Op.like]: `%${search}%` } }
        ]
      };
    }
    
    const clientes = await Cliente.findAll({
      where: whereClause,
      order: [['fecha_registro', 'DESC']]
    });
    
    res.json(clientes);
  } catch (error) {
    console.error('Error listando clientes:', error);
    res.status(500).json({ 
      error: 'Error al listar clientes',
      detalle: error.message 
    });
  }
};

// Obtener un cliente por ID
exports.obtenerCliente = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cliente = await Cliente.findByPk(id);
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    res.json(cliente);
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({ 
      error: 'Error al obtener cliente',
      detalle: error.message 
    });
  }
};

// Crear un nuevo cliente
exports.crearCliente = async (req, res) => {
  try {
    const {
      nombre,
      apellido_paterno,
      apellido_materno,
      fecha_nacimiento,
      telefono,
      email,
      direccion,
      ciudad,
      estado,
      codigo_postal,
      rfc,
      sucursal_registro
    } = req.body;
    
    // Validar campos requeridos
    if (!nombre || !apellido_paterno || !sucursal_registro) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: nombre, apellido_paterno, sucursal_registro' 
      });
    }
    
    // Generar número de cliente único
    const ultimoCliente = await Cliente.findOne({
      order: [['id_cliente', 'DESC']]
    });
    
    const siguienteNumero = ultimoCliente 
      ? parseInt(ultimoCliente.numero_cliente.replace('CLI', '')) + 1 
      : 1;
    
    const numero_cliente = `CLI${String(siguienteNumero).padStart(6, '0')}`;
    
    // Crear el cliente
    const nuevoCliente = await Cliente.create({
      numero_cliente,
      nombre,
      apellido_paterno,
      apellido_materno,
      fecha_nacimiento,
      telefono,
      email,
      direccion,
      ciudad,
      estado,
      codigo_postal,
      rfc,
      sucursal_registro,
      fecha_registro: new Date(),
      fecha_actualizacion: new Date()
    });
    
    res.status(201).json({
      mensaje: 'Cliente creado exitosamente',
      cliente: nuevoCliente
    });
  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({ 
      error: 'Error al crear cliente',
      detalle: error.message 
    });
  }
};

// Actualizar un cliente
exports.actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      apellido_paterno,
      apellido_materno,
      fecha_nacimiento,
      telefono,
      email,
      direccion,
      ciudad,
      estado,
      codigo_postal,
      rfc,
      descuento_preferente,
      estado: estadoCliente
    } = req.body;
    
    const cliente = await Cliente.findByPk(id);
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    // Actualizar campos
    await cliente.update({
      nombre: nombre || cliente.nombre,
      apellido_paterno: apellido_paterno || cliente.apellido_paterno,
      apellido_materno: apellido_materno !== undefined ? apellido_materno : cliente.apellido_materno,
      fecha_nacimiento: fecha_nacimiento || cliente.fecha_nacimiento,
      telefono: telefono || cliente.telefono,
      email: email || cliente.email,
      direccion: direccion || cliente.direccion,
      ciudad: ciudad || cliente.ciudad,
      estado: estado || cliente.estado,
      codigo_postal: codigo_postal || cliente.codigo_postal,
      rfc: rfc || cliente.rfc,
      descuento_preferente: descuento_preferente !== undefined ? descuento_preferente : cliente.descuento_preferente,
      estado: estadoCliente || cliente.estado,
      fecha_actualizacion: new Date()
    });
    
    res.json({
      mensaje: 'Cliente actualizado exitosamente',
      cliente
    });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({ 
      error: 'Error al actualizar cliente',
      detalle: error.message 
    });
  }
};

// Eliminar (desactivar) un cliente
exports.eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cliente = await Cliente.findByPk(id);
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    // No eliminar físicamente, solo desactivar
    await cliente.update({
      estado: 'inactivo',
      fecha_actualizacion: new Date()
    });
    
    res.json({
      mensaje: 'Cliente desactivado exitosamente',
      cliente
    });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({ 
      error: 'Error al eliminar cliente',
      detalle: error.message 
    });
  }
};

// Actualizar puntos de un cliente
exports.actualizarPuntos = async (req, res) => {
  try {
    const { id } = req.params;
    const { puntos } = req.body;
    
    if (puntos === undefined || isNaN(puntos)) {
      return res.status(400).json({ error: 'Los puntos deben ser un número válido' });
    }
    
    const cliente = await Cliente.findByPk(id);
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    // Actualizar puntos (suma acumulada)
    const nuevosPuntos = parseInt(cliente.puntos_acumulados) + parseInt(puntos);
    
    await cliente.update({
      puntos_acumulados: nuevosPuntos > 0 ? nuevosPuntos : 0,
      fecha_actualizacion: new Date()
    });
    
    res.json({
      mensaje: 'Puntos actualizados exitosamente',
      cliente
    });
  } catch (error) {
    console.error('Error actualizando puntos:', error);
    res.status(500).json({ 
      error: 'Error al actualizar puntos',
      detalle: error.message 
    });
  }
};
