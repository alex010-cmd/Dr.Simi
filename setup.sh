#!/bin/bash

# Script automatizado de configuración del proyecto
# Este script configura todo el entorno necesario

set -e  # Salir si hay algún error

echo "=============================================="
echo "CONFIGURACIÓN DEL PROYECTO DE FARMACIA"
echo "=============================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directorio del proyecto
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}📁 Directorio del proyecto: $PROJECT_DIR${NC}"
echo ""

# Paso 1: Configurar MariaDB
echo -e "${BLUE}Paso 1/5: Configurando MariaDB...${NC}"
echo "Por favor ingresa tu contraseña de sudo para configurar las bases de datos:"
sudo mariadb < "$PROJECT_DIR/database/setup_databases.sql"
echo -e "${GREEN}✓ Bases de datos creadas${NC}"
echo ""

# Paso 2: Importar schema central
echo -e "${BLUE}Paso 2/5: Importando schema central...${NC}"
mariadb -u farmacia_user -pfarmacia_password_2024 farmacia_central < "$PROJECT_DIR/database/schema_central.sql"
echo -e "${GREEN}✓ Schema central importado${NC}"
echo ""

# Paso 3: Importar schema local
echo -e "${BLUE}Paso 3/5: Importando schema local...${NC}"
mariadb -u farmacia_user -pfarmacia_password_2024 farmacia_local_sucursal1 < "$PROJECT_DIR/database/schema_local.sql"
echo -e "${GREEN}✓ Schema local importado${NC}"
echo ""

# Paso 4: Configurar backend
echo -e "${BLUE}Paso 4/5: Configurando backend...${NC}"
cd "$PROJECT_DIR/backend"

# Crear archivo .env
cat > .env << 'EOF'
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

# JWT Secret
JWT_SECRET=mi_clave_super_secreta_para_jwt_2024
JWT_EXPIRES_IN=24h

# Entorno
NODE_ENV=development

# ID de la sucursal local
SUCURSAL_ID=1
EOF

echo -e "${GREEN}✓ Archivo .env creado${NC}"
echo ""

# Paso 5: Verificar instalación de dependencias
echo -e "${BLUE}Paso 5/5: Verificando dependencias...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias del backend..."
    npm install
fi
echo -e "${GREEN}✓ Dependencias del backend listas${NC}"

cd "$PROJECT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias del frontend..."
    npm install
fi
echo -e "${GREEN}✓ Dependencias del frontend listas${NC}"
echo ""

# Resumen final
echo -e "${GREEN}=============================================="
echo "✓ CONFIGURACIÓN COMPLETADA"
echo "==============================================${NC}"
echo ""
echo -e "${BLUE}Para iniciar el proyecto:${NC}"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd \"$PROJECT_DIR/backend\""
echo "  npm start"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd \"$PROJECT_DIR/frontend\""
echo "  npm run dev"
echo ""
echo "Terminal 3 - Sincronización (opcional):"
echo "  cd \"$PROJECT_DIR/scripts\""
echo "  node sync_daemon.js"
echo ""
echo -e "${BLUE}Acceder a la aplicación:${NC}"
echo "  http://localhost:5173/"
echo ""
echo -e "${BLUE}Credenciales de prueba:${NC}"
echo "  Admin:    admin@farmacia.com / admin123"
echo "  Gerente:  gerente1@farmacia.com / gerente123"
echo "  Empleado: empleado1@farmacia.com / empleado123"
echo ""
echo -e "${GREEN}¡Todo listo!${NC}"
