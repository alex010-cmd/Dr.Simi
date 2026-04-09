# ⚙️ Configuración — Dr. Simi

## Tabla de Contenidos

- [Archivos de Configuración](#archivos-de-configuración)
- [Variables de Entorno — Backend](#variables-de-entorno--backend)
- [Variables de Entorno — Frontend](#variables-de-entorno--frontend)
- [Variables de Entorno — Daemon](#variables-de-entorno--daemon)
- [Configuración de MySQL](#configuración-de-mysql)
- [Configuración de JWT](#configuración-de-jwt)
- [Configuración por Entorno](#configuración-por-entorno)
- [Configuración de Docker](#configuración-de-docker)

---

## Archivos de Configuración

| Archivo | Descripción | ¿Se commitea? |
|---|---|---|
| `backend/.env` | Variables de entorno del backend | ❌ NO (en .gitignore) |
| `backend/.env.example` | Plantilla de ejemplo | ✅ SÍ |
| `frontend/.env.local` | Variables del frontend | ❌ NO (en .gitignore) |
| `frontend/.env.example` | Plantilla de ejemplo | ✅ SÍ |
| `docker-compose.yml` | Configuración de contenedores | ✅ SÍ |
| `backend/src/config/database.js` | Configuración de conexiones MySQL | ✅ SÍ |
| `backend/src/config/config.js` | Configuración general de la app | ✅ SÍ |

> ⚠️ **Regla de oro:** Nunca commitear archivos `.env` con credenciales reales. Siempre usar `.env.example` como plantilla.

---

## Variables de Entorno — Backend

Archivo: `backend/.env`

### Servidor

| Variable | Tipo | Default | Descripción |
|---|---|---|---|
| `PORT` | number | `3000` | Puerto en el que escucha el servidor |
| `NODE_ENV` | string | `development` | Entorno: `development`, `test`, `production` |
| `CORS_ORIGIN` | string | `http://localhost:5173` | Origen permitido para CORS (en producción, URL del frontend) |

### Base de Datos Central

| Variable | Tipo | Requerida | Descripción |
|---|---|---|---|
| `DB_CENTRAL_HOST` | string | ✅ | Host del servidor MySQL central |
| `DB_CENTRAL_PORT` | number | | Puerto de MySQL central (default: `3306`) |
| `DB_CENTRAL_NAME` | string | ✅ | Nombre de la base de datos central |
| `DB_CENTRAL_USER` | string | ✅ | Usuario de MySQL para la BD central |
| `DB_CENTRAL_PASSWORD` | string | ✅ | Contraseña de MySQL para la BD central |
| `DB_CENTRAL_POOL_MIN` | number | | Conexiones mínimas en el pool (default: `2`) |
| `DB_CENTRAL_POOL_MAX` | number | | Conexiones máximas en el pool (default: `10`) |

### Base de Datos Local (Sucursal)

| Variable | Tipo | Requerida | Descripción |
|---|---|---|---|
| `DB_LOCAL_HOST` | string | ✅ | Host del servidor MySQL local |
| `DB_LOCAL_PORT` | number | | Puerto de MySQL local (default: `3306`) |
| `DB_LOCAL_NAME` | string | ✅ | Nombre de la base de datos local |
| `DB_LOCAL_USER` | string | ✅ | Usuario de MySQL para la BD local |
| `DB_LOCAL_PASSWORD` | string | ✅ | Contraseña de MySQL para la BD local |
| `DB_LOCAL_POOL_MIN` | number | | Conexiones mínimas (default: `1`) |
| `DB_LOCAL_POOL_MAX` | number | | Conexiones máximas (default: `5`) |

### JWT y Seguridad

| Variable | Tipo | Requerida | Descripción |
|---|---|---|---|
| `JWT_SECRET` | string | ✅ | Clave secreta para firmar tokens JWT. **Mínimo 64 caracteres en producción.** |
| `JWT_EXPIRES_IN` | string | | Duración del token (default: `8h`). Formatos: `60s`, `30m`, `8h`, `7d` |
| `JWT_REFRESH_SECRET` | string | | Clave para tokens de refresco (si es diferente a `JWT_SECRET`) |
| `JWT_REFRESH_EXPIRES_IN` | string | | Duración del refresh token (default: `7d`) |
| `BCRYPT_ROUNDS` | number | | Rondas de hashing bcrypt (default: `12`) |

### Sincronización

| Variable | Tipo | Requerida | Descripción |
|---|---|---|---|
| `SUCURSAL_ID` | number | ✅ | ID numérico de esta sucursal (debe existir en BD central) |
| `CENTRAL_API_URL` | string | ✅ | URL base de la API central (ej: `https://central.drsimi.com`) |
| `SYNC_SERVICE_TOKEN` | string | ✅ | Token compartido para autenticar el daemon con la API central |
| `SYNC_INTERVAL_MS` | number | | Intervalo entre sincronizaciones en ms (default: `30000`) |
| `SYNC_BATCH_SIZE` | number | | Máx. registros por lote push (default: `100`) |
| `SYNC_MAX_ATTEMPTS` | number | | Máx. reintentos por registro (default: `5`) |
| `SYNC_HTTP_TIMEOUT_MS` | number | | Timeout HTTP del daemon en ms (default: `15000`) |

### Logging

| Variable | Tipo | Default | Descripción |
|---|---|---|---|
| `LOG_LEVEL` | string | `info` | Nivel de log: `error`, `warn`, `info`, `debug` |
| `LOG_FILE` | string | `logs/app.log` | Ruta del archivo de log (relativa a `backend/`) |
| `LOG_MAX_FILES` | number | `7` | Días de logs a conservar |

### Plantilla completa `.env.example`

```env
# ══════════════════════════════════════════════════════
#   Dr. Simi — Configuración del Backend
#   Copiar a .env y rellenar con valores reales
# ══════════════════════════════════════════════════════

# ── SERVIDOR ──────────────────────────────────────────
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# ── BASE DE DATOS CENTRAL ─────────────────────────────
DB_CENTRAL_HOST=localhost
DB_CENTRAL_PORT=3306
DB_CENTRAL_NAME=db_central
DB_CENTRAL_USER=drsimi_central
DB_CENTRAL_PASSWORD=CHANGE_ME
DB_CENTRAL_POOL_MIN=2
DB_CENTRAL_POOL_MAX=10

# ── BASE DE DATOS LOCAL (SUCURSAL) ────────────────────
DB_LOCAL_HOST=localhost
DB_LOCAL_PORT=3306
DB_LOCAL_NAME=db_local_sucursal1
DB_LOCAL_USER=drsimi_local
DB_LOCAL_PASSWORD=CHANGE_ME
DB_LOCAL_POOL_MIN=1
DB_LOCAL_POOL_MAX=5

# ── JWT / SEGURIDAD ───────────────────────────────────
JWT_SECRET=CHANGE_ME_use_a_very_long_random_string_here_64chars_minimum
JWT_EXPIRES_IN=8h
JWT_REFRESH_SECRET=CHANGE_ME_another_very_long_random_string_for_refresh
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# ── SINCRONIZACIÓN ────────────────────────────────────
SUCURSAL_ID=1
CENTRAL_API_URL=http://localhost:3000
SYNC_SERVICE_TOKEN=CHANGE_ME_sync_service_token_min_32_chars
SYNC_INTERVAL_MS=30000
SYNC_BATCH_SIZE=100
SYNC_MAX_ATTEMPTS=5
SYNC_HTTP_TIMEOUT_MS=15000

# ── LOGGING ───────────────────────────────────────────
LOG_LEVEL=info
LOG_FILE=logs/app.log
LOG_MAX_FILES=7
```

---

## Variables de Entorno — Frontend

Archivo: `frontend/.env.local`

> En Vite, todas las variables de entorno **deben** comenzar con `VITE_` para estar disponibles en el cliente.

| Variable | Default | Descripción |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000/api/v1` | URL base de la API del backend |
| `VITE_APP_NAME` | `Dr. Simi` | Nombre de la aplicación (se muestra en la UI) |
| `VITE_SUCURSAL_NOMBRE` | `Sucursal` | Nombre de la sucursal (se muestra en la UI) |
| `VITE_SESSION_TIMEOUT_MIN` | `480` | Minutos antes de cerrar sesión por inactividad (8h) |

### Plantilla `frontend/.env.example`

```env
# ══════════════════════════════════════════════════════
#   Dr. Simi — Configuración del Frontend
#   Copiar a .env.local y rellenar con valores reales
# ══════════════════════════════════════════════════════

VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Dr. Simi
VITE_SUCURSAL_NOMBRE=Sucursal Centro
VITE_SESSION_TIMEOUT_MIN=480
```

---

## Variables de Entorno — Daemon

El daemon comparte el mismo archivo `.env` del backend, pero usa específicamente:

- `SUCURSAL_ID`
- `CENTRAL_API_URL`
- `SYNC_SERVICE_TOKEN`
- `SYNC_INTERVAL_MS`
- `SYNC_BATCH_SIZE`
- `SYNC_MAX_ATTEMPTS`
- `SYNC_HTTP_TIMEOUT_MS`
- `DB_LOCAL_*` (para leer la cola de sincronización)
- `LOG_LEVEL`

---

## Configuración de MySQL

### Configuración recomendada para `my.cnf` (producción)

```ini
[mysqld]
# Codificación de caracteres
character-set-server = utf8mb4
collation-server     = utf8mb4_unicode_ci

# Rendimiento
innodb_buffer_pool_size = 512M       # 70% de la RAM disponible
innodb_log_file_size    = 128M
innodb_flush_log_at_trx_commit = 1  # Durabilidad máxima

# Conexiones
max_connections = 200
wait_timeout    = 600
interactive_timeout = 600

# Logging (opcional para diagnóstico)
slow_query_log         = 1
slow_query_log_file    = /var/log/mysql/slow.log
long_query_time        = 2
log_queries_not_using_indexes = 1

# Zona horaria
default-time-zone = 'America/Mexico_City'

[client]
default-character-set = utf8mb4
```

### Pool de conexiones en el código

```javascript
// backend/src/config/database.js
const mysql = require('mysql2/promise');

const centralPool = mysql.createPool({
  host:              process.env.DB_CENTRAL_HOST,
  port:              parseInt(process.env.DB_CENTRAL_PORT || '3306'),
  database:          process.env.DB_CENTRAL_NAME,
  user:              process.env.DB_CENTRAL_USER,
  password:          process.env.DB_CENTRAL_PASSWORD,
  waitForConnections: true,
  connectionLimit:   parseInt(process.env.DB_CENTRAL_POOL_MAX || '10'),
  queueLimit:        0,
  timezone:          'America/Mexico_City',
  charset:           'utf8mb4',
});

const localPool = mysql.createPool({
  host:              process.env.DB_LOCAL_HOST,
  port:              parseInt(process.env.DB_LOCAL_PORT || '3306'),
  database:          process.env.DB_LOCAL_NAME,
  user:              process.env.DB_LOCAL_USER,
  password:          process.env.DB_LOCAL_PASSWORD,
  waitForConnections: true,
  connectionLimit:   parseInt(process.env.DB_LOCAL_POOL_MAX || '5'),
  queueLimit:        0,
  timezone:          'America/Mexico_City',
  charset:           'utf8mb4',
});

module.exports = { centralPool, localPool };
```

---

## Configuración de JWT

### Generar un JWT_SECRET seguro

```bash
# En Linux/macOS (genera 64 bytes aleatorios en base64)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# O con openssl
openssl rand -base64 64
```

### Roles y permisos configurados en `config.js`

```javascript
// backend/src/config/config.js
module.exports = {
  roles: {
    SUPER_ADMIN:  'super_admin',
    ADMIN:        'admin',
    GERENTE:      'gerente',
    CAJERO:       'cajero',
    ALMACENISTA:  'almacenista',
  },

  permisos: {
    ventas: {
      crear:    ['cajero', 'gerente', 'admin', 'super_admin'],
      leer:     ['cajero', 'gerente', 'admin', 'super_admin'],
      cancelar: ['gerente', 'admin', 'super_admin'],
    },
    productos: {
      crear:    ['admin', 'super_admin'],
      leer:     ['cajero', 'almacenista', 'gerente', 'admin', 'super_admin'],
      editar:   ['almacenista', 'gerente', 'admin', 'super_admin'],
      eliminar: ['admin', 'super_admin'],
    },
    empleados: {
      crear:    ['admin', 'super_admin'],
      leer:     ['gerente', 'admin', 'super_admin'],
      editar:   ['admin', 'super_admin'],
      eliminar: ['admin', 'super_admin'],
    },
    reportes: {
      basicos:     ['cajero', 'gerente', 'admin', 'super_admin'],
      avanzados:   ['gerente', 'admin', 'super_admin'],
      exportar:    ['gerente', 'admin', 'super_admin'],
    },
  },
};
```

---

## Configuración por Entorno

### `development`

- `LOG_LEVEL=debug` — Logs detallados
- `BCRYPT_ROUNDS=10` — Hashing más rápido para desarrollo
- `SYNC_INTERVAL_MS=60000` — Sincronización cada minuto (menos frecuente)
- CORS abierto

### `test`

- BD de prueba separada (`db_central_test`, `db_local_test`)
- `SYNC_INTERVAL_MS=999999` — El daemon no corre en tests
- `BCRYPT_ROUNDS=4` — Hashing mínimo para velocidad

### `production`

- `LOG_LEVEL=warn` — Solo errores y advertencias
- `BCRYPT_ROUNDS=12` — Seguridad máxima
- `SYNC_INTERVAL_MS=30000` — Sincronización cada 30 segundos
- HTTPS obligatorio
- CORS restringido al dominio del frontend

---

## Configuración de Docker

### `docker-compose.yml` (estructura)

```yaml
version: '3.9'

services:
  mysql-central:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: db_central
      MYSQL_USER: drsimi_central
      MYSQL_PASSWORD: ${DB_CENTRAL_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_central_data:/var/lib/mysql
      - ./database/central_schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./database/seed_data.sql:/docker-entrypoint-initdb.d/02-seed.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  mysql-local:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: db_local_sucursal1
      MYSQL_USER: drsimi_local
      MYSQL_PASSWORD: ${DB_LOCAL_PASSWORD}
    ports:
      - "3307:3306"
    volumes:
      - mysql_local_data:/var/lib/mysql
      - ./database/local_schema.sql:/docker-entrypoint-initdb.d/01-schema.sql

  backend:
    build: ./backend
    env_file: ./backend/.env
    ports:
      - "3000:3000"
    depends_on:
      mysql-central:
        condition: service_healthy
      mysql-local:
        condition: service_healthy

  frontend:
    build: ./frontend
    env_file: ./frontend/.env.local
    ports:
      - "5173:80"
    depends_on:
      - backend

  sync-daemon:
    build:
      context: ./backend
      dockerfile: Dockerfile.daemon
    env_file: ./backend/.env
    depends_on:
      - backend
      - mysql-local
    restart: unless-stopped

volumes:
  mysql_central_data:
  mysql_local_data:
```

### Variables requeridas para Docker Compose

Crea un archivo `.env` en la raíz del proyecto (junto a `docker-compose.yml`):

```env
MYSQL_ROOT_PASSWORD=SuperSecureRootPass123!
DB_CENTRAL_PASSWORD=CentralPass123!
DB_LOCAL_PASSWORD=LocalPass123!
JWT_SECRET=your_jwt_secret_here
SYNC_SERVICE_TOKEN=your_sync_token_here
```
