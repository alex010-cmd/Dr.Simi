import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSucursal } from '../context/SucursalContext';
import { ShoppingCart, Plus, Trash2, Search, Printer, Eye, X } from 'lucide-react';
import api from '../services/api';

const Ventas = () => {
  const { user } = useAuth();
  const { sucursalSeleccionada } = useSucursal();

  // Estados del formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estados de la nueva venta
  const [nuevaVenta, setNuevaVenta] = useState({
    id_cliente: '',
    metodo_pago: 'efectivo',
    observaciones: '',
    detalles: []
  });

  // Estado para agregar producto
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [busquedaProducto, setBusquedaProducto] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    cargarProductos();
    cargarClientes();
    cargarVentas();
  }, [sucursalSeleccionada]);

  const cargarProductos = async () => {
    try {
      const response = await api.get('/productos');
      if (response.data.success) {
        setProductos(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const cargarClientes = async () => {
    try {
      const response = await api.get('/clientes');
      if (response.data.success) {
        setClientes(response.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
      setClientes([]);
    }
  };

  const cargarVentas = async () => {
    try {
      const response = await api.get('/ventas');
      if (response.data.success) {
        setVentas(response.data.data.ventas || []);
      }
    } catch (error) {
      console.error('Error cargando ventas:', error);
    }
  };

  const agregarProducto = () => {
    if (!productoSeleccionado || cantidad <= 0) return;

    const producto = productos.find(p => p.id_producto === parseInt(productoSeleccionado));
    if (!producto) return;

    // Verificar si el producto ya está en la lista
    const index = nuevaVenta.detalles.findIndex(d => d.id_producto === producto.id_producto);
    
    if (index >= 0) {
      // Actualizar cantidad
      const nuevosDetalles = [...nuevaVenta.detalles];
      nuevosDetalles[index].cantidad += cantidad;
      setNuevaVenta({ ...nuevaVenta, detalles: nuevosDetalles });
    } else {
      // Agregar nuevo producto
      const nuevoDetalle = {
        id_producto: producto.id_producto,
        nombre: producto.nombre,
        cantidad: cantidad,
        precio_unitario: parseFloat(producto.precio_venta),
        descuento_linea: 0
      };
      setNuevaVenta({
        ...nuevaVenta,
        detalles: [...nuevaVenta.detalles, nuevoDetalle]
      });
    }

    // Limpiar selección
    setProductoSeleccionado('');
    setCantidad(1);
    setBusquedaProducto('');
  };

  const eliminarProducto = (index) => {
    const nuevosDetalles = nuevaVenta.detalles.filter((_, i) => i !== index);
    setNuevaVenta({ ...nuevaVenta, detalles: nuevosDetalles });
  };

  const calcularTotales = () => {
    const subtotal = nuevaVenta.detalles.reduce((sum, item) => {
      return sum + (item.cantidad * item.precio_unitario - item.descuento_linea);
    }, 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    
    return { subtotal, iva, total };
  };

  const registrarVenta = async () => {
    if (nuevaVenta.detalles.length === 0) {
      alert('Debe agregar al menos un producto');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/ventas', nuevaVenta);
      
      if (response.data.success) {
        alert(`Venta registrada exitosamente\nFolio: ${response.data.data.folio_venta}`);
        
        // Limpiar formulario
        setNuevaVenta({
          id_cliente: '',
          metodo_pago: 'efectivo',
          observaciones: '',
          detalles: []
        });
        setMostrarFormulario(false);
        
        // Recargar ventas
        cargarVentas();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error al registrar venta');
    } finally {
      setLoading(false);
    }
  };

  const verTicket = async (idVenta) => {
    try {
      const response = await api.get(`/ventas/${idVenta}/ticket`);
      if (response.data.success) {
        setTicketSeleccionado(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando ticket:', error);
    }
  };

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
    p.codigo_barras.includes(busquedaProducto)
  );

  const totales = calcularTotales();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ventas</h1>
            <p className="text-slate-600 mt-1">
              Vendedor: {user?.nombre} {user?.apellido_paterno} ({user?.numero_empleado})
            </p>
          </div>
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="btn btn-primary flex items-center gap-2"
          >
            {mostrarFormulario ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {mostrarFormulario ? 'Cancelar' : 'Nueva Venta'}
          </button>
        </div>
      </div>

      {/* Formulario de Nueva Venta */}
      {mostrarFormulario && (
        <div className="card">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Registrar Nueva Venta</h2>
          
          {/* Información del cliente y método de pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="label">Cliente (Opcional)</label>
              <select
                value={nuevaVenta.id_cliente}
                onChange={(e) => setNuevaVenta({ ...nuevaVenta, id_cliente: e.target.value })}
                className="input"
              >
                <option value="">Público General</option>
                {clientes.map(cliente => (
                  <option key={cliente.id_cliente} value={cliente.id_cliente}>
                    {cliente.nombre} {cliente.apellido_paterno} - {cliente.telefono}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Método de Pago</label>
              <select
                value={nuevaVenta.metodo_pago}
                onChange={(e) => setNuevaVenta({ ...nuevaVenta, metodo_pago: e.target.value })}
                className="input"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta_debito">Tarjeta de Débito</option>
                <option value="tarjeta_credito">Tarjeta de Crédito</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
          </div>

          {/* Búsqueda y selección de productos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Agregar Productos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="label">Buscar Producto</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={busquedaProducto}
                    onChange={(e) => setBusquedaProducto(e.target.value)}
                    className="input pl-10"
                    placeholder="Buscar por nombre o código..."
                  />
                </div>
                
                {busquedaProducto && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
                    {productosFiltrados.slice(0, 5).map(producto => (
                      <button
                        key={producto.id_producto}
                        onClick={() => {
                          setProductoSeleccionado(producto.id_producto.toString());
                          setBusquedaProducto('');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                      >
                        <p className="font-medium text-sm">{producto.nombre}</p>
                        <p className="text-xs text-slate-500">{producto.codigo_barras} - ${producto.precio_venta}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value))}
                  className="input"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={agregarProducto}
                  disabled={!productoSeleccionado}
                  className="btn btn-primary w-full disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Lista de productos agregados */}
          {nuevaVenta.detalles.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Productos en la Venta</h3>
              
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Producto</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Cant.</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Precio Unit.</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Subtotal</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nuevaVenta.detalles.map((detalle, index) => (
                      <tr key={index} className="border-t border-slate-200">
                        <td className="px-4 py-3 text-sm">{detalle.nombre}</td>
                        <td className="px-4 py-3 text-sm text-right">{detalle.cantidad}</td>
                        <td className="px-4 py-3 text-sm text-right">${detalle.precio_unitario.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">
                          ${(detalle.cantidad * detalle.precio_unitario - detalle.descuento_linea).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => eliminarProducto(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totales */}
              <div className="mt-4 bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-semibold">${totales.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">IVA (16%):</span>
                  <span className="font-semibold">${totales.iva.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-slate-300 pt-2">
                  <span>Total:</span>
                  <span className="text-primary-600">${totales.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div className="mb-6">
            <label className="label">Observaciones</label>
            <textarea
              value={nuevaVenta.observaciones}
              onChange={(e) => setNuevaVenta({ ...nuevaVenta, observaciones: e.target.value })}
              className="input"
              rows="3"
              placeholder="Notas adicionales sobre la venta..."
            ></textarea>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setMostrarFormulario(false);
                setNuevaVenta({ id_cliente: '', metodo_pago: 'efectivo', observaciones: '', detalles: [] });
              }}
              className="btn btn-outline"
            >
              Cancelar
            </button>
            <button
              onClick={registrarVenta}
              disabled={loading || nuevaVenta.detalles.length === 0}
              className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <ShoppingCart className="w-5 h-5" />
              {loading ? 'Registrando...' : 'Registrar Venta'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de Ventas */}
      <div className="card">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Historial de Ventas</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Folio</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Fecha</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Método Pago</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                    No hay ventas registradas
                  </td>
                </tr>
              ) : (
                ventas.map(venta => (
                  <tr key={venta.id_venta} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium">{venta.folio_venta}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(venta.fecha_venta).toLocaleString('es-MX')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      ${parseFloat(venta.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">{venta.metodo_pago.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`badge ${
                        venta.estado === 'completada' ? 'badge-success' :
                        venta.estado === 'cancelada' ? 'badge-danger' :
                        'badge-warning'
                      }`}>
                        {venta.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => verTicket(venta.id_venta)}
                        className="text-primary-600 hover:text-primary-800 mr-2"
                        title="Ver Ticket"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Ticket */}
      {ticketSeleccionado && (
        <TicketModal
          ticket={ticketSeleccionado}
          onClose={() => setTicketSeleccionado(null)}
        />
      )}
    </div>
  );
};

// Componente de Modal de Ticket
const TicketModal = ({ ticket, onClose }) => {
  const imprimirTicket = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header del Modal */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Ticket de Venta</h2>
          <div className="flex gap-2">
            <button onClick={imprimirTicket} className="btn btn-outline flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Contenido del Ticket */}
        <div className="p-6">
          <div className="border-2 border-slate-300 rounded-lg p-6 font-mono text-sm">
            {/* Header del Ticket */}
            <div className="text-center border-b-2 border-dashed border-slate-400 pb-4 mb-4">
              <h3 className="text-lg font-bold">FARMACIA {ticket.sucursal?.nombre.toUpperCase()}</h3>
              <p className="text-xs mt-2">{ticket.sucursal?.direccion}</p>
              <p className="text-xs">{ticket.sucursal?.ciudad}, {ticket.sucursal?.estado}</p>
              <p className="text-xs">Tel: {ticket.sucursal?.telefono}</p>
            </div>

            {/* Información de la Venta */}
            <div className="mb-4 text-xs">
              <div className="flex justify-between mb-1">
                <span>Ticket #:</span>
                <span className="font-bold">{ticket.venta.folio_venta}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Fecha:</span>
                <span>{new Date(ticket.venta.fecha_venta).toLocaleString('es-MX')}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Sucursal:</span>
                <span>{ticket.sucursal?.codigo_sucursal} - {ticket.sucursal?.nombre}</span>
              </div>
            </div>

            {/* Información del Vendedor */}
            <div className="border-y-2 border-dashed border-slate-400 py-2 mb-4 text-xs">
              <p className="font-bold mb-1">Atendido por:</p>
              <p>Empleado: {ticket.vendedor?.numero_empleado} - {ticket.vendedor?.nombre_completo}</p>
              <p>Puesto: {ticket.vendedor?.puesto?.toUpperCase()}</p>
            </div>

            {/* Información del Cliente */}
            <div className="mb-4 text-xs">
              <p className="font-bold mb-1">Cliente:</p>
              <p>Nombre: {ticket.cliente.nombre_completo}</p>
              {ticket.cliente.telefono && <p>Tel: {ticket.cliente.telefono}</p>}
            </div>

            {/* Productos */}
            <div className="border-y-2 border-dashed border-slate-400 py-2 mb-4">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span>Cant</span>
                <span className="flex-1 px-2">Descripción</span>
                <span>P.Unit</span>
                <span className="ml-4">Total</span>
              </div>
              
              {ticket.productos.map((producto, index) => (
                <div key={index} className="mb-2">
                  <div className="flex justify-between text-xs">
                    <span className="w-8">{producto.cantidad}</span>
                    <span className="flex-1 px-2">{producto.nombre}</span>
                    <span className="w-16 text-right">${producto.precio_unitario.toFixed(2)}</span>
                    <span className="w-16 text-right ml-4">
                      ${producto.subtotal_linea.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="text-xs space-y-1 mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${ticket.venta.subtotal.toFixed(2)}</span>
              </div>
              {ticket.venta.descuento > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento:</span>
                  <span>-${ticket.venta.descuento.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>IVA (16%):</span>
                <span>${ticket.venta.impuestos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t-2 border-slate-400 pt-2">
                <span>TOTAL:</span>
                <span>${ticket.venta.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Método de Pago */}
            <div className="text-xs mb-4">
              <div className="flex justify-between">
                <span>Método de Pago:</span>
                <span className="font-bold uppercase">{ticket.venta.metodo_pago.replace('_', ' ')}</span>
              </div>
              {ticket.venta.puntos_otorgados > 0 && (
                <div className="flex justify-between text-primary-600">
                  <span>Puntos Ganados:</span>
                  <span className="font-bold">{ticket.venta.puntos_otorgados} pts</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center border-t-2 border-dashed border-slate-400 pt-4 text-xs">
              <p className="font-bold">¡Gracias por su compra!</p>
              <p className="mt-2">Conserve su ticket</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ventas;
