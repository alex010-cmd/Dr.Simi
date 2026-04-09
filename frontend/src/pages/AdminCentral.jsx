import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/**
 * Panel de Administración Central
 * Solo accesible para usuarios con rol 'admin'
 * Muestra estadísticas detalladas de todas las sucursales
 */

const AdminCentral = () => {
  const { user } = useAuth();
  const [sucursales, setSucursales] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState(null);

  // Verificar si el usuario es admin
  useEffect(() => {
    if (user?.rol !== 'admin') {
      setError('No tienes permisos para acceder a esta sección');
      setLoading(false);
      return;
    }
  }, [user]);

  // Cargar lista de sucursales
  useEffect(() => {
    const cargarSucursales = async () => {
      try {
        setLoading(true);
        const response = await api.get('/sucursales');
        setSucursales(response.data);
        
        // Seleccionar la primera sucursal por defecto
        if (response.data.length > 0) {
          setSucursalSeleccionada(response.data[0].id_sucursal);
        }
      } catch (err) {
        console.error('Error cargando sucursales:', err);
        setError('Error al cargar las sucursales');
      } finally {
        setLoading(false);
      }
    };

    if (user?.rol === 'admin') {
      cargarSucursales();
    }
  }, [user]);

  // Cargar estadísticas cuando se selecciona una sucursal
  useEffect(() => {
    const cargarEstadisticas = async () => {
      if (!sucursalSeleccionada) return;

      try {
        setLoadingStats(true);
        const response = await api.get(`/sucursales/${sucursalSeleccionada}/admin-stats`);
        setEstadisticas(response.data);
      } catch (err) {
        console.error('Error cargando estadísticas:', err);
        setError('Error al cargar las estadísticas de la sucursal');
      } finally {
        setLoadingStats(false);
      }
    };

    cargarEstadisticas();
  }, [sucursalSeleccionada]);

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  if (error && user?.rol !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-red-800">Acceso Denegado</h3>
              <p className="mt-2 text-red-700">{error}</p>
              <p className="mt-2 text-sm text-red-600">Esta sección es exclusiva para administradores centrales.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Panel de Administración Central</h1>
            <p className="mt-2 text-purple-100">
              Sistema de monitoreo y control de todas las sucursales
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
            <p className="text-sm text-purple-100">Administrador</p>
            <p className="text-lg font-semibold">{user?.nombre}</p>
          </div>
        </div>
      </div>

      {/* Selector de Sucursal */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <label htmlFor="sucursal" className="block text-sm font-medium text-slate-700 mb-2">
          Seleccionar Sucursal para Ver Estadísticas Detalladas
        </label>
        <select
          id="sucursal"
          value={sucursalSeleccionada || ''}
          onChange={(e) => setSucursalSeleccionada(Number(e.target.value))}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          {sucursales.map((suc) => (
            <option key={suc.id_sucursal} value={suc.id_sucursal}>
              {suc.codigo_sucursal} - {suc.nombre_sucursal} ({suc.ciudad}, {suc.estado})
            </option>
          ))}
        </select>
      </div>

      {/* Estadísticas */}
      {loadingStats ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando estadísticas...</p>
        </div>
      ) : estadisticas ? (
        <div className="space-y-6">
          {/* Información de la Sucursal */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Información de la Sucursal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-600">Código</p>
                <p className="text-lg font-semibold text-slate-800">{estadisticas.sucursal.codigo_sucursal}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Nombre</p>
                <p className="text-lg font-semibold text-slate-800">{estadisticas.sucursal.nombre_sucursal}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Estado</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  estadisticas.sucursal.estado_sucursal === 'activa' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {estadisticas.sucursal.estado_sucursal}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-600">Dirección</p>
                <p className="text-lg font-semibold text-slate-800">{estadisticas.sucursal.direccion}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Ciudad</p>
                <p className="text-lg font-semibold text-slate-800">{estadisticas.sucursal.ciudad}, {estadisticas.sucursal.estado}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Teléfono</p>
                <p className="text-lg font-semibold text-slate-800">{estadisticas.sucursal.telefono}</p>
              </div>
              {estadisticas.sucursal.nombre_gerente && (
                <div>
                  <p className="text-sm text-slate-600">Gerente</p>
                  <p className="text-lg font-semibold text-slate-800">{estadisticas.sucursal.nombre_gerente}</p>
                  {estadisticas.sucursal.telefono_gerente && (
                    <p className="text-sm text-slate-500">{estadisticas.sucursal.telefono_gerente}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* KPIs Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Empleados */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Empleados Activos</p>
                  <p className="text-3xl font-bold mt-2">{estadisticas.empleados.total}</p>
                </div>
                <svg className="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>

            {/* Total Clientes */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Clientes Registrados</p>
                  <p className="text-3xl font-bold mt-2">{estadisticas.clientes.total}</p>
                </div>
                <svg className="w-12 h-12 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>

            {/* Productos en Inventario */}
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Productos en Stock</p>
                  <p className="text-3xl font-bold mt-2">{estadisticas.inventario.total_productos}</p>
                  {estadisticas.inventario.productos_bajo_stock > 0 && (
                    <p className="text-xs text-yellow-100 mt-1">
                      ⚠️ {estadisticas.inventario.productos_bajo_stock} bajo stock
                    </p>
                  )}
                </div>
                <svg className="w-12 h-12 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>

            {/* Ventas del Día */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Ventas Hoy</p>
                  <p className="text-3xl font-bold mt-2">{estadisticas.ventas.hoy.cantidad}</p>
                  <p className="text-sm text-purple-100 mt-1">
                    {formatCurrency(estadisticas.ventas.hoy.monto)}
                  </p>
                </div>
                <svg className="w-12 h-12 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Ventas del Mes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Resumen de Ventas del Mes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
                <p className="text-sm text-slate-600">Total de Ventas</p>
                <p className="text-4xl font-bold text-indigo-600 mt-2">{estadisticas.ventas.mes.cantidad}</p>
                <p className="text-sm text-slate-500 mt-1">transacciones completadas</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                <p className="text-sm text-slate-600">Ingresos Totales</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{formatCurrency(estadisticas.ventas.mes.monto)}</p>
                <p className="text-sm text-slate-500 mt-1">en el mes actual</p>
              </div>
            </div>
          </div>

          {/* Distribución de Empleados por Rol */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              Empleados por Rol
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {estadisticas.empleados.por_rol.map((rol, index) => (
                <div 
                  key={index} 
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 capitalize">{rol.rol}</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">{rol.total}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      rol.rol === 'admin' ? 'bg-red-100 text-red-600' :
                      rol.rol === 'gerente' ? 'bg-blue-100 text-blue-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Jefes de Turno */}
          {estadisticas.empleados.jefes_turno.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Jefes de Turno y Supervisores
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Número Empleado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Puesto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Turno
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Contacto
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {estadisticas.empleados.jefes_turno.map((jefe, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">{jefe.nombre_completo}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-600">{jefe.numero_empleado}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {jefe.puesto}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-600 capitalize">{jefe.turno || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-600">
                            {jefe.telefono && <div>{jefe.telefono}</div>}
                            {jefe.email && <div className="text-xs text-slate-500">{jefe.email}</div>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <svg className="w-16 h-16 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-4 text-slate-600">Selecciona una sucursal para ver las estadísticas</p>
        </div>
      )}
    </div>
  );
};

export default AdminCentral;
