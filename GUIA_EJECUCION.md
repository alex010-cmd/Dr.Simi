# 📋 GUÍA DE EJECUCIÓN DEL PROYECTO
## Sistema de Base de Datos Distribuida para Farmacia

Esta guía te llevará paso a paso para ejecutar y probar el proyecto completo.

---

## 📦 REQUISITOS PREVIOS

Antes de comenzar, asegúrate de tener instalado:

### 1. Node.js y npm
```bash
# Verificar instalación
node --version  # Debe ser v14 o superior
npm --version   # Debe ser v6 o superior
```

Si no lo tienes instalado, descárgalo de: https://nodejs.org/

### 2. MySQL 8.0
```bash
# Verificar instalación
mysql --version
```

**Instalación de MySQL en Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

**Instalación de MySQL en Windows:**
- Descargar de: https://dev.mysql.com/downloads/installer/
- Ejecutar el instalador y seguir los pasos
- Recordar la contraseña de root que configures

**Instalación de MySQL en macOS:**
```bash
brew install mysql
brew services start mysql
```

### 3. Git (opcional, si lo clonaste)
```bash
git --version
```

---

## 🚀 PASO 1: CONFIGURAR MYSQL

### 1.1 Acceder a MySQL
```bash
# En Linux/macOS
sudo mysql -u root -p

# En Windows (desde CMD o PowerShell)
mysql -u root -p
```
Ingresa la contraseña de root cuando te la pida.

### 1.2 Crear las bases de datos
Dentro de la consola de MySQL, ejecuta:

```sql
-- Crear base de datos central
CREATE DATABASE farmacia_central CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear base de datos local (simulando una sucursal)
CREATE DATABASE farmacia_local_sucursal1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario para la aplicación
CREATE USER 'farmacia_user'@'localhost' IDENTIFIED BY 'farmacia_password_2024';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON farmacia_central.* TO 'farmacia_user'@'localhost';
GRANT ALL PRIVILEGES ON farmacia_local_sucursal1.* TO 'farmacia_user'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar que se crearon
SHOW DATABASES;

-- Salir
EXIT;
```

### 1.3 Importar los esquemas SQL
```bash
# Navega a la carpeta del proyecto
cd "PROYECTO FINAL BASE DE DATOS DISTRIBUIDA"

# Importar esquema central
mysql -u farmacia_user -p farmacia_central < database/schema_central.sql

# Importar esquema local
mysql -u farmacia_user -p farmacia_local_sucursal1 < database/schema_local.sql
```
Cuando te pida la contraseña, ingresa: `farmacia_password_2024`

### 1.4 Verificar que se importaron correctamente
```bash
mysql -u farmacia_user -p farmacia_central -e "SHOW TABLES;"
mysql -u farmacia_user -p farmacia_local_sucursal1 -e "SHOW TABLES;"
```

---

## 🔧 PASO 2: CONFIGURAR EL BACKEND

### 2.1 Navegar a la carpeta del backend
```bash
cd backend
```

### 2.2 Crear archivo de configuración .env
```bash
# En Linux/macOS
cp .env.example .env

# En Windows
copy .env.example .env
```

### 2.3 Editar el archivo .env
Abre el archivo `.env` con tu editor de texto favorito y configura:

```env
# Puerto del servidor
PORT=5000

# Base de datos CENTRAL
DB_CENTRAL_HOST=localhost
DB_CENTRAL_PORT=3306
DB_CENTRAL_NAME=farmacia_central
DB_CENTRAL_USER=farmacia_user
DB_CENTRAL_PASSWORD=farmacia_password_2024

# Base de datos LOCAL (Sucursal)
DB_LOCAL_HOST=localhost
DB_LOCAL_PORT=3306
DB_LOCAL_NAME=farmacia_local_sucursal1
DB_LOCAL_USER=farmacia_user
DB_LOCAL_PASSWORD=farmacia_password_2024

# JWT Secret (clave secreta para tokens)
JWT_SECRET=mi_clave_super_secreta_para_jwt_2024
JWT_EXPIRES_IN=24h

# Entorno
NODE_ENV=development

# ID de la sucursal local
SUCURSAL_ID=1
```

### 2.4 Instalar dependencias (si no lo hiciste antes)
```bash
npm install
```

### 2.5 Iniciar el servidor backend
```bash
npm start
```

Deberías ver un mensaje como:
```
✓ Servidor corriendo en puerto 5000
✓ Base de datos CENTRAL conectada
✓ Base de datos LOCAL conectada
```

**NO CIERRES ESTA TERMINAL**, déjala ejecutándose.

---

## 🎨 PASO 3: CONFIGURAR EL FRONTEND

### 3.1 Abrir una NUEVA terminal
Deja la terminal del backend ejecutándose y abre otra terminal.

### 3.2 Navegar a la carpeta del frontend
```bash
cd "PROYECTO FINAL BASE DE DATOS DISTRIBUIDA/frontend"
```

### 3.3 Instalar dependencias (si no lo hiciste antes)
```bash
npm install
```

### 3.4 Iniciar el servidor de desarrollo
```bash
npm run dev
```

Deberías ver un mensaje como:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🔄 PASO 4: INICIAR EL DAEMON DE SINCRONIZACIÓN (OPCIONAL)

### 4.1 Abrir una TERCERA terminal
```bash
cd "PROYECTO FINAL BASE DE DATOS DISTRIBUIDA/scripts"
```

### 4.2 Ejecutar el daemon de sincronización
```bash
node sync_daemon.js
```

Deberías ver mensajes cada 5 minutos indicando la sincronización:
```
[SYNC] Iniciando sincronización...
[SYNC] ✓ Sincronización completada
```

---

## 🧪 PASO 5: PROBAR EL SISTEMA

### 5.1 Acceder a la aplicación web
Abre tu navegador y ve a: **http://localhost:5173/**

### 5.2 Iniciar sesión
Usa las credenciales de un empleado de ejemplo:

**Usuario administrador:**
- Email: `admin@farmacia.com`
- Contraseña: `admin123`

**Usuario gerente:**
- Email: `gerente1@farmacia.com`
- Contraseña: `gerente123`

**Usuario empleado:**
- Email: `empleado1@farmacia.com`
- Contraseña: `empleado123`

### 5.3 Probar funcionalidades básicas

#### A) Dashboard
Después de iniciar sesión, verás el dashboard principal con:
- Resumen de estadísticas
- Acceso rápido a módulos

#### B) Probar la API desde la terminal o Postman

**1. Login (obtener token JWT):**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@farmacia.com","password":"admin123"}'
```

Copia el `token` que te devuelve.

**2. Listar productos (requiere token):**
```bash
curl -X GET http://localhost:5000/api/productos \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**3. Consultar inventario:**
```bash
curl -X GET http://localhost:5000/api/inventario \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**4. Crear una venta:**
```bash
curl -X POST http://localhost:5000/api/ventas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "cliente_id": 1,
    "empleado_id": 1,
    "items": [
      {
        "producto_id": 1,
        "cantidad": 2,
        "precio_unitario": 15.50
      }
    ],
    "metodo_pago": "efectivo"
  }'
```

---

## 🗄️ PASO 6: VERIFICAR LOS DATOS EN MYSQL

### 6.1 Acceder a MySQL
```bash
mysql -u farmacia_user -p farmacia_central
```

### 6.2 Consultar datos de ejemplo
```sql
-- Ver productos
SELECT * FROM productos LIMIT 10;

-- Ver clientes
SELECT * FROM clientes LIMIT 10;

-- Ver empleados
SELECT * FROM empleados LIMIT 5;

-- Salir
EXIT;
```

### 6.3 Verificar base de datos local
```bash
mysql -u farmacia_user -p farmacia_local_sucursal1
```

```sql
-- Ver inventario
SELECT * FROM inventario LIMIT 10;

-- Ver ventas
SELECT * FROM ventas;

-- Ver productos en caché local
SELECT * FROM cache_productos LIMIT 10;

-- Salir
EXIT;
```

---

## 📊 PASO 7: VERIFICAR LA SINCRONIZACIÓN

### 7.1 Ver logs de sincronización
```bash
mysql -u farmacia_user -p farmacia_central
```

```sql
USE farmacia_central;

-- Ver logs recientes de sincronización
SELECT * FROM logs_sincronizacion 
ORDER BY fecha_hora DESC 
LIMIT 10;

EXIT;
```

### 7.2 Forzar una sincronización manual
Si tienes el daemon ejecutándose, espera 5 minutos y verás la sincronización automática.

O detén el daemon (Ctrl+C) y ejecútalo nuevamente para forzar una sincronización inmediata.

---

## 🎯 PASO 8: CASOS DE PRUEBA COMPLETOS

### Caso 1: Registrar una venta completa

**A) Desde la interfaz web:**
1. Inicia sesión con: `empleado1@farmacia.com` / `empleado123`
2. Navega a la sección "Ventas" (cuando esté implementada)
3. Selecciona un cliente
4. Agrega productos al carrito
5. Procesa la venta
6. Verifica que el inventario se actualizó

**B) Desde la API (Postman/cURL):**
```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"empleado1@farmacia.com","password":"empleado123"}'

# 2. Crear venta (usa el token del paso 1)
curl -X POST http://localhost:5000/api/ventas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "cliente_id": 1,
    "empleado_id": 2,
    "items": [
      {"producto_id": 1, "cantidad": 3, "precio_unitario": 15.50},
      {"producto_id": 2, "cantidad": 1, "precio_unitario": 25.00}
    ],
    "metodo_pago": "tarjeta"
  }'

# 3. Verificar el inventario se actualizó
curl -X GET http://localhost:5000/api/inventario \
  -H "Authorization: Bearer TU_TOKEN"
```

### Caso 2: Verificar sincronización de datos

**A) Modificar datos en la base central:**
```sql
mysql -u farmacia_user -p farmacia_central

UPDATE productos 
SET precio = 99.99 
WHERE id = 1;

EXIT;
```

**B) Esperar sincronización (5 minutos) o forzarla:**
- El daemon sincronizará automáticamente
- Los cambios se reflejarán en `cache_productos` de la base local

**C) Verificar en base local:**
```sql
mysql -u farmacia_user -p farmacia_local_sucursal1

SELECT * FROM cache_productos WHERE id = 1;

EXIT;
```

### Caso 3: Probar roles y permisos

**A) Como EMPLEADO (permisos limitados):**
```bash
# Login como empleado
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"empleado1@farmacia.com","password":"empleado123"}'

# Intentar acceder a reportes (debería fallar)
curl -X GET http://localhost:5000/api/reportes \
  -H "Authorization: Bearer TOKEN_EMPLEADO"
```

**B) Como ADMIN (todos los permisos):**
```bash
# Login como admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@farmacia.com","password":"admin123"}'

# Acceder a reportes (debería funcionar)
curl -X GET http://localhost:5000/api/reportes \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Marca cada punto cuando lo completes:

### Configuración inicial:
- [ ] MySQL instalado y ejecutándose
- [ ] Bases de datos creadas (farmacia_central y farmacia_local_sucursal1)
- [ ] Usuario de MySQL creado con permisos
- [ ] Esquemas SQL importados correctamente
- [ ] Dependencias de backend instaladas
- [ ] Dependencias de frontend instaladas
- [ ] Archivo .env configurado

### Ejecución:
- [ ] Backend ejecutándose en puerto 5000
- [ ] Frontend ejecutándose en puerto 5173
- [ ] Daemon de sincronización funcionando
- [ ] Login exitoso en la interfaz web
- [ ] Login exitoso mediante API

### Pruebas funcionales:
- [ ] Consultar productos desde API
- [ ] Consultar inventario desde API
- [ ] Crear una venta mediante API
- [ ] Verificar actualización de inventario después de venta
- [ ] Ver logs de sincronización en MySQL
- [ ] Verificar datos en cache_productos
- [ ] Probar diferentes roles (admin, gerente, empleado)

---

## 🐛 SOLUCIÓN DE PROBLEMAS COMUNES

### Problema 1: "Cannot connect to MySQL"
**Solución:**
```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Si no está corriendo, iniciarlo
sudo systemctl start mysql

# Verificar credenciales en .env
cat backend/.env
```

### Problema 2: "Port 5000 already in use"
**Solución:**
```bash
# Cambiar el puerto en backend/.env
PORT=5001

# O matar el proceso que usa el puerto
lsof -ti:5000 | xargs kill -9
```

### Problema 3: "JWT token invalid"
**Solución:**
- Asegúrate de copiar el token completo del login
- Verifica que JWT_SECRET sea el mismo en .env
- El token expira en 24h, haz login nuevamente

### Problema 4: "Tables don't exist"
**Solución:**
```bash
# Re-importar los esquemas
mysql -u farmacia_user -p farmacia_central < database/schema_central.sql
mysql -u farmacia_user -p farmacia_local_sucursal1 < database/schema_local.sql
```

### Problema 5: Frontend no carga
**Solución:**
```bash
# Limpiar caché y reinstalar
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📞 INFORMACIÓN DE CONTACTO Y RECURSOS

### Documentación del proyecto:
- `README.md` - Descripción general
- `docs/INSTALACION.md` - Guía de instalación detallada
- `docs/ARQUITECTURA.md` - Arquitectura del sistema
- `docs/diagramas/DIAGRAMA_ER.md` - Diagrama entidad-relación

### Endpoints de la API:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

### Credenciales de prueba:
| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@farmacia.com | admin123 |
| Gerente | gerente1@farmacia.com | gerente123 |
| Empleado | empleado1@farmacia.com | empleado123 |

---

## 🎓 CUMPLIMIENTO DE REQUISITOS DEL PROYECTO

### ✅ Requisitos técnicos implementados:

1. **Base de Datos Distribuida:**
   - ✅ Dos bases de datos (central y local)
   - ✅ Fragmentación horizontal (ventas e inventario por sucursal)
   - ✅ Sincronización bidireccional automática
   - ✅ Replicación de datos maestros (productos, clientes)

2. **Normalización:**
   - ✅ Esquema normalizado hasta BCNF
   - ✅ Sin redundancia de datos
   - ✅ Integridad referencial con foreign keys

3. **Seguridad:**
   - ✅ Autenticación con JWT
   - ✅ Encriptación de contraseñas con bcrypt
   - ✅ Autorización por roles y permisos
   - ✅ Protección contra SQL injection (Sequelize ORM)
   - ✅ Helmet para headers seguros
   - ✅ CORS configurado
   - ✅ Rate limiting

4. **Tecnologías especificadas:**
   - ✅ Frontend: React + Vite + Tailwind CSS
   - ✅ Backend: Node.js + Express.js
   - ✅ Base de Datos: MySQL 8.0
   - ✅ ORM: Sequelize

5. **Funcionalidades:**
   - ✅ Gestión de productos, clientes, empleados
   - ✅ Control de inventario distribuido
   - ✅ Registro de ventas
   - ✅ Sincronización automática
   - ✅ Logs de auditoría
   - ✅ Triggers para actualización automática
   - ✅ Vistas para consultas comunes

---

## 🚀 PRÓXIMOS PASOS SUGERIDOS

Después de probar el sistema base, puedes extenderlo con:

1. **Más páginas del frontend:**
   - Gestión completa de ventas con gráficos
   - Administración de inventario
   - Reportes y estadísticas
   - Gestión de clientes y proveedores

2. **Funcionalidades adicionales:**
   - Dashboard con gráficos en tiempo real
   - Alertas de productos bajo stock
   - Notificaciones de productos próximos a vencer
   - Exportación de reportes a PDF/Excel

3. **Mejoras técnicas:**
   - Pruebas unitarias y de integración
   - Docker para despliegue
   - CI/CD pipeline
   - Monitoreo y logs avanzados

---

**¡Listo! Ahora tienes todo lo necesario para ejecutar y probar el proyecto completo.**

Si tienes algún problema, revisa la sección de solución de problemas o consulta la documentación en la carpeta `docs/`.
