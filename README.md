# 🏥 Sistema de Base de Datos Distribuida para Farmacia

## 📋 Descripción del Proyecto

Sistema integral de gestión para farmacias con arquitectura de base de datos distribuida que permite la administración de múltiples sucursales de forma centralizada y descentralizada, garantizando disponibilidad, redundancia y sincronización de datos.

---

## 🎯 Finalidad de la Base de Datos

El sistema de base de datos distribuida tiene como finalidad:

1. **Gestión Multi-Sucursal**: Administrar operaciones de varias sucursales de farmacia desde una base centralizada
2. **Disponibilidad Continua**: Permitir operaciones locales en cada sucursal incluso sin conexión al servidor central
3. **Sincronización Automática**: Mantener consistencia de datos entre todas las sucursales
4. **Escalabilidad**: Facilitar el crecimiento del negocio agregando nuevas sucursales sin afectar el rendimiento
5. **Análisis Centralizado**: Generar reportes consolidados de todas las sucursales para toma de decisiones

---

## 🏗️ Arquitectura del Sistema

### Modelo de Distribución

El sistema implementa una **arquitectura híbrida** que combina:

- **Datos Centralizados**: Información maestra compartida entre todas las sucursales
- **Datos Distribuidos**: Información operacional específica de cada sucursal
- **Replicación Bidireccional**: Sincronización automática entre BD central y locales

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVIDOR CENTRAL                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         BASE DE DATOS CENTRAL (MySQL)                 │  │
│  │                                                       │  │
│  │  • Productos (Catálogo Maestro)                       │  │
│  │  • Proveedores                                        │  │
│  │  • Empleados                                          │  │
│  │  • Clientes (Consolidado)                             │  │
│  │  • Sucursales                                         │  │
│  │  • Logs de Sincronización                             │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼───┐    ┌────▼───┐    ┌────▼───┐
    │ SUC 01 │    │ SUC 02 │    │ SUC 03 │
    │        │    │        │    │        │
    │ • Inv  │    │ • Inv  │    │ • Inv  │
    │ • Vent │    │ • Vent │    │ • Vent │
    │ • Comp │    │ • Comp │    │ • Comp │
    │ • Cach │    │ • Cach │    │ • Cach │
    └────────┘    └────────┘    └────────┘
```

---

## 📊 Diseño de Base de Datos

### Entidades Centralizadas

Estas entidades residen en el **servidor central** y se replican (caché) a las sucursales:

| Entidad | Descripción | Tipo de Distribución |
|---------|-------------|---------------------|
| **Productos** | Catálogo maestro de medicamentos y productos | Centralizada + Caché local |
| **Proveedores** | Información de laboratorios y distribuidores | Centralizada |
| **Empleados** | Personal de todas las sucursales | Centralizada |
| **Clientes** | Base unificada de clientes | Centralizada + Replicación |
| **Sucursales** | Catálogo de farmacias de la red | Centralizada |

### Entidades Distribuidas

Estas entidades residen en el **servidor local** de cada sucursal y se sincronizan al central:

| Entidad | Descripción | Tipo de Distribución |
|---------|-------------|---------------------|
| **Inventario** | Stock de productos por sucursal | Distribuida (fragmentación horizontal) |
| **Ventas** | Transacciones de venta de cada sucursal | Distribuida (fragmentación horizontal) |
| **Detalle Venta** | Líneas de productos vendidos | Distribuida (fragmentación horizontal) |
| **Compras** | Órdenes de compra a proveedores | Distribuida (fragmentación horizontal) |
| **Detalle Compra** | Líneas de productos comprados | Distribuida (fragmentación horizontal) |
| **Movimientos Inventario** | Registro de entradas/salidas | Distribuida (fragmentación horizontal) |
| **Caja** | Control de turnos y arqueos | Distribuida |

---

## 🔑 Relaciones entre Tablas

### Diagrama Entidad-Relación Simplificado

```
PRODUCTOS (1) ──< (N) INVENTARIO (N) >── (1) SUCURSALES
    │                    │
    │                    │
    │                    └──< (N) MOVIMIENTOS_INVENTARIO
    │
    └──< (N) DETALLE_VENTA (N) >── (1) VENTAS
            │                           │
            │                           ├── (1) CLIENTES
            │                           ├── (1) EMPLEADOS
            │                           └── (1) SUCURSALES

PROVEEDORES (1) ──< (N) COMPRAS (1) >──< (N) DETALLE_COMPRA >── (N) PRODUCTOS

EMPLEADOS (N) ── (1) SUCURSALES
```

### Claves Principales

| Tabla | Clave Principal | Tipo |
|-------|----------------|------|
| productos | id_producto | INT AUTO_INCREMENT |
| proveedores | id_proveedor | INT AUTO_INCREMENT |
| empleados | id_empleado | INT AUTO_INCREMENT |
| clientes | id_cliente | INT AUTO_INCREMENT |
| sucursales | id_sucursal | INT AUTO_INCREMENT |
| inventario | id_inventario | INT AUTO_INCREMENT |
| ventas | id_venta | BIGINT AUTO_INCREMENT |
| detalle_venta | id_detalle | BIGINT AUTO_INCREMENT |
| compras | id_compra | BIGINT AUTO_INCREMENT |
| detalle_compra | id_detalle | BIGINT AUTO_INCREMENT |

---

## 📐 Normalización

El diseño de base de datos cumple con las siguientes formas normales:

### ✅ Primera Forma Normal (1FN)
- Todos los atributos contienen valores atómicos
- No existen grupos repetitivos
- Cada columna tiene un único tipo de dato

### ✅ Segunda Forma Normal (2FN)
- Cumple 1FN
- Todos los atributos no-clave dependen completamente de la clave primaria
- Ejemplo: `detalle_venta` depende de `id_venta` + `id_producto`

### ✅ Tercera Forma Normal (3FN)
- Cumple 2FN
- No existen dependencias transitivas
- Ejemplo: Los datos del cliente se almacenan en tabla `clientes`, no en `ventas`

### ✅ Forma Normal de Boyce-Codd (BCNF)
- Cumple 3FN
- Toda dependencia funcional tiene como determinante una superclave
- Las tablas de relación N:M están correctamente normalizadas

---

## 🔄 Distribución y Sincronización

### Estrategia de Distribución

1. **Fragmentación Horizontal**: 
   - Las tablas distribuidas (ventas, inventario, compras) se fragmentan por `id_sucursal`
   - Cada sucursal solo almacena sus propios registros operacionales

2. **Replicación de Datos Maestros**:
   - Productos y proveedores se replican (caché) en cada sucursal
   - Permite operación offline y consultas rápidas

3. **Consolidación Centralizada**:
   - Los clientes se consolidan en la BD central
   - Las transacciones se sincronizan periódicamente

### Sincronización de Operaciones

```javascript
// Proceso de Sincronización (cada 5 minutos)
1. Replicación Central → Local (Pull)
   - Nuevos productos
   - Actualizaciones de precios
   - Nuevos clientes de otras sucursales

2. Replicación Local → Central (Push)
   - Nuevas ventas
   - Nuevas compras
   - Movimientos de inventario
   - Nuevos clientes registrados

3. Resolución de Conflictos
   - Last Write Wins (LWW) basado en timestamp
   - Validación de integridad referencial
```

### Descomposición de Consultas

**Consulta Distribuida**: Obtener ventas totales de todas las sucursales

```sql
-- Se ejecuta en cada sucursal local
SELECT id_sucursal, SUM(total) as total_ventas
FROM ventas
WHERE fecha_venta BETWEEN '2026-04-01' AND '2026-04-30'
GROUP BY id_sucursal;

-- Se consolida en el servidor central
-- El backend agrega los resultados de todas las sucursales
```

**Consulta con JOIN Distribuido**: Productos más vendidos

```sql
-- Se ejecuta en cada sucursal local
SELECT 
    p.nombre,
    SUM(dv.cantidad) as cantidad_vendida
FROM detalle_venta dv
JOIN ventas v ON dv.id_venta = v.id_venta
JOIN productos_local p ON dv.id_producto = p.id_producto
WHERE v.fecha_venta >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY p.id_producto, p.nombre
ORDER BY cantidad_vendida DESC
LIMIT 10;

-- Los resultados se agregan en el servidor central
```

---

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js 18+**: Entorno de ejecución JavaScript
- **Express.js 4.x**: Framework web minimalista y flexible
- **MySQL 8.0**: Sistema de gestión de base de datos relacional
- **Sequelize**: ORM para Node.js con soporte para múltiples BD

**Justificación**: 
- Node.js permite manejar múltiples conexiones concurrentes eficientemente
- Express facilita la creación de APIs RESTful
- MySQL ofrece confiabilidad, transacciones ACID y replicación nativa
- Sequelize simplifica las operaciones de BD y migraciones

### Frontend
- **React 18**: Librería para construir interfaces de usuario
- **Vite**: Build tool moderno y rápido
- **Tailwind CSS**: Framework CSS utility-first
- **Axios**: Cliente HTTP para consumir APIs
- **React Router**: Navegación entre páginas

**Justificación**:
- React permite crear interfaces dinámicas y responsivas
- Vite proporciona desarrollo rápido con HMR (Hot Module Replacement)
- Tailwind acelera el desarrollo de UI con clases utilitarias
- Facilita el desarrollo de una SPA (Single Page Application)

### Seguridad
- **JSON Web Tokens (JWT)**: Autenticación sin estado
- **bcrypt**: Hash de contraseñas con salt
- **Helmet**: Protección de headers HTTP
- **express-rate-limit**: Prevención de ataques de fuerza bruta
- **CORS**: Control de acceso entre orígenes

**Justificación**:
- JWT permite autenticación escalable sin sesiones en servidor
- bcrypt protege contraseñas con algoritmo de hash robusto
- Helmet previene vulnerabilidades web comunes (XSS, clickjacking)
- Rate limiting protege contra ataques DoS

### Base de Datos
- **MySQL 8.0**: Base de datos principal
- **MySQL Replication**: Sincronización maestro-esclavo
- **Redis** (opcional): Caché de sesiones y consultas frecuentes

**Justificación**:
- MySQL soporta transacciones ACID necesarias para operaciones financieras
- Replicación nativa facilita la distribución de datos
- Amplio soporte de la comunidad y herramientas

---

## 🎨 Diseño UI/UX

### Paleta de Colores

```css
/* Colores Principales */
--primary: #0066CC      /* Azul - Confianza y profesionalismo médico */
--secondary: #00A86B    /* Verde - Salud y bienestar */
--accent: #FF6B35       /* Naranja - Llamados a la acción */
--dark: #1E293B         /* Gris oscuro - Textos principales */
--light: #F8FAFC        /* Blanco azulado - Fondos */

/* Estados */
--success: #10B981      /* Verde - Operaciones exitosas */
--warning: #F59E0B      /* Amarillo - Advertencias */
--danger: #EF4444       /* Rojo - Errores y alertas */
--info: #3B82F6         /* Azul claro - Información */
```

**Significado**:
- **Azul**: Transmite confianza, profesionalismo y relación con el sector salud
- **Verde**: Representa salud, bienestar y seguridad farmacéutica
- **Naranja**: Energía y llamados a la acción sin ser agresivo

### Principios de Diseño

1. **Claridad**: Información médica debe ser clara y fácil de leer
2. **Accesibilidad**: Contraste WCAG AAA para lectura óptima
3. **Eficiencia**: Flujos rápidos para atención al cliente
4. **Responsividad**: Funcional en tablets, computadoras y puntos de venta

### Funciones Clave de la Interfaz

#### Para Vendedores/Cajeros
- **Punto de Venta Rápido**: Búsqueda de productos por código de barras o nombre
- **Verificación de Recetas**: Sistema de validación de prescripciones médicas
- **Gestión de Cliente**: Registro rápido y búsqueda de clientes frecuentes
- **Cobro Multi-método**: Efectivo, tarjeta, transferencia en una misma pantalla

#### Para Gerentes
- **Dashboard Ejecutivo**: KPIs en tiempo real (ventas, inventario crítico, caducidades)
- **Control de Inventario**: Alertas de stock bajo y productos próximos a vencer
- **Reportes**: Ventas por período, productos más vendidos, análisis de proveedores
- **Gestión de Personal**: Horarios, ventas por empleado, comisiones

#### Para Administradores
- **Panel Multi-Sucursal**: Vista consolidada de todas las farmacias
- **Configuración de Productos**: Actualización de precios centralizada
- **Gestión de Proveedores**: Órdenes de compra y seguimiento
- **Auditoría**: Logs de operaciones y sincronizaciones

### Responsividad

```
Desktop (≥1024px)    → Layout con sidebar + contenido principal
Tablet (768-1023px)  → Sidebar colapsable
Mobile (≤767px)      → Navegación inferior + menú hamburguesa
```

---

## 🔐 Seguridad del Sistema

### 1. Autenticación y Autorización

**JSON Web Tokens (JWT)**
```javascript
// Estructura del Token
{
  "sub": "id_empleado",
  "username": "jperez",
  "rol": "gerente",
  "id_sucursal": 1,
  "iat": 1712345678,
  "exp": 1712432078
}
```

**Niveles de Acceso**:
- **Admin**: Acceso total al sistema, configuración de sucursales
- **Gerente**: Gestión completa de su sucursal, reportes
- **Empleado**: Ventas, consultas de inventario, registro de clientes

### 2. Encriptación de Datos

**Contraseñas**:
```javascript
// Hash con bcrypt (10 rounds)
const salt = await bcrypt.genSalt(10);
const hash = await bcrypt.hash(password, salt);
// Resultado: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

**Datos Sensibles**:
- Contraseñas: bcrypt con salt de 10 rounds
- Tokens: HS256 con clave secreta de 256 bits
- Conexiones: TLS/SSL para comunicación BD-Backend
- Transmisión: HTTPS obligatorio en producción

### 3. Protección contra Ataques

**SQL Injection**:
```javascript
// Uso de Prepared Statements con Sequelize
await Producto.findAll({
  where: { nombre: { [Op.like]: `%${searchTerm}%` } }
});
// Los parámetros se escapan automáticamente
```

**XSS (Cross-Site Scripting)**:
- Sanitización de inputs con express-validator
- Content Security Policy headers con Helmet
- Escape automático en templates de React

**CSRF (Cross-Site Request Forgery)**:
- Tokens CSRF en formularios críticos
- SameSite cookies
- Validación de origen de peticiones

**Fuerza Bruta**:
```javascript
// Rate limiting: 5 intentos por 15 minutos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Demasiados intentos, intente nuevamente más tarde'
});
```

### 4. Auditoría

- Logs de todas las operaciones críticas (ventas, cambios de inventario)
- Registro de accesos al sistema con IP y timestamp
- Trazabilidad de sincronizaciones entre BD
- Backups automáticos diarios con retención de 30 días

---

## 📁 Estructura del Proyecto

```
PROYECTO FINAL BASE DE DATOS DISTRIBUIDA/
├── backend/
│   ├── config/
│   │   ├── database.js          # Configuración de conexiones BD
│   │   ├── auth.js               # Configuración JWT
│   │   └── sync.js               # Configuración sincronización
│   ├── models/
│   │   ├── central/              # Modelos de BD central
│   │   │   ├── Producto.js
│   │   │   ├── Proveedor.js
│   │   │   ├── Empleado.js
│   │   │   ├── Cliente.js
│   │   │   └── Sucursal.js
│   │   └── local/                # Modelos de BD local
│   │       ├── Inventario.js
│   │       ├── Venta.js
│   │       ├── DetalleVenta.js
│   │       ├── Compra.js
│   │       └── DetalleCompra.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productosController.js
│   │   ├── ventasController.js
│   │   ├── inventarioController.js
│   │   ├── comprasController.js
│   │   └── reportesController.js
│   ├── middleware/
│   │   ├── auth.js               # Verificación JWT
│   │   ├── authorization.js      # Control de acceso por rol
│   │   ├── validation.js         # Validación de datos
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── productos.js
│   │   ├── ventas.js
│   │   ├── inventario.js
│   │   ├── compras.js
│   │   └── reportes.js
│   ├── services/
│   │   ├── syncService.js        # Servicio de sincronización
│   │   └── reportService.js
│   ├── utils/
│   │   └── logger.js
│   ├── app.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Footer.jsx
│   │   │   ├── ventas/
│   │   │   │   ├── PuntoVenta.jsx
│   │   │   │   ├── BuscadorProductos.jsx
│   │   │   │   └── TicketVenta.jsx
│   │   │   ├── inventario/
│   │   │   │   ├── ListaInventario.jsx
│   │   │   │   ├── AlertasStock.jsx
│   │   │   │   └── Caducidades.jsx
│   │   │   └── dashboard/
│   │   │       ├── DashboardGerente.jsx
│   │   │       └── DashboardAdmin.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Ventas.jsx
│   │   │   ├── Inventario.jsx
│   │   │   ├── Compras.jsx
│   │   │   ├── Clientes.jsx
│   │   │   └── Reportes.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   └── ventasService.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── database/
│   ├── schema_central.sql        # Schema BD central
│   ├── schema_local.sql          # Schema BD local (sucursales)
│   ├── triggers.sql              # Triggers de sincronización
│   └── views.sql                 # Vistas útiles
├── scripts/
│   ├── sync_daemon.js            # Daemon de sincronización
│   ├── backup.sh                 # Script de respaldo
│   └── migration.js              # Scripts de migración
├── docs/
│   ├── ARQUITECTURA.md
│   ├── MANUAL_USUARIO.md
│   ├── MANUAL_TECNICO.md
│   ├── INSTALACION.md
│   └── diagramas/
│       ├── arquitectura.png
│       ├── diagrama_er.png
│       └── flujo_sincronizacion.png
└── README.md
```

---

## 🚀 Instalación y Configuración

Ver [INSTALACION.md](docs/INSTALACION.md) para instrucciones detalladas.

### Requisitos Previos
- Node.js 18+ 
- MySQL 8.0+
- npm o yarn

### Inicio Rápido

```bash
# 1. Clonar/descargar el proyecto
cd "PROYECTO FINAL BASE DE DATOS DISTRIBUIDA"

# 2. Crear bases de datos
mysql -u root -p < database/schema_central.sql
mysql -u root -p < database/schema_local.sql

# 3. Instalar dependencias del backend
cd backend
npm install
cp .env.example .env
# Editar .env con credenciales de BD

# 4. Instalar dependencias del frontend
cd ../frontend
npm install

# 5. Iniciar servicios
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# 6. Iniciar daemon de sincronización
cd scripts && node sync_daemon.js
```

---

## 📖 Documentación Adicional

- [Arquitectura del Sistema](docs/ARQUITECTURA.md)
- [Manual de Usuario](docs/MANUAL_USUARIO.md)
- [Manual Técnico](docs/MANUAL_TECNICO.md)
- [Guía de Instalación](docs/INSTALACION.md)

---

## 👥 Equipo de Desarrollo

**Proyecto Final - Base de Datos Distribuida**

Universidad: [Nombre de Universidad]  
Materia: Base de Datos Distribuida  
Profesor: [Nombre del Profesor]  
Fecha: Abril 2026

---

## 📝 Licencia

Este proyecto es desarrollado con fines educativos para la materia de Base de Datos Distribuida.

---

## 🎓 Referencias

- MySQL Documentation - Database Replication: https://dev.mysql.com/doc/refman/8.0/en/replication.html
- Distributed Database Design: https://sites.google.com/site/201508bddsainzaranza/
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
- React Documentation: https://react.dev/

---

**Desarrollado con** ❤️ **para aprender bases de datos distribuidas**
