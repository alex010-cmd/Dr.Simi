# 📥 Guía de Instalación — Dr. Simi

## Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Clonar el Repositorio](#1-clonar-el-repositorio)
- [Configurar las Bases de Datos](#2-configurar-las-bases-de-datos)
- [Configurar el Backend](#3-configurar-el-backend)
- [Configurar el Frontend](#4-configurar-el-frontend)
- [Iniciar el Sistema](#5-iniciar-el-sistema)
- [Verificar la Instalación](#6-verificar-la-instalación)
- [Instalación con Docker](#instalación-con-docker-opcional)
- [Solución de Problemas](#solución-de-problemas)

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

### Node.js y npm

```bash
# Verificar versión (requerido: Node.js >= 18)
node --version   # v18.x.x o superior
npm --version    # 9.x.x o superior
```

**Instalar Node.js 18+ (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Instalar Node.js 18+ (macOS con Homebrew):**
```bash
brew install node@18
```

**Instalar Node.js 18+ (Windows):**
Descargar el instalador desde [nodejs.org](https://nodejs.org/).

### MySQL 8.0+

```bash
# Verificar versión
mysql --version  # mysql  Ver 8.0.x
```

**Instalar MySQL (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

**Instalar MySQL (macOS):**
```bash
brew install mysql
brew services start mysql
```

**Instalar MySQL (Windows):**
Descargar desde [mysql.com/downloads](https://dev.mysql.com/downloads/installer/).

### Git

```bash
git --version   # git version 2.30.x o superior
```

---

## 1. Clonar el Repositorio

```bash
git clone https://github.com/alex010-cmd/Dr.Simi.git
cd Dr.Simi
```

Estructura esperada tras clonar:
```
Dr.Simi/
├── backend/
├── frontend/
├── database/
├── docs/
├── docker-compose.yml
└── README.md
```

---

## 2. Configurar las Bases de Datos

### 2.1 Crear los usuarios de MySQL

Conéctate a MySQL como root:

```bash
mysql -u root -p
```

Ejecuta los siguientes comandos SQL:

```sql
-- Crear usuario para la BD central
CREATE USER 'drsimi_central'@'localhost' IDENTIFIED BY 'CentralPass123!';
CREATE DATABASE db_central CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON db_central.* TO 'drsimi_central'@'localhost';

-- Crear usuario para la BD local (sucursal 1)
CREATE USER 'drsimi_local'@'localhost' IDENTIFIED BY 'LocalPass123!';
CREATE DATABASE db_local_sucursal1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON db_local_sucursal1.* TO 'drsimi_local'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

### 2.2 Crear el esquema de la BD central

```bash
mysql -u drsimi_central -p db_central < database/central_schema.sql
```

### 2.3 Crear el esquema de la BD local

```bash
mysql -u drsimi_local -p db_local_sucursal1 < database/local_schema.sql
```

### 2.4 Cargar datos de prueba (opcional pero recomendado)

```bash
mysql -u drsimi_central -p db_central < database/seed_data.sql
```

### 2.5 Verificar las bases de datos

```bash
mysql -u drsimi_central -p -e "USE db_central; SHOW TABLES;"
mysql -u drsimi_local -p -e "USE db_local_sucursal1; SHOW TABLES;"
```

Deberías ver las tablas de cada base de datos.

---

## 3. Configurar el Backend

### 3.1 Instalar dependencias

```bash
cd backend
npm install
```

### 3.2 Configurar variables de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus valores:

```bash
nano .env  # o usa tu editor preferido
```

Contenido mínimo requerido:

```env
# ── SERVIDOR ──────────────────────────────────────
PORT=3000
NODE_ENV=development

# ── BASE DE DATOS CENTRAL ─────────────────────────
DB_CENTRAL_HOST=localhost
DB_CENTRAL_PORT=3306
DB_CENTRAL_NAME=db_central
DB_CENTRAL_USER=drsimi_central
DB_CENTRAL_PASSWORD=CentralPass123!

# ── BASE DE DATOS LOCAL (SUCURSAL) ────────────────
DB_LOCAL_HOST=localhost
DB_LOCAL_PORT=3306
DB_LOCAL_NAME=db_local_sucursal1
DB_LOCAL_USER=drsimi_local
DB_LOCAL_PASSWORD=LocalPass123!

# ── JWT ───────────────────────────────────────────
JWT_SECRET=cambia_esto_por_una_clave_muy_segura_en_produccion
JWT_EXPIRES_IN=8h

# ── SINCRONIZACIÓN ────────────────────────────────
SYNC_INTERVAL_MS=30000
SUCURSAL_ID=1
CENTRAL_API_URL=http://localhost:3000
SYNC_SERVICE_TOKEN=token_secreto_del_servicio_sync
```

> ⚠️ **Nunca comitas el archivo `.env` al repositorio.** Está incluido en `.gitignore`.

### 3.3 Verificar la conexión a la base de datos

```bash
npm run db:check
```

Salida esperada:
```
✅ Conexión a DB_CENTRAL exitosa
✅ Conexión a DB_LOCAL exitosa
```

---

## 4. Configurar el Frontend

### 4.1 Instalar dependencias

```bash
cd ../frontend
npm install
```

### 4.2 Configurar variables de entorno del frontend

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Dr. Simi
VITE_SUCURSAL_NOMBRE=Sucursal Central
```

---

## 5. Iniciar el Sistema

Necesitarás **3 terminales** abiertas:

### Terminal 1 — Backend API

```bash
cd backend
npm run dev     # Modo desarrollo con hot-reload (nodemon)
# o
npm start       # Modo producción
```

Salida esperada:
```
🚀 Servidor iniciado en http://localhost:3000
✅ DB Central conectada
✅ DB Local (sucursal1) conectada
📋 Entorno: development
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Salida esperada:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### Terminal 3 — Daemon de Sincronización

```bash
cd backend
npm run daemon
```

Salida esperada:
```
🔄 Daemon de sincronización iniciado
⏱️  Intervalo: cada 30 segundos
🔗 Central API: http://localhost:3000
💊 Sucursal ID: 1
```

---

## 6. Verificar la Instalación

### 6.1 Verificar el backend (healthcheck)

```bash
curl http://localhost:3000/api/v1/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "db_central": "connected",
  "db_local": "connected",
  "version": "1.0.0"
}
```

### 6.2 Verificar el frontend

Abre el navegador en `http://localhost:5173`.

Deberías ver la pantalla de inicio de sesión de Dr. Simi.

### 6.3 Probar el inicio de sesión

Usa las credenciales del seed data:
- **Email:** `admin@drsimi.com`
- **Contraseña:** `Admin123!`

### 6.4 Verificar el daemon

```bash
curl http://localhost:3000/api/v1/sync/status
```

Respuesta esperada:
```json
{
  "daemon_running": true,
  "last_sync": "2024-01-15T10:29:30.000Z",
  "pending_changes": 0,
  "status": "idle"
}
```

---

## Instalación con Docker (Opcional)

Si tienes Docker y Docker Compose instalados, puedes iniciar todo el sistema con un solo comando:

```bash
# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores
nano .env

# Construir e iniciar todos los contenedores
docker-compose up --build

# O en modo background (detached)
docker-compose up --build -d
```

Servicios definidos en `docker-compose.yml`:

| Servicio | Puerto | Descripción |
|---|---|---|
| `mysql-central` | 3306 | Base de datos central |
| `mysql-local` | 3307 | Base de datos local (sucursal demo) |
| `backend` | 3000 | API REST |
| `frontend` | 5173 | Aplicación React |
| `sync-daemon` | — | Daemon de sincronización |

```bash
# Ver logs de un servicio específico
docker-compose logs -f backend

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (elimina datos de BD)
docker-compose down -v
```

Ver guía completa de despliegue en [`despliegue.md`](despliegue.md).

---

## Solución de Problemas

### Error: `ECONNREFUSED 127.0.0.1:3306`

**Causa:** MySQL no está corriendo.

```bash
# Linux/macOS
sudo systemctl start mysql
# o
brew services start mysql

# Windows
net start MySQL80
```

### Error: `Access denied for user`

**Causa:** Credenciales incorrectas en `.env`.

Verifica que el usuario y contraseña en `.env` coincidan con los que creaste en MySQL:

```bash
mysql -u drsimi_central -p db_central -e "SELECT 1;"
```

### Error: `Table 'db_central.xxx' doesn't exist`

**Causa:** Los scripts SQL no se ejecutaron correctamente.

```bash
mysql -u drsimi_central -p db_central < database/central_schema.sql
```

### El frontend no puede conectarse al backend

**Causa:** `VITE_API_BASE_URL` incorrecto o el backend no está corriendo.

1. Verifica que el backend esté corriendo: `curl http://localhost:3000/api/v1/health`
2. Verifica `frontend/.env.local`: `VITE_API_BASE_URL=http://localhost:3000/api/v1`

### Puerto 3000 o 5173 ya en uso

```bash
# Encontrar el proceso que usa el puerto (Linux/macOS)
lsof -i :3000

# Windows
netstat -ano | findstr :3000

# Cambiar el puerto en .env
PORT=3001
```

### El daemon falla con `401 Unauthorized`

**Causa:** El token de sincronización no coincide.

Verifica que `SYNC_SERVICE_TOKEN` sea el mismo en el `.env` del backend y del daemon.
