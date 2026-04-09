const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

/**
 * Configuración de Express Application
 */

const app = express();

// ============================================================================
// MIDDLEWARES DE SEGURIDAD
// ============================================================================

// Helmet - Protección de headers HTTP
app.use(helmet());

// CORS - Control de acceso entre orígenes
const configuredCorsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (configuredCorsOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV === 'development' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error('No permitido por CORS'));
  },
  credentials: true
}));

// Rate Limiting - Prevención de ataques de fuerza bruta
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Demasiadas peticiones desde esta IP, intente nuevamente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Rate limiting específico para login (más restrictivo)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos de inicio de sesión, intente nuevamente en 15 minutos.'
});

// ============================================================================
// MIDDLEWARES DE PARSEO
// ============================================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// LOGGING
// ============================================================================

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================================================
// RUTAS
// ============================================================================

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Sistema de Farmacia - Base de Datos Distribuida',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      productos: '/api/productos',
      ventas: '/api/ventas',
      inventario: '/api/inventario',
      sucursales: '/api/sucursales',
      clientes: '/api/clientes',
      compras: '/api/compras',
      reportes: '/api/reportes'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Importar rutas
const authRoutes = require('./routes/auth');
const productosRoutes = require('./routes/productos');
const ventasRoutes = require('./routes/ventas');
const inventarioRoutes = require('./routes/inventario');
const sucursalesRoutes = require('./routes/sucursales');
const clientesRoutes = require('./routes/clientes');

// Registrar rutas
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/sucursales', sucursalesRoutes);
app.use('/api/clientes', clientesRoutes);

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

module.exports = app;
