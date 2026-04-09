# 📘 Guía de Instalación

Sistema de Base de Datos Distribuida para Farmacia

---

## 📋 Requisitos Previos

Antes de comenzar la instalación, asegúrese de tener instalado:

### Software Requerido

- **Node.js** 18.x o superior
  - Descarga: https://nodejs.org/
  - Verificar: `node --version`

- **npm** 9.x o superior (incluido con Node.js)
  - Verificar: `npm --version`

- **MySQL** 8.0 o superior
  - Descarga: https://dev.mysql.com/downloads/mysql/
  - Verificar: `mysql --version`

- **Git** (opcional, para clonar el repositorio)
  - Descarga: https://git-scm.com/
  - Verificar: `git --version`

### Recursos del Sistema

- **RAM**: Mínimo 4 GB (Recomendado 8 GB)
- **Espacio en Disco**: Mínimo 2 GB libres
- **Sistema Operativo**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 20.04+)

---

## 🗄️ Paso 1: Instalación de MySQL

### Windows

1. Descargar MySQL Installer desde https://dev.mysql.com/downloads/installer/
2. Ejecutar el instalador y seleccionar "Developer Default"
3. Configurar contraseña para el usuario `root`
4. Completar la instalación

### macOS

```bash
# Usando Homebrew
brew install mysql
brew services start mysql
mysql_secure_installation
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

---

## 💾 Paso 2: Crear Bases de Datos

### 2.1 Acceder a MySQL

```bash
mysql -u root -p
# Ingresar contraseña de root
```

### 2.2 Crear Usuario para la Aplicación

```sql
-- Crear usuario
CREATE USER 'farmacia_user'@'localhost' IDENTIFIED BY 'Farmacia2026!';

-- Otorgar privilegios
GRANT ALL PRIVILEGES ON farmacia_central.* TO 'farmacia_user'@'localhost';
GRANT ALL PRIVILEGES ON farmacia_suc001.* TO 'farmacia_user'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

### 2.3 Importar Schemas

```bash
# Desde la raíz del proyecto

# Importar schema central
mysql -u farmacia_user -p < database/schema_central.sql

# Importar schema local (sucursal)
mysql -u farmacia_user -p < database/schema_local.sql
```

### 2.4 Verificar Creación

```bash
mysql -u farmacia_user -p

SHOW DATABASES;
# Debería mostrar: farmacia_central y farmacia_suc001

USE farmacia_central;
SHOW TABLES;

USE farmacia_suc001;
SHOW TABLES;

EXIT;
```

---

## 🔧 Paso 3: Configuración del Backend

### 3.1 Navegar a la Carpeta del Backend

```bash
cd "PROYECTO FINAL BASE DE DATOS DISTRIBUIDA/backend"
```

### 3.2 Instalar Dependencias

```bash
npm install
```

Este proceso puede tardar 2-5 minutos dependiendo de tu conexión a Internet.

### 3.3 Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar archivo .env
# Windows: notepad .env
# macOS/Linux: nano .env
```

Configurar las siguientes variables:

```bash
# Base de Datos Central
DB_CENTRAL_HOST=localhost
DB_CENTRAL_PORT=3306
DB_CENTRAL_NAME=farmacia_central
DB_CENTRAL_USER=farmacia_user
DB_CENTRAL_PASSWORD=Farmacia2026!

# Base de Datos Local
DB_LOCAL_HOST=localhost
DB_LOCAL_PORT=3306
DB_LOCAL_NAME=farmacia_suc001
DB_LOCAL_USER=farmacia_user
DB_LOCAL_PASSWORD=Farmacia2026!

# JWT Secret (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET=mi_clave_secreta_super_segura_12345
JWT_EXPIRES_IN=8h

# Configuración de Sucursal
SUCURSAL_ID=1
SUCURSAL_CODIGO=SUC001
```

### 3.4 Crear Contraseña para Usuario de Prueba

```bash
# Ejecutar Node.js para generar hash de contraseña
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password123', 10).then(hash => console.log(hash));"
```

Copiar el hash generado y ejecutar en MySQL:

```sql
USE farmacia_central;

UPDATE empleados 
SET password_hash = 'HASH_GENERADO_AQUI' 
WHERE usuario = 'jperez';
```

### 3.5 Verificar Instalación del Backend

```bash
npm run dev
```

Deberías ver:

```
✅ Conexión a BD Central establecida correctamente
✅ Conexión a BD Local establecida correctamente

🚀 SERVIDOR INICIADO CORRECTAMENTE
📡 Servidor escuchando en: http://localhost:3000
```

Presiona `Ctrl+C` para detener el servidor.

---

## 🎨 Paso 4: Configuración del Frontend

### 4.1 Abrir Nueva Terminal y Navegar al Frontend

```bash
# Desde la raíz del proyecto
cd "PROYECTO FINAL BASE DE DATOS DISTRIBUIDA/frontend"
```

### 4.2 Instalar Dependencias

```bash
npm install
```

### 4.3 Verificar Instalación del Frontend

```bash
npm run dev
```

Deberías ver:

```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Abre tu navegador en http://localhost:5173

---

## 🔄 Paso 5: Configurar Daemon de Sincronización

### 5.1 Navegar a Scripts

```bash
cd "PROYECTO FINAL BASE DE DATOS DISTRIBUIDA/scripts"
```

### 5.2 Instalar Dependencias (si es necesario)

```bash
npm install node-cron
```

### 5.3 Ejecutar Daemon

```bash
node sync_daemon.js
```

Deberías ver:

```
🔄 DAEMON DE SINCRONIZACIÓN - SISTEMA DE FARMACIA DISTRIBUIDA
⏰ Intervalo de sincronización: cada 5 minutos
🏢 Sucursal ID: 1
```

---

## ✅ Paso 6: Verificar la Instalación Completa

### 6.1 Verificar Servicios Activos

Deberías tener **3 terminales abiertas**:

1. **Terminal 1 - Backend**: `npm run dev` en carpeta `backend/`
2. **Terminal 2 - Frontend**: `npm run dev` en carpeta `frontend/`
3. **Terminal 3 - Sincronización**: `node sync_daemon.js` en carpeta `scripts/`

### 6.2 Probar el Sistema

1. Abrir navegador en http://localhost:5173
2. Iniciar sesión con:
   - **Usuario**: `jperez`
   - **Contraseña**: `password123` (la que configuraste)
3. Deberías ver el Dashboard

### 6.3 Verificar API Backend

Abrir en navegador: http://localhost:3000/health

Deberías ver:

```json
{
  "success": true,
  "status": "OK",
  "timestamp": "2026-04-05T..."
}
```

---

## 🐛 Solución de Problemas

### Problema: Error de conexión a MySQL

**Síntoma**: `Error: ER_ACCESS_DENIED_ERROR: Access denied for user`

**Solución**:
```bash
# Verificar credenciales en .env
# Asegurarse que el usuario tenga permisos
mysql -u farmacia_user -p
```

### Problema: Puerto 3000 o 5173 en uso

**Síntoma**: `Error: listen EADDRINUSE: address already in use`

**Solución**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Problema: Módulos de Node no encontrados

**Síntoma**: `Error: Cannot find module`

**Solución**:
```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Problema: Error de CORS en Frontend

**Síntoma**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solución**:
- Verificar que `CORS_ORIGIN` en `.env` sea `http://localhost:5173`
- Reiniciar el servidor backend

---

## 🚀 Paso 7: Iniciar en Producción

### 7.1 Configurar Variables de Producción

```bash
# En backend/.env
NODE_ENV=production
```

### 7.2 Construir Frontend

```bash
cd frontend
npm run build
```

### 7.3 Iniciar Backend en Producción

```bash
cd backend
npm start
```

### 7.4 Servir Frontend con NGINX o Apache

Configurar servidor web para servir archivos de `frontend/dist/`

---

## 📞 Soporte

Si encuentras problemas durante la instalación:

1. Verifica que todos los requisitos previos estén instalados
2. Revisa los logs de error en las terminales
3. Consulta la sección de Solución de Problemas
4. Revisa la documentación en `docs/MANUAL_TECNICO.md`

---

## ✨ Siguientes Pasos

Una vez instalado correctamente:

1. Lee el [Manual de Usuario](MANUAL_USUARIO.md)
2. Revisa la [Arquitectura del Sistema](ARQUITECTURA.md)
3. Explora el [Manual Técnico](MANUAL_TECNICO.md)

---

**¡Felicidades!** 🎉 El sistema está instalado y listo para usar.
