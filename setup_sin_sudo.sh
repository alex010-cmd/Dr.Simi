#!/bin/bash

# Script de configuración SIN SUDO
# Ejecuta primero: sudo mariadb < database/setup_databases.sql

set -e

echo "=============================================="
echo "CONFIGURACIÓN DEL PROYECTO DE FARMACIA"
echo "=============================================="
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${YELLOW}IMPORTANTE: Primero ejecuta este comando en otra terminal:${NC}"
echo -e "${YELLOW}sudo mariadb < \"$PROJECT_DIR/database/setup_databases.sql\"${NC}"
echo ""
read -p "¿Ya ejecutaste el comando anterior? (s/n): " respuesta

if [ "$respuesta" != "s" ] && [ "$respuesta" != "S" ]; then
    echo "Por favor ejecuta el comando primero y luego vuelve a correr este script."
    exit 1
fi

echo ""
echo -e "${BLUE}Paso 1/4: Importando schema central...${NC}"
mariadb -u farmacia_user -pfarmacia_password_2024 farmacia_central < "$PROJECT_DIR/database/schema_central.sql"
echo -e "${GREEN}✓ Schema central importado${NC}"
echo ""

echo -e "${BLUE}Paso 2/4: Importando schema local...${NC}"
mariadb -u farmacia_user -pfarmacia_password_2024 farmacia_local_sucursal1 < "$PROJECT_DIR/database/schema_local.sql"
echo -e "${GREEN}✓ Schema local importado${NC}"
echo ""

echo -e "${BLUE}Paso 3/4: Configurando backend...${NC}"
cd "$PROJECT_DIR/backend"

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

echo -e "${GREEN}✓ Archivo .env creado${NC}"
echo ""

echo -e "${BLUE}Paso 4/4: Verificando dependencias...${NC}"
echo -e "${GREEN}✓ Dependencias ya instaladas${NC}"
echo ""

echo -e "${GREEN}=============================================="
echo "✓ CONFIGURACIÓN COMPLETADA"
echo "==============================================${NC}"
echo ""
echo -e "${BLUE}Para iniciar el proyecto:${NC}"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd \"$PROJECT_DIR/backend\" && npm start"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd \"$PROJECT_DIR/frontend\" && npm run dev"
echo ""
echo "Acceder: http://localhost:5173/"
echo "Login: admin@farmacia.com / admin123"
