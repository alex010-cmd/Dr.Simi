#!/bin/bash

# EJECUTAR ESTE SCRIPT MANUALMENTE
# Copia y pega estos comandos uno por uno en tu terminal

echo "=== PASO 1: Configurar MariaDB (requiere sudo) ==="
echo "Ejecuta este comando:"
echo ""
echo "sudo mariadb < database/setup_databases.sql"
echo ""
echo "Presiona ENTER cuando lo hayas ejecutado..."
read

echo ""
echo "=== PASO 2: Importar schemas ==="
mariadb -u farmacia_user -pfarmacia_password_2024 farmacia_central < database/schema_central.sql
echo "✓ Schema central importado"

mariadb -u farmacia_user -pfarmacia_password_2024 farmacia_local_sucursal1 < database/schema_local.sql
echo "✓ Schema local importado"

echo ""
echo "=== PASO 3: Crear archivo .env ==="
cd backend
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
echo "✓ Archivo .env creado"

echo ""
echo "=== CONFIGURACIÓN COMPLETADA ==="
echo ""
echo "Ahora ejecuta en diferentes terminales:"
echo ""
echo "Terminal 1: cd backend && npm start"
echo "Terminal 2: cd frontend && npm run dev"
echo ""
echo "Abre: http://localhost:5173/"
echo "Login: admin@farmacia.com / admin123"
