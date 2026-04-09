import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SucursalContext = createContext();

export const useSucursal = () => {
  const context = useContext(SucursalContext);
  if (!context) {
    throw new Error('useSucursal debe usarse dentro de SucursalProvider');
  }
  return context;
};

export const SucursalProvider = ({ children }) => {
  const [vistaActual, setVistaActual] = useState('central'); // 'central' o 'local'
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar lista de sucursales al montar
  useEffect(() => {
    cargarSucursales();
  }, []);

  const cargarSucursales = async () => {
    try {
      const response = await api.get('/sucursales');
      const sucursalesData = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      setSucursales(sucursalesData);
      
      // Establecer primera sucursal como seleccionada por defecto
      if (sucursalesData.length > 0 && !sucursalSeleccionada) {
        setSucursalSeleccionada(sucursalesData[0]);
      }
    } catch (error) {
      console.error('Error cargando sucursales:', error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarVista = (vista, sucursal = null) => {
    setVistaActual(vista);
    if (vista === 'local' && sucursal) {
      setSucursalSeleccionada(sucursal);
    }
  };

  const esCentral = () => vistaActual === 'central';
  const esLocal = () => vistaActual === 'local';

  const value = {
    vistaActual,
    sucursalSeleccionada,
    sucursales,
    loading,
    cambiarVista,
    esCentral,
    esLocal,
    setSucursalSeleccionada,
  };

  return (
    <SucursalContext.Provider value={value}>
      {children}
    </SucursalContext.Provider>
  );
};
