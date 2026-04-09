import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  FileText,
  TrendingUp,
  AlertTriangle,
  DollarSign
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  // Datos de ejemplo (en producción vendrían del backend)
  const stats = [
    {
      title: 'Ventas del Día',
      value: '$45,320.00',
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+12.5%'
    },
    {
      title: 'Productos Vendidos',
      value: '284',
      icon: ShoppingCart,
      color: 'bg-primary-500',
      change: '+8.2%'
    },
    {
      title: 'Productos en Stock',
      value: '1,247',
      icon: Package,
      color: 'bg-secondary-500',
      change: '-3.1%'
    },
    {
      title: 'Alertas de Inventario',
      value: '12',
      icon: AlertTriangle,
      color: 'bg-accent-500',
      change: '+4'
    }
  ];

  const alertas = [
    { tipo: 'stock', mensaje: 'Paracetamol 500mg - Stock bajo (15 unidades)', prioridad: 'alta' },
    { tipo: 'caducidad', mensaje: '8 productos próximos a vencer en 30 días', prioridad: 'media' },
    { tipo: 'venta', mensaje: 'Meta de ventas alcanzada al 87%', prioridad: 'info' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          ¡Bienvenido, {user?.nombre}!
        </h1>
        <p className="text-slate-600">
          {user?.puesto} - Sucursal {user?.id_sucursal}
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-green-600">
                {stat.change}
              </span>
            </div>
            <h3 className="text-slate-600 text-sm font-medium mb-1">
              {stat.title}
            </h3>
            <p className="text-2xl font-bold text-slate-800">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Grid de contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-accent-500" />
            <h2 className="text-xl font-bold text-slate-800">
              Alertas y Notificaciones
            </h2>
          </div>
          <div className="space-y-3">
            {alertas.map((alerta, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  alerta.prioridad === 'alta' ? 'bg-red-50 border-red-500' :
                  alerta.prioridad === 'media' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <p className="text-sm text-slate-700">{alerta.mensaje}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Accesos Rápidos */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <LayoutDashboard className="w-6 h-6 text-primary-500" />
            <h2 className="text-xl font-bold text-slate-800">
              Accesos Rápidos
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-6 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors text-center">
              <ShoppingCart className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-primary-800">Nueva Venta</p>
            </button>
            <button className="p-6 bg-secondary-50 hover:bg-secondary-100 rounded-lg transition-colors text-center">
              <Package className="w-8 h-8 text-secondary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-secondary-800">Inventario</p>
            </button>
            <button className="p-6 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-800">Clientes</p>
            </button>
            <button className="p-6 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-center">
              <FileText className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-orange-800">Reportes</p>
            </button>
          </div>
        </div>
      </div>

      {/* Ventas Recientes */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-primary-500" />
            <h2 className="text-xl font-bold text-slate-800">
              Ventas Recientes
            </h2>
          </div>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Ver todas →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Folio</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Total</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Método</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm">V001-2026040{i}</td>
                  <td className="py-3 px-4 text-sm">Cliente {i}</td>
                  <td className="py-3 px-4 text-sm font-medium">${(Math.random() * 1000).toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className="badge badge-info">Tarjeta</span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className="badge badge-success">Completada</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
