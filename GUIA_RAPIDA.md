# 🎯 GUÍA RÁPIDA DE 5 MINUTOS
## Para Revisar el Proyecto Inmediatamente

Si tienes prisa y quieres ver el proyecto funcionando YA, sigue estos pasos:

---

## ⚡ OPCIÓN 1: REVISIÓN SIN EJECUTAR (Más rápido - 2 minutos)

### 1. Ver la estructura del proyecto
```bash
cd "PROYECTO FINAL BASE DE DATOS DISTRIBUIDA"
ls -la
```

### 2. Revisar archivos clave en este orden:

**A) Documentación principal:**
```bash
# Leer descripción general
cat README.md

# Ver arquitectura
cat docs/ARQUITECTURA.md

# Ver diagrama de base de datos
cat docs/diagramas/DIAGRAMA_ER.md
```

**B) Revisar código del backend:**
```bash
# Ver estructura de modelos
ls backend/models/central/
ls backend/models/local/

# Ver controladores
cat backend/controllers/authController.js
cat backend/controllers/ventasController.js

# Ver middleware de seguridad
cat backend/middleware/auth.js
cat backend/middleware/authorization.js
```

**C) Revisar código del frontend:**
```bash
# Ver páginas
cat frontend/src/pages/Login.jsx
cat frontend/src/pages/Dashboard.jsx

# Ver servicios
cat frontend/src/services/api.js
cat frontend/src/context/AuthContext.jsx
```

**D) Revisar bases de datos:**
```bash
# Ver esquema central
cat database/schema_central.sql | less

# Ver esquema local
cat database/schema_local.sql | less
```

**E) Revisar scripts de sincronización:**
```bash
cat scripts/sync_daemon.js
```

---

## ⚡ OPCIÓN 2: EJECUCIÓN COMPLETA (Recomendado - 15 minutos)

### Requisito previo: Tener MySQL instalado y corriendo

### Paso 1: Configurar MySQL (3 minutos)
```bash
# Acceder a MySQL
mysql -u root -p

# Copiar y pegar estos comandos:
CREATE DATABASE farmacia_central CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE farmacia_local_sucursal1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'farmacia_user'@'localhost' IDENTIFIED BY 'farmacia_password_2024';
GRANT ALL PRIVILEGES ON farmacia_central.* TO 'farmacia_user'@'localhost';
GRANT ALL PRIVILEGES ON farmacia_local_sucursal1.* TO 'farmacia_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# Importar esquemas
cd "PROYECTO FINAL BASE DE DATOS DISTRIBUIDA"
mysql -u farmacia_user -pfarmacia_password_2024 farmacia_central < database/schema_central.sql
mysql -u farmacia_user -pfarmacia_password_2024 farmacia_local_sucursal1 < database/schema_local.sql
```

### Paso 2: Configurar Backend (2 minutos)
```bash
cd backend

# Crear archivo .env
cat > .env << 'EOF'
PORT=5000
DB_CENTRAL_HOST=localhost
DB_CENTRAL_PORT=3306
DB_CENTRAL_NAME=farmacia_central
DB_CENTRAL_USER=farmacia_user
DB_CENTRAL_PASSWORD=farmacia_password_2024
DB_LOCAL_HOST=localhost
DB_LOCAL_PORT=3306
DB_LOCAL_NAME=farmacia_local_sucursal1
DB_LOCAL_USER=farmacia_user
DB_LOCAL_PASSWORD=farmacia_password_2024
JWT_SECRET=mi_clave_super_secreta_para_jwt_2024
JWT_EXPIRES_IN=24h
NODE_ENV=development
SUCURSAL_ID=1
EOF

# Instalar y ejecutar
npm install
npm start
```

### Paso 3: Ejecutar Frontend (1 minuto)
**En OTRA terminal:**
```bash
cd "PROYECTO FINAL BASE DE DATOS DISTRIBUIDA/frontend"
npm install
npm run dev
```

### Paso 4: Probar (2 minutos)
1. Abre: http://localhost:5173/
2. Login: `admin@farmacia.com` / `admin123`
3. Navega por el dashboard

### Paso 5: Probar API (2 minutos)
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@farmacia.com","password":"admin123"}'

# Copiar el token y usarlo aquí:
curl -X GET http://localhost:5000/api/productos \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# Crear una venta
curl -X POST http://localhost:5000/api/ventas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "cliente_id": 1,
    "empleado_id": 1,
    "items": [
      {"producto_id": 1, "cantidad": 2, "precio_unitario": 15.50}
    ],
    "metodo_pago": "efectivo"
  }'
```

---

## 📋 CHECKLIST DE REVISIÓN PARA CALIFICACIÓN

### Arquitectura y Diseño (25 puntos)
- [ ] Existe esquema de base de datos centralizada (`database/schema_central.sql`)
- [ ] Existe esquema de base de datos distribuida (`database/schema_local.sql`)
- [ ] Documentación de arquitectura (`docs/ARQUITECTURA.md`)
- [ ] Diagrama ER documentado (`docs/diagramas/DIAGRAMA_ER.md`)
- [ ] Explicación clara de fragmentación y distribución

### Normalización (15 puntos)
- [ ] Tablas en 1FN (valores atómicos)
- [ ] Tablas en 2FN (dependencias funcionales completas)
- [ ] Tablas en 3FN (sin dependencias transitivas)
- [ ] Explicación de normalización en documentación

### Sincronización (20 puntos)
- [ ] Script de sincronización (`scripts/sync_daemon.js`)
- [ ] Sincronización automática cada 5 minutos
- [ ] Logs de sincronización en base de datos
- [ ] Sincronización bidireccional (central ↔ local)
- [ ] Manejo de conflictos

### Backend (20 puntos)
- [ ] API REST con Express.js (`backend/app.js`, `backend/server.js`)
- [ ] Modelos con Sequelize (`backend/models/`)
- [ ] Controladores implementados (`backend/controllers/`)
- [ ] Rutas protegidas (`backend/routes/`)
- [ ] Middleware de autenticación JWT (`backend/middleware/auth.js`)
- [ ] Middleware de autorización por roles (`backend/middleware/authorization.js`)

### Seguridad (10 puntos)
- [ ] Autenticación JWT implementada
- [ ] Contraseñas encriptadas con bcrypt
- [ ] Protección contra SQL Injection (uso de ORM)
- [ ] CORS configurado
- [ ] Helmet para headers seguros
- [ ] Rate limiting

### Frontend (10 puntos)
- [ ] Interfaz React (`frontend/src/`)
- [ ] Diseño con Tailwind CSS
- [ ] Contexto de autenticación (`frontend/src/context/AuthContext.jsx`)
- [ ] Servicios API (`frontend/src/services/api.js`)
- [ ] Rutas protegidas
- [ ] Diseño responsivo

### Documentación (10 puntos)
- [ ] README.md completo
- [ ] Guía de instalación (`docs/INSTALACION.md`)
- [ ] Documentación de arquitectura (`docs/ARQUITECTURA.md`)
- [ ] Guía de ejecución (`GUIA_EJECUCION.md`)
- [ ] Código comentado

### Funcionalidad (Extra)
- [ ] Sistema de login funcional
- [ ] CRUD de ventas
- [ ] Consulta de inventario
- [ ] Gestión de productos
- [ ] Dashboard informativo

---

## 🎓 PUNTOS CLAVE A DESTACAR EN LA PRESENTACIÓN

### 1. Base de Datos Distribuida
"Implementamos una arquitectura híbrida con fragmentación horizontal por sucursal. Los datos transaccionales (ventas, inventario, compras) se almacenan localmente en cada sucursal, mientras que los datos maestros (productos, clientes, empleados) se centralizan."

### 2. Sincronización Automática
"Desarrollamos un daemon que ejecuta sincronización bidireccional cada 5 minutos: Pull (Central→Local) para datos maestros y Push (Local→Central) para transacciones, con registro completo de logs."

### 3. Seguridad Robusta
"Implementamos múltiples capas de seguridad: autenticación JWT, encriptación bcrypt, autorización por roles (Admin/Gerente/Empleado), protección contra SQL injection mediante ORM, y headers seguros con Helmet."

### 4. Normalización BCNF
"Todas las tablas están normalizadas hasta Boyce-Codd (BCNF), eliminando redundancias y garantizando integridad referencial con foreign keys y triggers."

### 5. Stack Tecnológico Profesional
"Utilizamos tecnologías modernas de producción: React con Vite y Tailwind CSS en frontend, Node.js con Express y Sequelize ORM en backend, y MySQL 8.0 para persistencia."

---

## 📞 SI TIENES PROBLEMAS

### Problema: "No tengo MySQL instalado"
**Solución rápida:** Revisa el código sin ejecutarlo (OPCIÓN 1)

### Problema: "No funciona el login"
**Verificar:**
1. Backend está corriendo en puerto 5000
2. Bases de datos creadas e importadas
3. Archivo .env configurado correctamente
4. Credenciales: `admin@farmacia.com` / `admin123`

### Problema: "Error de conexión a BD"
**Verificar:**
```bash
mysql -u farmacia_user -pfarmacia_password_2024 -e "SHOW DATABASES;"
```

### Problema: "Puerto en uso"
**Solución:**
```bash
# Cambiar puerto en backend/.env
PORT=5001
```

---

## ✅ VERIFICACIÓN FINAL - 30 SEGUNDOS

```bash
# Verificar que todo está en su lugar
cd "PROYECTO FINAL BASE DE DATOS DISTRIBUIDA"

# Contar archivos críticos
echo "Backend files:" && find backend -type f -name "*.js" | wc -l
echo "Frontend files:" && find frontend/src -type f -name "*.jsx" | wc -l
echo "SQL schemas:" && ls database/*.sql | wc -l
echo "Docs:" && ls docs/*.md | wc -l

# Verificar package.json
echo "Backend dependencies:" && grep '"express"' backend/package.json
echo "Frontend dependencies:" && grep '"react"' frontend/package.json
```

**Resultado esperado:**
- Backend files: ~15+ archivos .js
- Frontend files: ~5+ archivos .jsx
- SQL schemas: 2 archivos
- Docs: 3+ archivos .md
- Express y React instalados

---

**¡Listo para revisión y calificación!**

Para ver la guía completa y detallada, consulta: `GUIA_EJECUCION.md`
