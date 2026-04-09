# 💊 Dr. Simi — Sistema de Gestión de Base de Datos Distribuida

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)](https://www.mysql.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Sistema distribuido de gestión para la cadena de farmacias **Dr. Simi**, diseñado para sincronizar datos en tiempo real entre una base de datos central y múltiples sucursales.

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación Rápida](#-instalación-rápida)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Documentación Completa](#-documentación-completa)
- [API Reference](#-api-reference)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## 📖 Descripción General

**Dr. Simi** es una plataforma de gestión empresarial diseñada para cadenas de farmacias con múltiples sucursales. El sistema implementa una arquitectura de base de datos distribuida que permite:

- **Operación offline:** Cada sucursal opera de manera independiente con su base de datos local.
- **Sincronización automática:** Un servicio daemon mantiene los datos actualizados entre la base central y las sucursales.
- **Gestión centralizada:** El administrador central monitorea todas las sucursales desde una sola interfaz.
- **Alta disponibilidad:** Ante fallas de red, las sucursales continúan operando y sincronizan cuando se restaura la conexión.

---

## ✨ Características

| Módulo | Funcionalidades |
|---|---|
| 🛒 **Ventas** | Registro de transacciones, tickets, historial, reportes diarios/mensuales |
| 📦 **Inventario** | Control de stock, alertas de reabastecimiento, movimientos entre sucursales |
| 👥 **Clientes** | Registro, historial de compras, programa de puntos/lealtad |
| 👨‍💼 **Empleados** | Gestión de personal, roles, turnos, asistencia |
| 🔄 **Sincronización** | Daemon automático, resolución de conflictos, logs de sincronización |
| 📊 **Reportes** | Dashboard en tiempo real, exportación a PDF/Excel |
| 🔐 **Seguridad** | Autenticación JWT, control de acceso basado en roles (RBAC) |

---

## 🛠️ Stack Tecnológico

```
┌─────────────────────────────────────────────┐
│               FRONTEND                       │
│   React 18 + Vite + Tailwind CSS            │
│   React Router + Axios + React Query        │
└─────────────────────────────────────────────┘
         │ HTTP/REST (JSON)
┌─────────────────────────────────────────────┐
│               BACKEND                        │
│   Node.js 18+ + Express.js                  │
│   JWT Auth + bcrypt + Winston (logs)        │
└─────────────────────────────────────────────┘
      │                        │
┌──────────┐            ┌──────────────┐
│  MySQL   │            │    MySQL     │
│ CENTRAL  │◄──sync────►│   LOCAL     │
│(servidor)│            │ (sucursal)  │
└──────────┘            └──────────────┘
```

**Backend:** Node.js 18+ / Express.js  
**Frontend:** React 18 / Vite / Tailwind CSS  
**Base de Datos:** MySQL 8.0 (instancia central + instancia local por sucursal)  
**Autenticación:** JSON Web Tokens (JWT)  
**Sincronización:** Servicio daemon Node.js  
**DevOps:** Docker / Docker Compose (opcional)

---

## 🏗️ Arquitectura

Ver documentación completa en [`docs/arquitectura.md`](docs/arquitectura.md).

El sistema utiliza una arquitectura **maestro-réplica asimétrica**:

- **Base de datos central** (`db_central`): Alojada en el servidor principal. Contiene el catálogo maestro de productos, configuraciones globales y el historial consolidado de todas las sucursales.
- **Base de datos local** (`db_local_<sucursal>`): Una instancia MySQL por cada sucursal. Procesa las operaciones del día a día de manera autónoma.
- **Servicio de sincronización**: Daemon Node.js que se ejecuta en cada sucursal y en el servidor central, detectando cambios y propagándolos de forma segura.

---

## 📁 Estructura del Proyecto

```
Dr.Simi/
├── 📁 backend/                    # Servidor API REST
│   ├── 📁 src/
│   │   ├── 📁 config/             # Configuración DB y app
│   │   │   ├── database.js        # Conexiones MySQL (central + local)
│   │   │   └── config.js          # Variables de entorno
│   │   ├── 📁 controllers/        # Lógica de negocio
│   │   │   ├── authController.js
│   │   │   ├── ventasController.js
│   │   │   ├── inventarioController.js
│   │   │   ├── clientesController.js
│   │   │   └── empleadosController.js
│   │   ├── 📁 middleware/         # Middlewares Express
│   │   │   ├── authMiddleware.js  # Verificación JWT
│   │   │   ├── roleMiddleware.js  # Control de acceso RBAC
│   │   │   └── errorHandler.js
│   │   ├── 📁 models/             # Modelos de datos
│   │   │   ├── Venta.js
│   │   │   ├── Producto.js
│   │   │   ├── Cliente.js
│   │   │   └── Empleado.js
│   │   ├── 📁 routes/             # Rutas API REST
│   │   │   ├── auth.routes.js
│   │   │   ├── ventas.routes.js
│   │   │   ├── inventario.routes.js
│   │   │   ├── clientes.routes.js
│   │   │   └── empleados.routes.js
│   │   ├── 📁 services/           # Servicios de negocio
│   │   │   ├── syncService.js     # Lógica de sincronización
│   │   │   └── reportService.js
│   │   └── app.js                 # Entrada principal Express
│   ├── 📁 sync-daemon/            # Servicio de sincronización
│   │   ├── daemon.js              # Proceso daemon principal
│   │   └── conflictResolver.js   # Resolución de conflictos
│   ├── package.json
│   └── .env.example
│
├── 📁 frontend/                   # Cliente React
│   ├── 📁 src/
│   │   ├── 📁 components/         # Componentes reutilizables
│   │   │   ├── Layout/
│   │   │   ├── Sidebar/
│   │   │   └── DataTable/
│   │   ├── 📁 pages/              # Vistas principales
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Ventas.jsx
│   │   │   ├── Inventario.jsx
│   │   │   ├── Clientes.jsx
│   │   │   ├── Empleados.jsx
│   │   │   └── Login.jsx
│   │   ├── 📁 hooks/              # Custom hooks
│   │   │   └── useAuth.js
│   │   ├── 📁 services/           # Llamadas a la API
│   │   │   └── api.js
│   │   ├── 📁 store/              # Estado global (Context/Zustand)
│   │   └── App.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── 📁 database/                   # Scripts SQL
│   ├── central_schema.sql         # Esquema BD central
│   ├── local_schema.sql           # Esquema BD local (sucursal)
│   └── seed_data.sql              # Datos de prueba
│
├── 📁 docs/                       # Documentación técnica
│   ├── arquitectura.md
│   ├── instalacion.md
│   ├── api.md
│   ├── base-de-datos.md
│   ├── sincronizacion.md
│   ├── configuracion.md
│   ├── despliegue.md
│   └── desarrollo.md
│
├── docker-compose.yml             # Orquestación Docker (opcional)
├── .gitignore
└── README.md
```

---

## ⚙️ Requisitos Previos

| Herramienta | Versión mínima | Descripción |
|---|---|---|
| Node.js | 18.0+ | Entorno de ejecución |
| npm | 9.0+ | Gestor de paquetes |
| MySQL | 8.0+ | Motor de base de datos |
| Git | 2.30+ | Control de versiones |
| Docker | 24.0+ | Contenedores (opcional) |

---

## 🚀 Instalación Rápida

```bash
# 1. Clonar el repositorio
git clone https://github.com/alex010-cmd/Dr.Simi.git
cd Dr.Simi

# 2. Instalar dependencias del backend
cd backend && npm install

# 3. Instalar dependencias del frontend
cd ../frontend && npm install

# 4. Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus datos

# 5. Inicializar las bases de datos
mysql -u root -p < database/central_schema.sql
mysql -u root -p < database/local_schema.sql
mysql -u root -p < database/seed_data.sql

# 6. Iniciar el backend
cd backend && npm start

# 7. Iniciar el frontend (nueva terminal)
cd frontend && npm run dev

# 8. Iniciar el daemon de sincronización (nueva terminal)
cd backend && npm run daemon
```

Para instrucciones detalladas ver [`docs/instalacion.md`](docs/instalacion.md).

---

## ⚙️ Configuración

Copia el archivo `.env.example` y configura las variables:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos CENTRAL
DB_CENTRAL_HOST=localhost
DB_CENTRAL_PORT=3306
DB_CENTRAL_NAME=db_central
DB_CENTRAL_USER=root
DB_CENTRAL_PASSWORD=your_password

# Base de datos LOCAL (sucursal)
DB_LOCAL_HOST=localhost
DB_LOCAL_PORT=3307
DB_LOCAL_NAME=db_local_sucursal1
DB_LOCAL_USER=root
DB_LOCAL_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=8h

# Sincronización
SYNC_INTERVAL_MS=30000
SUCURSAL_ID=1
```

Ver configuración completa en [`docs/configuracion.md`](docs/configuracion.md).

---

## 🖥️ Uso

### Iniciar en modo desarrollo

```bash
# Backend (con hot-reload)
cd backend && npm run dev

# Frontend (con HMR)
cd frontend && npm run dev

# Daemon de sincronización
cd backend && npm run daemon
```

### Credenciales por defecto (seed data)

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin@drsimi.com` | `Admin123!` | Administrador Central |
| `gerente@sucursal1.com` | `Gerente123!` | Gerente de Sucursal |
| `cajero@sucursal1.com` | `Cajero123!` | Cajero |

> ⚠️ **Importante:** Cambiar estas credenciales inmediatamente en producción.

---

## 📚 Documentación Completa

| Documento | Descripción |
|---|---|
| [🏗️ Arquitectura](docs/arquitectura.md) | Diseño del sistema, diagramas, decisiones técnicas |
| [📥 Instalación](docs/instalacion.md) | Guía paso a paso para configurar el entorno |
| [🔌 API REST](docs/api.md) | Referencia completa de endpoints |
| [🗄️ Base de Datos](docs/base-de-datos.md) | Esquemas, relaciones y modelo ER |
| [🔄 Sincronización](docs/sincronizacion.md) | Daemon, algoritmos, resolución de conflictos |
| [⚙️ Configuración](docs/configuracion.md) | Variables de entorno y parámetros |
| [🚢 Despliegue](docs/despliegue.md) | Deploy en producción y Docker |
| [👨‍💻 Desarrollo](docs/desarrollo.md) | Guía para contribuidores |

---

## 🔌 API Reference

Base URL: `http://localhost:3000/api/v1`

### Autenticación

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@drsimi.com",
  "password": "Admin123!"
}
```

**Respuesta:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "nombre": "Administrador",
    "rol": "admin"
  }
}
```

Ver la referencia completa en [`docs/api.md`](docs/api.md).

---

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Haz commit de tus cambios: `git commit -m 'feat: agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

Ver guía completa en [`docs/desarrollo.md`](docs/desarrollo.md).

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

<div align="center">
  <strong>💊 Dr. Simi</strong> — Construido con ❤️ para la salud de México
</div>
