import React, { useEffect, useMemo, useState } from 'react';
import { useSucursal } from '../context/SucursalContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const { 
    vistaActual, 
    sucursalSeleccionada, 
    sucursales, 
    cambiarVista,
    setSucursalSeleccionada,
    loading 
  } = useSucursal();

  const [localData, setLocalData] = useState({
    resumen: {
      productos_en_sucursal: 0,
      inventario_total_unidades: 0,
      clientes_activos: 0,
      empleados_activos: 0
    },
    clientes: [],
    empleados: [],
    inventario: []
  });
  const [loadingLocalData, setLoadingLocalData] = useState(false);
  const [localDataError, setLocalDataError] = useState('');
  const [indicadorActivo, setIndicadorActivo] = useState('inventario');

  useEffect(() => {
    const cargarDatosVistaLocal = async () => {
      if (vistaActual !== 'local' || !sucursalSeleccionada?.id_sucursal) return;

      try {
        setLoadingLocalData(true);
        setLocalDataError('');

        const response = await api.get(`/sucursales/${sucursalSeleccionada.id_sucursal}/local-view`);
        const payload = response.data?.data;

        if (!payload) {
          throw new Error('Respuesta vacía de la API de vista local');
        }

        setLocalData({
          resumen: payload.resumen || {
            productos_en_sucursal: 0,
            inventario_total_unidades: 0,
            clientes_activos: 0,
            empleados_activos: 0
          },
          clientes: payload.clientes || [],
          empleados: payload.empleados || [],
          inventario: payload.inventario || []
        });
      } catch (error) {
        console.error('Error cargando vista local:', error);
        setLocalDataError('No se pudo cargar la información local de la sucursal seleccionada.');
      } finally {
        setLoadingLocalData(false);
      }
    };

    cargarDatosVistaLocal();
  }, [vistaActual, sucursalSeleccionada?.id_sucursal]);

  useEffect(() => {
    if (vistaActual !== 'local') {
      setIndicadorActivo('inventario');
    }
  }, [vistaActual]);

  const resumenLocal = useMemo(() => localData.resumen || {}, [localData.resumen]);

  const renderDetalleIndicador = () => {
    if (loadingLocalData) {
      return (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (localDataError) {
      return (
        <p className="text-sm text-red-600">{localDataError}</p>
      );
    }

    if (indicadorActivo === 'clientes') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200">
                <th className="py-2 pr-3">No. Cliente</th>
                <th className="py-2 pr-3">Nombre</th>
                <th className="py-2 pr-3">Teléfono</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {localData.clientes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-slate-500">No hay clientes activos en esta sucursal.</td>
                </tr>
              ) : (
                localData.clientes.map((cliente) => (
                  <tr key={cliente.id_cliente} className="border-b border-slate-100">
                    <td className="py-2 pr-3">{cliente.numero_cliente}</td>
                    <td className="py-2 pr-3">{cliente.nombre} {cliente.apellido_paterno}</td>
                    <td className="py-2 pr-3">{cliente.telefono || '—'}</td>
                    <td className="py-2 pr-3">{cliente.email || '—'}</td>
                    <td className="py-2">{cliente.puntos_acumulados || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (indicadorActivo === 'empleados') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200">
                <th className="py-2 pr-3">No. Empleado</th>
                <th className="py-2 pr-3">Nombre</th>
                <th className="py-2 pr-3">Puesto</th>
                <th className="py-2 pr-3">Rol</th>
                <th className="py-2">Contacto</th>
              </tr>
            </thead>
            <tbody>
              {localData.empleados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-slate-500">No hay empleados activos en esta sucursal.</td>
                </tr>
              ) : (
                localData.empleados.map((empleado) => (
                  <tr key={empleado.id_empleado} className="border-b border-slate-100">
                    <td className="py-2 pr-3">{empleado.numero_empleado}</td>
                    <td className="py-2 pr-3">{empleado.nombre} {empleado.apellido_paterno}</td>
                    <td className="py-2 pr-3">{empleado.puesto}</td>
                    <td className="py-2 pr-3">{empleado.rol}</td>
                    <td className="py-2">{empleado.telefono || empleado.email || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-200">
              <th className="py-2 pr-3">Producto</th>
              <th className="py-2 pr-3">Código</th>
              <th className="py-2 pr-3">Categoría</th>
              <th className="py-2 pr-3">Disponible</th>
              <th className="py-2 pr-3">Mínimo</th>
              <th className="py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {localData.inventario.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-slate-500">No hay productos registrados en inventario para esta sucursal.</td>
              </tr>
            ) : (
              localData.inventario.map((item) => (
                <tr key={item.id_inventario} className="border-b border-slate-100">
                  <td className="py-2 pr-3">{item.producto_nombre}</td>
                  <td className="py-2 pr-3">{item.producto_codigo_barras || `#${item.id_producto}`}</td>
                  <td className="py-2 pr-3">{item.producto_categoria || '—'}</td>
                  <td className="py-2 pr-3">{item.cantidad_disponible}</td>
                  <td className="py-2 pr-3">{item.cantidad_minima}</td>
                  <td className="py-2">{item.estado}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del Usuario */}
      <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Bienvenido, {user?.nombre} {user?.apellido_paterno}
            </h1>
            <div className="mt-2 space-y-1 text-primary-50">
              <p className="text-sm">
                <span className="font-semibold">No. Empleado:</span> {user?.numero_empleado}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Puesto:</span> {user?.puesto?.charAt(0).toUpperCase() + user?.puesto?.slice(1)}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Rol:</span> {user?.rol?.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Badge de sucursal */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-4">
            <p className="text-xs text-primary-100 font-medium">Sucursal Asignada</p>
            <p className="text-lg font-bold mt-1">
              Sucursal #{user?.id_sucursal}
            </p>
          </div>
        </div>
      </div>

      {/* Selector de Vista */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Panel de Control
            </h2>
            <p className="text-slate-600 mt-1">
              {vistaActual === 'central' 
                ? 'Vista consolidada de todas las sucursales' 
                : `Vista de ${sucursalSeleccionada?.nombre || 'Sucursal'}`
              }
            </p>
          </div>

          {/* Selector de Vista */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Toggle Vista Central/Local */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => cambiarVista('central')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  vistaActual === 'central'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vista Central
              </button>
              <button
                onClick={() => cambiarVista('local', sucursales[0])}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  vistaActual === 'local'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vista Local
              </button>
            </div>

            {/* Selector de Sucursal (solo visible en vista local) */}
            {vistaActual === 'local' && (
              <select
                value={sucursalSeleccionada?.id_sucursal || ''}
                onChange={(e) => {
                  const sucursal = sucursales.find(
                    s => s.id_sucursal === parseInt(e.target.value)
                  );
                  setSucursalSeleccionada(sucursal);
                }}
                className="input"
              >
                {sucursales.map(sucursal => (
                  <option key={sucursal.id_sucursal} value={sucursal.id_sucursal}>
                    {sucursal.nombre} ({sucursal.codigo_sucursal})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Información de la vista actual */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          {vistaActual === 'central' ? (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-blue-900">Vista Central Activa</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Estás viendo información consolidada de todas las sucursales. 
                  Aquí puedes gestionar productos, proveedores, empleados y clientes de forma centralizada.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-blue-900">Vista Local - {sucursalSeleccionada?.nombre}</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Estás viendo información específica de {sucursalSeleccionada?.nombre}. 
                  Aquí puedes gestionar ventas, inventario y compras de esta sucursal.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card Productos */}
        <div
          className={`card hover:shadow-lg transition-shadow ${vistaActual === 'local' ? 'cursor-pointer' : ''} ${vistaActual === 'local' && (indicadorActivo === 'productos' || indicadorActivo === 'inventario') ? 'ring-2 ring-primary-300' : ''}`}
          onClick={() => {
            if (vistaActual === 'local') setIndicadorActivo('productos');
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Productos</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {vistaActual === 'central' ? 5 : (resumenLocal.productos_en_sucursal || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {vistaActual === 'central' ? 'En catálogo' : 'En inventario'}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card Clientes */}
        <div
          className={`card hover:shadow-lg transition-shadow ${vistaActual === 'local' ? 'cursor-pointer' : ''} ${vistaActual === 'local' && indicadorActivo === 'clientes' ? 'ring-2 ring-primary-300' : ''}`}
          onClick={() => {
            if (vistaActual === 'local') setIndicadorActivo('clientes');
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Clientes</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {vistaActual === 'central' ? 3 : (resumenLocal.clientes_activos || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {vistaActual === 'central' ? 'Total registrados' : 'De la sucursal'}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card Sucursales (solo vista central) */}
        {vistaActual === 'central' && (
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Sucursales</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{sucursales.length}</p>
                <p className="text-xs text-slate-500 mt-1">Activas</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Card Inventario (solo vista local) */}
        {vistaActual === 'local' && (
          <div
            className={`card hover:shadow-lg transition-shadow cursor-pointer ${indicadorActivo === 'inventario' ? 'ring-2 ring-primary-300' : ''}`}
            onClick={() => setIndicadorActivo('inventario')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Inventario</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{resumenLocal.inventario_total_unidades || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Unidades en stock</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Card Empleados */}
        <div
          className={`card hover:shadow-lg transition-shadow ${vistaActual === 'local' ? 'cursor-pointer' : ''} ${vistaActual === 'local' && indicadorActivo === 'empleados' ? 'ring-2 ring-primary-300' : ''}`}
          onClick={() => {
            if (vistaActual === 'local') setIndicadorActivo('empleados');
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Empleados</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {vistaActual === 'central' ? 3 : (resumenLocal.empleados_activos || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {vistaActual === 'central' ? 'Total' : 'En sucursal'}
              </p>
            </div>
            <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Detalle de indicadores en vista local */}
      {vistaActual === 'local' && sucursalSeleccionada && (
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Detalle de {indicadorActivo === 'clientes' ? 'Clientes' : indicadorActivo === 'empleados' ? 'Empleados' : 'Inventario y Productos'} - {sucursalSeleccionada.nombre}
            </h2>
            <div className="flex gap-2">
              <button className={`btn ${indicadorActivo === 'inventario' || indicadorActivo === 'productos' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setIndicadorActivo('inventario')}>Inventario</button>
              <button className={`btn ${indicadorActivo === 'clientes' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setIndicadorActivo('clientes')}>Clientes</button>
              <button className={`btn ${indicadorActivo === 'empleados' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setIndicadorActivo('empleados')}>Empleados</button>
            </div>
          </div>
          {renderDetalleIndicador()}
        </div>
      )}

      {/* Sección de Listados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Sucursales (solo vista central) */}
        {vistaActual === 'central' && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Sucursales Activas</h2>
            <div className="space-y-3">
              {sucursales.map(sucursal => (
                <div 
                  key={sucursal.id_sucursal}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => cambiarVista('local', sucursal)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{sucursal.nombre}</h3>
                      <p className="text-sm text-slate-600">{sucursal.codigo_sucursal} - {sucursal.ciudad}</p>
                    </div>
                  </div>
                  <span className="badge badge-success">
                    {sucursal.estado_sucursal}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información de Sucursal (solo vista local) */}
        {vistaActual === 'local' && sucursalSeleccionada && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Información de Sucursal</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Código</p>
                <p className="font-medium text-slate-900">{sucursalSeleccionada.codigo_sucursal}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Dirección</p>
                <p className="font-medium text-slate-900">{sucursalSeleccionada.direccion}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Ciudad</p>
                <p className="font-medium text-slate-900">
                  {sucursalSeleccionada.ciudad}, {sucursalSeleccionada.estado_geografico}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Teléfono</p>
                <p className="font-medium text-slate-900">{sucursalSeleccionada.telefono}</p>
              </div>
              {sucursalSeleccionada.nombre_gerente && (
                <div>
                  <p className="text-sm text-slate-600">Gerente</p>
                  <p className="font-medium text-slate-900">{sucursalSeleccionada.nombre_gerente}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Acciones Rápidas */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {vistaActual === 'central' ? 'Gestión Central' : `Operaciones - ${sucursalSeleccionada?.nombre}`}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {vistaActual === 'central' ? (
              <>
                <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="text-sm font-medium text-blue-900">Productos</span>
                </button>
                <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm font-medium text-purple-900">Empleados</span>
                </button>
                <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium text-green-900">Reportes</span>
                </button>
                <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium text-orange-900">Config</span>
                </button>
              </>
            ) : (
              <>
                <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-900">Nueva Venta</span>
                </button>
                <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-sm font-medium text-orange-900">Inventario</span>
                </button>
                <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-sm font-medium text-purple-900">Nueva Compra</span>
                </button>
                <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-medium text-green-900">Reportes</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
