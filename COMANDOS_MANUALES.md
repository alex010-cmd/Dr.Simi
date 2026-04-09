## 🚀 COMANDOS PARA EJECUTAR MANUALMENTE

Como necesitas permisos de sudo para MariaDB, ejecuta estos comandos **UNO POR UNO** en tu terminal:

### PASO 1: Configurar MariaDB (ejecuta en tu terminal)

```bash
cd "PROYECTO FINAL BASE DE DATOS DISTRIBUIDA"

sudo mariadb << 'EOF'
CREATE DATABASE IF NOT EXISTS farmacia_central CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS farmacia_local_sucursal1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'farmacia_user'@'localhost' IDENTIFIED BY 'farmacia_password_2024';
GRANT ALL PRIVILEGES ON farmacia_central.* TO 'farmacia_user'@'localhost';
GRANT ALL PRIVILEGES ON farmacia_local_sucursal1.* TO 'farmacia_user'@'localhost';
FLUSH PRIVILEGES;
SHOW DATABASES;
EOF
```

### PASO 2: Importar esquemas SQL

```bash
# Importar schema central
mariadb -u farmacia_user -pfarmacia_password_2024 farmacia_central < database/schema_central.sql

# Importar schema local
mariadb -u farmacia_user -pfarmacia_password_2024 farmacia_local_sucursal1 < database/schema_local.sql
```

### PASO 3: Verificar que se importaron correctamente

```bash
# Verificar tablas en base central
mariadb -u farmacia_user -pfarmacia_password_2024 farmacia_central -e "SHOW TABLES;"

# Verificar tablas en base local
mariadb -u farmacia_user -pfarmacia_password_2024 farmacia_local_sucursal1 -e "SHOW TABLES;"
```

### PASO 4: Iniciar Backend (en una terminal)

```bash
cd "PROYECTO FINAL BASE DE DATOS DISTRIBUIDA/backend"
npm start
```

Deberías ver:
```
✓ Servidor corriendo en puerto 5000
✓ Base de datos CENTRAL conectada
✓ Base de datos LOCAL conectada
```

**DEJA ESTA TERMINAL ABIERTA**

### PASO 5: Iniciar Frontend (en OTRA terminal nueva)

```bash
cd "PROYECTO FINAL BASE DE DATOS DISTRIBUIDA/frontend"
npm run dev
```

Deberías ver:
```
➜  Local:   http://localhost:5173/
```

**DEJA ESTA TERMINAL ABIERTA TAMBIÉN**

### PASO 6: Probar la aplicación

1. Abre tu navegador: **http://localhost:5173/**
2. Inicia sesión con: `admin@farmacia.com` / `admin123`
3. ¡Listo!

---

## ✅ Estado actual:

- [x] Dependencias instaladas (backend y frontend)
- [x] Archivo .env configurado
- [ ] Bases de datos creadas (ejecuta PASO 1)
- [ ] Esquemas importados (ejecuta PASO 2)
- [ ] Backend ejecutándose (ejecuta PASO 4)
- [ ] Frontend ejecutándose (ejecuta PASO 5)

---

## 🐛 Si tienes problemas:

**Error: "Access denied for user"**
```bash
# Verifica que el usuario existe
sudo mariadb -e "SELECT User, Host FROM mysql.user WHERE User='farmacia_user';"
```

**Error: "Database not found"**
```bash
# Verifica que las bases existen
sudo mariadb -e "SHOW DATABASES;"
```

**Backend no conecta a MariaDB**
```bash
# Verifica que MariaDB está corriendo
systemctl status mariadb
```

---

## 📞 Resumen de credenciales:

**MariaDB:**
- Usuario: `farmacia_user`
- Contraseña: `farmacia_password_2024`
- Base Central: `farmacia_central`
- Base Local: `farmacia_local_sucursal1`

**Aplicación Web:**
- Admin: `admin@farmacia.com` / `admin123`
- Gerente: `gerente1@farmacia.com` / `gerente123`
- Empleado: `empleado1@farmacia.com` / `empleado123`

**Puertos:**
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`
