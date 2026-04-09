# 🚢 Guía de Despliegue — Dr. Simi

## Tabla de Contenidos

- [Entornos](#entornos)
- [Despliegue Local (Desarrollo)](#despliegue-local-desarrollo)
- [Despliegue con Docker Compose](#despliegue-con-docker-compose)
- [Despliegue en Producción (VPS/Servidor)](#despliegue-en-producción-vpsservidor)
- [Configuración de Nginx](#configuración-de-nginx)
- [SSL/TLS con Let's Encrypt](#ssltls-con-lets-encrypt)
- [Gestión de Procesos con PM2](#gestión-de-procesos-con-pm2)
- [Despliegue Multi-Sucursal](#despliegue-multi-sucursal)
- [Backups y Recuperación](#backups-y-recuperación)
- [Actualizaciones](#actualizaciones)
- [Monitoreo en Producción](#monitoreo-en-producción)

---

## Entornos

| Entorno | Descripción | Configuración |
|---|---|---|
| **Development** | Máquina local del desarrollador | SQLite o MySQL local, logs en consola |
| **Staging** | Servidor de pruebas pre-producción | Configuración similar a producción, datos de prueba |
| **Production** | Servidor central en producción | MySQL dedicado, HTTPS, PM2, Nginx |

---

## Despliegue Local (Desarrollo)

Ver guía completa en [`instalacion.md`](instalacion.md).

```bash
# Backend
cd backend && npm run dev    # http://localhost:3000

# Frontend
cd frontend && npm run dev   # http://localhost:5173

# Daemon
cd backend && npm run daemon
```

---

## Despliegue con Docker Compose

### Prerrequisitos

- Docker Engine 24.0+
- Docker Compose 2.20+

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/alex010-cmd/Dr.Simi.git
cd Dr.Simi

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Editar ambos archivos con valores reales

# 3. Crear .env raíz para Docker Compose
cat > .env << 'EOF'
MYSQL_ROOT_PASSWORD=SuperSecureRootPass123!
DB_CENTRAL_PASSWORD=CentralPass123!
DB_LOCAL_PASSWORD=LocalPass123!
EOF

# 4. Construir e iniciar
docker-compose up --build -d

# 5. Verificar que todos los contenedores corren
docker-compose ps

# 6. Ver logs
docker-compose logs -f
```

### Comandos útiles de Docker Compose

```bash
# Reiniciar un servicio específico
docker-compose restart backend

# Ver logs de un servicio
docker-compose logs -f sync-daemon

# Escalar el backend (si hay load balancer)
docker-compose up -d --scale backend=3

# Detener todo (sin eliminar datos)
docker-compose stop

# Detener y eliminar contenedores (datos preservados en volúmenes)
docker-compose down

# Eliminar todo incluyendo volúmenes (¡elimina datos de BD!)
docker-compose down -v

# Actualizar imágenes y reiniciar
docker-compose pull && docker-compose up -d --build
```

### Dockerfiles

#### `backend/Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar dependencias primero (caché de Docker)
COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

CMD ["node", "src/app.js"]
```

#### `backend/Dockerfile.daemon`

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD ["node", "sync-daemon/daemon.js"]
```

#### `frontend/Dockerfile`

```dockerfile
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa de producción con Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Despliegue en Producción (VPS/Servidor)

### Infraestructura recomendada

#### Servidor Central

| Componente | Especificaciones mínimas | Recomendado |
|---|---|---|
| CPU | 2 vCPUs | 4 vCPUs |
| RAM | 4 GB | 8 GB |
| Disco | 50 GB SSD | 100 GB SSD |
| SO | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

#### Servidor de Sucursal

| Componente | Especificaciones mínimas | Notas |
|---|---|---|
| CPU | 2 vCPUs | Puede ser una PC de escritorio |
| RAM | 2 GB | |
| Disco | 20 GB | |
| SO | Ubuntu 22.04 o Windows 10+ | |
| Red | Conexión a internet estable | El daemon requiere conectividad al servidor central |

### Preparar el servidor

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias básicas
sudo apt install -y curl git nginx certbot python3-certbot-nginx

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar MySQL 8.0
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

### Clonar y configurar el proyecto

```bash
# Crear usuario de sistema (sin privilegios de root)
sudo useradd -m -s /bin/bash drsimi
sudo su - drsimi

# Clonar el repositorio
git clone https://github.com/alex010-cmd/Dr.Simi.git /home/drsimi/app
cd /home/drsimi/app

# Instalar dependencias
cd backend && npm ci --only=production
cd ../frontend && npm ci && npm run build
```

### Configurar la base de datos en producción

```bash
# Conectarse a MySQL como root
sudo mysql

# Crear bases de datos y usuarios
CREATE USER 'drsimi_central'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
CREATE DATABASE db_central CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON db_central.* TO 'drsimi_central'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Importar esquema
mysql -u drsimi_central -p db_central < /home/drsimi/app/database/central_schema.sql
```

---

## Configuración de Nginx

### Para el servidor central

Archivo: `/etc/nginx/sites-available/drsimi-central`

```nginx
# Redirigir HTTP a HTTPS
server {
    listen 80;
    server_name central.drsimi.com;
    return 301 https://$host$request_uri;
}

# HTTPS — API Backend
server {
    listen 443 ssl http2;
    server_name central.drsimi.com;

    ssl_certificate     /etc/letsencrypt/live/central.drsimi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/central.drsimi.com/privkey.pem;

    # Cabeceras de seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Frontend (React build)
    location / {
        root /home/drsimi/app/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, no-transform";
    }

    # API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # Limitar tamaño de uploads
    client_max_body_size 10M;

    # Logs
    access_log /var/log/nginx/drsimi-access.log;
    error_log  /var/log/nginx/drsimi-error.log;
}
```

```bash
# Activar el sitio
sudo ln -s /etc/nginx/sites-available/drsimi-central /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL/TLS con Let's Encrypt

```bash
# Obtener certificado SSL gratuito
sudo certbot --nginx -d central.drsimi.com -d www.central.drsimi.com

# El certificado se renueva automáticamente. Verificar:
sudo systemctl status certbot.timer

# Renovar manualmente si es necesario
sudo certbot renew --dry-run
```

---

## Gestión de Procesos con PM2

### Configurar PM2

Archivo: `ecosystem.config.js` (en la raíz del proyecto):

```javascript
module.exports = {
  apps: [
    {
      name: 'drsimi-api',
      script: './backend/src/app.js',
      cwd: '/home/drsimi/app',
      instances: 2,          // Dos instancias para alta disponibilidad
      exec_mode: 'cluster',  // Modo cluster de Node.js
      env: {
        NODE_ENV: 'production',
      },
      env_file: './backend/.env',
      error_file: './logs/pm2-api-error.log',
      out_file:   './logs/pm2-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '500M',
      restart_delay: 5000,
    },
    {
      name: 'drsimi-daemon',
      script: './backend/sync-daemon/daemon.js',
      cwd: '/home/drsimi/app',
      instances: 1,    // Solo una instancia del daemon
      exec_mode: 'fork',
      env_file: './backend/.env',
      error_file: './logs/pm2-daemon-error.log',
      out_file:   './logs/pm2-daemon-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '200M',
      restart_delay: 10000,
    },
  ],
};
```

### Comandos PM2

```bash
# Iniciar todos los procesos
pm2 start ecosystem.config.js

# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs
pm2 logs drsimi-api
pm2 logs drsimi-daemon

# Reiniciar sin downtime (para actualizaciones)
pm2 reload drsimi-api

# Detener
pm2 stop all
pm2 stop drsimi-daemon

# Configurar inicio automático al arrancar el servidor
pm2 startup
pm2 save
```

---

## Despliegue Multi-Sucursal

Cada sucursal necesita:

1. **Una PC/servidor local** con Node.js y MySQL instalados
2. **Una copia de la BD local** inicializada con `database/local_schema.sql`
3. **El backend corriendo** en modo sucursal (apuntando a la BD local)
4. **El daemon corriendo** con el `SUCURSAL_ID` correcto
5. **Conectividad** al servidor central (internet o VPN)

### Script de configuración de nueva sucursal

```bash
#!/bin/bash
# setup-sucursal.sh
# Uso: ./setup-sucursal.sh <SUCURSAL_ID> <SUCURSAL_NOMBRE>

SUCURSAL_ID=$1
SUCURSAL_NOMBRE=$2
DB_NAME="db_local_sucursal${SUCURSAL_ID}"

echo "Configurando sucursal #${SUCURSAL_ID}: ${SUCURSAL_NOMBRE}"

# Crear base de datos local
mysql -u root -p -e "
  CREATE DATABASE IF NOT EXISTS ${DB_NAME}
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER IF NOT EXISTS 'drsimi_local'@'localhost'
    IDENTIFIED BY '${LOCAL_DB_PASSWORD}';
  GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO 'drsimi_local'@'localhost';
  FLUSH PRIVILEGES;
"

# Importar esquema
mysql -u root -p ${DB_NAME} < database/local_schema.sql

# Generar .env de sucursal
cat > backend/.env << EOF
NODE_ENV=production
PORT=3000
SUCURSAL_ID=${SUCURSAL_ID}
DB_LOCAL_NAME=${DB_NAME}
DB_LOCAL_USER=drsimi_local
DB_LOCAL_PASSWORD=${LOCAL_DB_PASSWORD}
CENTRAL_API_URL=${CENTRAL_API_URL}
SYNC_SERVICE_TOKEN=${SYNC_SERVICE_TOKEN}
JWT_SECRET=${JWT_SECRET}
EOF

# Registrar la sucursal en la BD central (via API)
curl -X POST "${CENTRAL_API_URL}/api/v1/sucursales" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"id\": ${SUCURSAL_ID}, \"nombre\": \"${SUCURSAL_NOMBRE}\"}"

echo "✅ Sucursal ${SUCURSAL_ID} configurada correctamente"
```

---

## Backups y Recuperación

### Backup automático con cron

```bash
# Editar crontab
crontab -e

# Agregar estas líneas:
# Backup diario a las 2:00 AM
0 2 * * * /home/drsimi/scripts/backup-mysql.sh >> /home/drsimi/logs/backup.log 2>&1

# Backup semanal completo (domingos a las 3:00 AM)
0 3 * * 0 /home/drsimi/scripts/backup-completo.sh >> /home/drsimi/logs/backup.log 2>&1
```

### Script de backup

```bash
#!/bin/bash
# backup-mysql.sh

BACKUP_DIR="/home/drsimi/backups"
FECHA=$(date +%Y%m%d_%H%M%S)
RETENCION_DIAS=30

mkdir -p ${BACKUP_DIR}

# Backup de BD central
mysqldump -u drsimi_central -p${DB_CENTRAL_PASSWORD} \
  --single-transaction --routines --triggers \
  db_central | gzip > ${BACKUP_DIR}/central_${FECHA}.sql.gz

# Eliminar backups antiguos
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +${RETENCION_DIAS} -delete

echo "[$(date)] Backup completado: central_${FECHA}.sql.gz"
```

### Recuperación ante desastres

```bash
# Restaurar BD central desde backup
gunzip -c /home/drsimi/backups/central_20240115_020000.sql.gz \
  | mysql -u drsimi_central -p db_central

# Verificar integridad
mysql -u drsimi_central -p db_central -e "
  SELECT COUNT(*) as ventas FROM ventas_central;
  SELECT COUNT(*) as productos FROM productos;
  SELECT COUNT(*) as sucursales FROM sucursales;
"
```

---

## Actualizaciones

### Proceso de actualización sin downtime

```bash
# 1. Traer los cambios del repositorio
cd /home/drsimi/app
git pull origin main

# 2. Instalar nuevas dependencias (si aplica)
cd backend && npm ci --only=production
cd ../frontend && npm ci && npm run build

# 3. Aplicar migraciones de BD (si aplica)
cd backend && npm run migrate

# 4. Reiniciar el API sin downtime (hot reload de PM2)
pm2 reload drsimi-api

# 5. Reiniciar el daemon
pm2 restart drsimi-daemon

# 6. Verificar el estado
pm2 status
curl https://central.drsimi.com/api/v1/health
```

---

## Monitoreo en Producción

### Verificaciones de salud

```bash
# Estado del sistema
curl https://central.drsimi.com/api/v1/health

# Estado de la sincronización (con token admin)
curl -H "Authorization: Bearer <token>" \
  https://central.drsimi.com/api/v1/sync/status

# Estado de PM2
pm2 status

# Uso de recursos
pm2 monit

# Espacio en disco
df -h

# Uso de memoria MySQL
mysql -u root -p -e "SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool%';"
```

### Alertas recomendadas

Configura alertas en tu sistema de monitoreo (Grafana, Datadog, UptimeRobot) para:

- ❌ API no responde (`/health` retorna error)
- ⚠️ Más de 50 registros FAILED en `sync_queue`
- ⚠️ Sucursal sin sincronizar por más de 1 hora
- ⚠️ Uso de disco > 80%
- ⚠️ Uso de RAM > 85%
- ⚠️ Tiempo de respuesta del API > 2 segundos
