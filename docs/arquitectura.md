# 🏗️ Arquitectura del Sistema — Dr. Simi

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Diagrama de Arquitectura](#diagrama-de-arquitectura)
- [Componentes del Sistema](#componentes-del-sistema)
- [Flujo de Datos](#flujo-de-datos)
- [Modelo de Sincronización](#modelo-de-sincronización)
- [Seguridad](#seguridad)
- [Escalabilidad](#escalabilidad)
- [Decisiones de Diseño](#decisiones-de-diseño)

---

## Visión General

El sistema **Dr. Simi** implementa una arquitectura de **base de datos distribuida asimétrica** donde:

- Una **base de datos central** almacena la información maestra y consolida los datos de todas las sucursales.
- Cada **sucursal** posee su propia base de datos local que opera de manera autónoma.
- Un **servicio daemon** de sincronización mantiene la coherencia entre ambas bases de datos.

Este diseño garantiza **alta disponibilidad**: si la conexión con la base central se interrumpe, la sucursal continúa operando normalmente con su base local y sincroniza los cambios cuando se restaura la conectividad.

---

## Diagrama de Arquitectura

```
┌──────────────────────────────────────────────────────────────────┐
│                     SERVIDOR CENTRAL                              │
│                                                                  │
│  ┌─────────────────┐        ┌──────────────────────────────┐    │
│  │  API REST        │        │      MySQL CENTRAL           │    │
│  │  (Express.js)   │◄──────►│      (db_central)            │    │
│  │  :3000          │        │      Catálogo maestro         │    │
│  └─────────────────┘        │      Historial consolidado   │    │
│           ▲                 │      Configuraciones globales│    │
│           │                 └──────────────────────────────┘    │
│  ┌─────────────────┐                     ▲                      │
│  │  Sync Daemon    │─────────────────────┘                      │
│  │  (central)      │                                            │
│  └─────────────────┘                                            │
└──────────────┬───────────────────────────────────────────────────┘
               │ Internet / VPN / LAN
               │ (HTTPS + JWT)
    ┌──────────┴──────────────────────────────────────┐
    │                                                 │
┌───▼──────────────────────────┐    ┌───────────────────────────────┐
│      SUCURSAL 1              │    │       SUCURSAL N               │
│                              │    │                               │
│ ┌──────────┐ ┌────────────┐  │    │ ┌──────────┐ ┌────────────┐  │
│ │ Frontend │ │ API Local  │  │    │ │ Frontend │ │ API Local  │  │
│ │ (React)  │►│ (Express)  │  │    │ │ (React)  │►│ (Express)  │  │
│ └──────────┘ └─────┬──────┘  │    │ └──────────┘ └─────┬──────┘  │
│                    │         │    │                    │          │
│              ┌─────▼──────┐  │    │              ┌─────▼──────┐  │
│              │MySQL LOCAL │  │    │              │MySQL LOCAL │  │
│              │db_local_s1 │  │    │              │db_local_sN │  │
│              └────────────┘  │    │              └────────────┘  │
│                    ▲         │    │                    ▲         │
│              ┌─────┴──────┐  │    │              ┌─────┴──────┐  │
│              │Sync Daemon │  │    │              │Sync Daemon │  │
│              │(sucursal)  │  │    │              │(sucursal)  │  │
│              └────────────┘  │    │              └────────────┘  │
└──────────────────────────────┘    └───────────────────────────────┘
```

---

## Componentes del Sistema

### 1. 🖥️ API REST (Backend)

**Tecnología:** Node.js 18+ con Express.js  
**Puerto:** 3000 (configurable)  
**Responsabilidades:**
- Exponer endpoints RESTful para el frontend
- Validar tokens JWT en cada solicitud
- Aplicar control de acceso basado en roles (RBAC)
- Coordinar operaciones entre la BD local y central
- Registrar logs de auditoría

**Estructura de módulos:**
```
src/
├── config/        → Configuración de conexiones y app
├── controllers/   → Lógica de negocio por módulo
├── middleware/    → JWT, RBAC, validación, errores
├── models/        → Definición de entidades y queries
├── routes/        → Definición de rutas REST
└── services/      → Servicios transversales (sync, reportes)
```

### 2. 🌐 Frontend (Cliente)

**Tecnología:** React 18 + Vite + Tailwind CSS  
**Puerto:** 5173 (desarrollo)  
**Responsabilidades:**
- Interfaz de usuario responsiva y moderna
- Autenticación y gestión de sesión JWT
- Consumo de la API REST con Axios
- Caché inteligente con React Query

**Vistas principales:**
- `/login` — Autenticación
- `/dashboard` — Panel principal con KPIs
- `/ventas` — Registro y consulta de ventas
- `/inventario` — Gestión de productos y stock
- `/clientes` — CRM básico
- `/empleados` — Gestión de personal
- `/sync-status` — Estado del daemon de sincronización

### 3. 🗄️ Base de Datos Central (MySQL)

**Base de datos:** `db_central`  
**Responsabilidades:**
- Catálogo maestro de productos (fuente de verdad)
- Consolidación de ventas de todas las sucursales
- Configuraciones y parámetros globales del sistema
- Tabla de control de sincronización (`sync_log`)
- Usuarios y roles del sistema

### 4. 🗄️ Base de Datos Local (MySQL por sucursal)

**Base de datos:** `db_local_<sucursal_id>`  
**Responsabilidades:**
- Operaciones diarias autónomas (ventas, inventario)
- Cola de cambios pendientes de sincronizar (`sync_queue`)
- Caché del catálogo central de productos
- Datos específicos de la sucursal

### 5. 🔄 Daemon de Sincronización

**Tecnología:** Node.js (proceso independiente)  
**Responsabilidades:**
- Detectar cambios nuevos en la BD local desde la última sincronización
- Enviar los cambios a la API central
- Recibir y aplicar actualizaciones del servidor central
- Resolver conflictos de datos con estrategia configurable
- Registrar el historial de sincronizaciones

Ver detalles en [`sincronizacion.md`](sincronizacion.md).

---

## Flujo de Datos

### Registro de una Venta (flujo normal)

```
Cliente/Cajero
     │
     ▼
[React Frontend]  → POST /api/v1/ventas
     │
     ▼
[Express API]  → Valida JWT + Rol
     │
     ▼
[ventasController]  → Inicia transacción MySQL
     │
     ├─→ INSERT ventas (db_local)
     ├─→ UPDATE inventario (db_local)
     ├─→ INSERT sync_queue (db_local) ← marcar para sincronización
     │
     ▼
[Respuesta HTTP 201]  → Confirmación al frontend
     │
     ▼ (asíncrono, cada SYNC_INTERVAL_MS ms)
[Sync Daemon]  → Lee sync_queue pendientes
     │
     ▼
[API Central]  → POST /api/v1/sync/push
     │
     ▼
[db_central]  → Aplica cambios / resuelve conflictos
```

### Actualización del Catálogo (flujo central → sucursal)

```
[Admin Central]
     │
     ▼
[API Central]  → PUT /api/v1/productos/:id
     │
     ▼
[db_central]  → UPDATE productos + INSERT sync_log
     │
     ▼ (próximo ciclo del daemon)
[Sync Daemon en sucursal]  → GET /api/v1/sync/pull
     │
     ▼
[db_local]  → UPSERT productos (actualiza catálogo local)
```

---

## Modelo de Sincronización

El sistema utiliza un modelo de **sincronización basada en timestamps y versioning**:

1. **Columnas de control** en cada tabla sincronizable:
   - `created_at` — Timestamp de creación
   - `updated_at` — Timestamp de última modificación
   - `version` — Contador de versión (optimistic locking)
   - `sucursal_id` — Identificador de origen

2. **Tabla `sync_queue`** en la BD local:
   - Almacena cada cambio pendiente de sincronizar
   - Estado: `PENDING → IN_PROGRESS → DONE / FAILED`

3. **Tabla `sync_log`** en la BD central:
   - Historial completo de sincronizaciones
   - Útil para auditoría y resolución de problemas

4. **Resolución de conflictos:**
   - Estrategia por defecto: **Last-Write-Wins** basado en `updated_at`
   - Para inventario: aplicación de **deltas** (no valores absolutos)
   - Conflictos irresolubles → cola de revisión manual

Ver detalles completos en [`sincronizacion.md`](sincronizacion.md).

---

## Seguridad

### Autenticación

- Todos los endpoints (excepto `/auth/login`) requieren un token **JWT Bearer**
- Tokens con expiración configurable (por defecto: 8 horas)
- Refresh tokens para sesiones de larga duración
- Almacenamiento del token en `httpOnly` cookies (producción)

### Autorización (RBAC)

| Rol | Permisos |
|---|---|
| `super_admin` | Acceso total al sistema y configuración |
| `admin` | Gestión completa de sucursales asignadas |
| `gerente` | Gestión de su sucursal (inventario, empleados, reportes) |
| `cajero` | Registro de ventas y consulta de inventario |
| `almacenista` | Gestión de inventario |

### Comunicación

- HTTPS obligatorio en producción (certificado SSL/TLS)
- El daemon de sincronización usa HTTPS + autenticación por token de servicio
- Datos sensibles (contraseñas) hasheados con **bcrypt** (cost factor 12)

### Base de Datos

- Usuario MySQL dedicado con permisos mínimos necesarios por base de datos
- No se almacenan datos de tarjetas de crédito en el sistema
- Logs de auditoría para todas las operaciones críticas

---

## Escalabilidad

### Horizontal

- **Múltiples sucursales:** El sistema soporta N sucursales sin cambios de arquitectura. Cada sucursal recibe su propio `sucursal_id` y su BD local.
- **Balanceo de carga:** El servidor central puede escalarse detrás de un load balancer (Nginx, HAProxy).

### Vertical

- El servidor de la BD central puede actualizarse de hardware independientemente.
- Índices optimizados para las consultas más frecuentes.
- Caché de consultas con **Redis** (roadmap).

### Límites conocidos

| Componente | Límite actual | Estrategia de escalado |
|---|---|---|
| Sucursales | ~50 concurrentes | Redis pub/sub para sincronización |
| Transacciones/día | ~10,000 por sucursal | Particionamiento de tablas por fecha |
| Usuarios concurrentes | ~100 por instancia API | Clústeres Node.js + load balancer |

---

## Decisiones de Diseño

### ¿Por qué BD local en cada sucursal?

**Alternativa considerada:** Conectarse siempre a la BD central.

**Decisión:** BD local + sincronización.

**Razones:**
1. Las farmacias pueden tener conexión a internet inestable.
2. La latencia de red afectaría la experiencia del cajero.
3. Mayor resiliencia operativa ante fallas del servidor central.

### ¿Por qué MySQL y no PostgreSQL?

- MySQL es la BD más conocida en el entorno de pequeñas y medianas empresas en México.
- Amplio soporte de proveedores de hosting locales.
- El equipo tiene mayor experiencia con MySQL.

### ¿Por qué REST y no GraphQL?

- El equipo tiene mayor familiaridad con REST.
- Los endpoints son bien definidos y relativamente estables.
- GraphQL añadiría complejidad sin beneficios claros para este caso de uso.

### ¿Por qué un daemon independiente y no un cron job?

- El daemon puede detectar el momento óptimo para sincronizar.
- Permite backpressure: si la central está caída, el daemon espera y reintenta.
- Manejo de errores más sofisticado y logging propio.
