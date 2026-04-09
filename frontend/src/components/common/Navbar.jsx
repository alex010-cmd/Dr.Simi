import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  ShoppingBag,
  Settings,
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ShoppingCart, label: 'Ventas', path: '/ventas' },
    { icon: Package, label: 'Inventario', path: '/inventario' },
    { icon: ShoppingBag, label: 'Compras', path: '/compras' },
    { icon: Users, label: 'Clientes', path: '/clientes' },
    { icon: FileText, label: 'Reportes', path: '/reportes' },
  ];

  // Agregar Admin Central si el usuario es admin
  const adminMenuItem = { 
    icon: Shield, 
    label: 'Admin Central', 
    path: '/admin' 
  };

  const allMenuItems = user?.rol === 'admin' 
    ? [adminMenuItem, ...menuItems] 
    : menuItems;

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y título */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-800">
                  Farmacia Sistema
                </h1>
                <p className="text-xs text-slate-500">
                  Sucursal {user?.id_sucursal}
                </p>
              </div>
            </Link>
          </div>

          {/* Menú Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {allMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  item.path === '/admin'
                    ? 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Usuario y acciones */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-800">
                {user?.nombre} {user?.apellido_paterno}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {user?.rol}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <Settings className="w-5 h-5 text-slate-600" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5 text-red-600" />
              </button>
            </div>

            {/* Botón menú móvil */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-600" />
              ) : (
                <Menu className="w-6 h-6 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-2 space-y-1">
            {allMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  item.path === '/admin'
                    ? 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
