import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SucursalProvider } from './context/SucursalContext';
import Navbar from './components/common/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Ventas from './pages/Ventas';
import AdminCentral from './pages/AdminCentral';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

// Componente para ruta pública (login)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <SucursalProvider>
        <Router>
          <Routes>
            {/* Rutas públicas */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />

            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />

          {/* Rutas protegidas */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ventas"
            element={
              <ProtectedRoute>
                <Ventas />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminCentral />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventario"
            element={
              <ProtectedRoute>
                <div className="card">
                  <h1 className="text-2xl font-bold">Módulo de Inventario</h1>
                  <p className="text-slate-600 mt-2">En construcción...</p>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/compras"
            element={
              <ProtectedRoute>
                <div className="card">
                  <h1 className="text-2xl font-bold">Módulo de Compras</h1>
                  <p className="text-slate-600 mt-2">En construcción...</p>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <div className="card">
                  <h1 className="text-2xl font-bold">Módulo de Clientes</h1>
                  <p className="text-slate-600 mt-2">En construcción...</p>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reportes"
            element={
              <ProtectedRoute>
                <div className="card">
                  <h1 className="text-2xl font-bold">Módulo de Reportes</h1>
                  <p className="text-slate-600 mt-2">En construcción...</p>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Redirección por defecto */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
      </SucursalProvider>
    </AuthProvider>
  );
}

export default App;
