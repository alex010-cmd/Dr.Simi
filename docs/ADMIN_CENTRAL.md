# 👑 PANEL DE ADMINISTRACIÓN CENTRAL

## 📋 Descripción General

El Panel de Administración Central es una interfaz exclusiva para usuarios con rol `admin` que permite monitorear y gestionar todas las sucursales desde un punto centralizado.

## 🔑 Acceso

### Requisitos:
- Usuario autenticado con rol **`admin`**
- Código de administrador central: `SR123456789SR`

### URL:
```
http://localhost:5173/admin
```

### Navegación:
- Aparece en el navbar como **"Admin Central"** con icono de escudo (solo para admins)
- Color distintivo: **morado/púrpura**

## 📊 Funcionalidades

### 1. Selector de Sucursales
Dropdown que permite seleccionar cualquier sucursal activa del sistema para ver sus estadísticas en tiempo real.

### 2. KPIs Principales (Cards Superiores)

#### Empleados Activos
- **Color:** Azul
- **Datos:** Total de empleados activos en la sucursal
- **Fuente:** Base de datos central - tabla `empleados`

#### Clientes Registrados
- **Color:** Verde
- **Datos:** Total de clientes registrados en esa sucursal
- **Fuente:** Base de datos central - tabla `clientes`

#### Productos en Stock
- **Color:** Amarillo
- **Datos:** Total de productos en inventario
- **Alerta:** Muestra cantidad de productos con stock bajo
- **Fuente:** Base de datos local - tabla `inventario`

#### Ventas Hoy
- **Color:** Morado
- **Datos:** 
  - Cantidad de ventas del día
  - Monto total vendido hoy
- **Fuente:** Base de datos local - tabla `ventas`

### 3. Información Detallada de la Sucursal

**Datos mostrados:**
- Código de sucursal
- Nombre completo
- Estado (activa/inactiva/mantenimiento)
- Dirección completa
- Ciudad y Estado
- Teléfono
- Información del gerente (nombre, teléfono, email)

### 4. Resumen de Ventas del Mes

**Métricas:**
- Total de ventas completadas en el mes actual
- Ingresos totales del mes en pesos mexicanos (MXN)

### 5. Distribución de Empleados por Rol

**Muestra:**
- Gráfico visual con cantidad de empleados por cada rol:
  - Admin (rojo)
  - Gerente (azul)
  - Empleado (verde)

### 6. Tabla de Jefes de Turno y Supervisores

**Información detallada:**
- Nombre completo
- Número de empleado
- Puesto (con badge de color)
- Turno asignado
- Datos de contacto (teléfono y email)

**Filtros aplicados:**
- Solo empleados con rol `gerente`
- Puestos que incluyan: supervisor, jefe, encargado

## 🔌 API Endpoints Utilizados

### 1. Listar Sucursales
```
GET /api/sucursales
```
**Respuesta:**
```json
[
  {
    "id_sucursal": 1,
    "codigo_sucursal": "SUC001",
    "nombre_sucursal": "Farmacia Centro",
    "ciudad": "Guadalajara",
    "estado": "Jalisco",
    "estado_sucursal": "activa"
  }
]
```

### 2. Estadísticas Detalladas de Sucursal
```
GET /api/sucursales/:id/admin-stats
```
**Respuesta:**
```json
{
  "sucursal": {
    "id_sucursal": 1,
    "codigo_sucursal": "SUC001",
    "nombre_sucursal": "Farmacia Centro",
    "direccion": "Av. Juárez #123",
    "ciudad": "Guadalajara",
    "estado": "Jalisco",
    "telefono": "33-1234-5678",
    "nombre_gerente": "Juan Pérez García",
    "telefono_gerente": "33-9876-5432",
    "email_gerente": "juan.perez@farmacia.com"
  },
  "empleados": {
    "total": 15,
    "por_rol": [
      { "rol": "admin", "total": 1 },
      { "rol": "gerente", "total": 2 },
      { "rol": "empleado", "total": 12 }
    ],
    "jefes_turno": [
      {
        "nombre_completo": "Juan Pérez",
        "numero_empleado": "EMP001",
        "puesto": "Gerente General",
        "turno": "matutino",
        "telefono": "33-9876-5432",
        "email": "juan.perez@farmacia.com"
      }
    ]
  },
  "clientes": {
    "total": 523
  },
  "inventario": {
    "total_productos": 1250,
    "productos_bajo_stock": 45
  },
  "ventas": {
    "hoy": {
      "cantidad": 87,
      "monto": 34560.50
    },
    "mes": {
      "cantidad": 2341,
      "monto": 987654.32
    }
  }
}
```

## 🎨 Diseño y UI

### Paleta de Colores:
- **Header:** Gradiente púrpura-índigo (`from-purple-600 to-indigo-600`)
- **Cards KPI:** Gradientes específicos por categoría
- **Badges de Rol:**
  - Admin: Rojo (`bg-red-100 text-red-800`)
  - Gerente: Azul (`bg-blue-100 text-blue-800`)
  - Empleado: Verde (`bg-green-100 text-green-800`)

### Iconos (Lucide React):
- 🏢 Edificio (información sucursal)
- 👥 Usuarios (empleados)
- 👨‍👩‍👧‍👦 Grupo (clientes)
- 📦 Paquete (inventario)
- 💰 Moneda (ventas)
- 📊 Gráfico (estadísticas)
- 👨‍💼 Usuario con escudo (jefes de turno)

### Estados de Carga:
- **Inicial:** Spinner con mensaje "Cargando panel de administración..."
- **Estadísticas:** Spinner con mensaje "Cargando estadísticas..."

### Mensajes de Error:
- **Sin permisos:** Card roja con icono de advertencia
- **Error de carga:** Mensaje específico del error

## 🔒 Seguridad

### Validaciones:
1. **Frontend:**
   - Verifica `user.rol === 'admin'` antes de renderizar
   - Muestra mensaje de acceso denegado si no es admin
   - No permite acceso directo por URL

2. **Backend:**
   - Todos los endpoints requieren token JWT válido
   - Middleware `verificarToken` en todas las rutas
   - Validación de permisos en el servidor

### Datos Protegidos:
- Información financiera (ventas, ingresos)
- Datos de contacto de empleados
- Estadísticas de todas las sucursales

## 📱 Responsividad

### Desktop (lg):
- Grid de 4 columnas para KPIs
- Grid de 3 columnas para empleados por rol
- Grid de 2 columnas para información de sucursal

### Tablet (md):
- Grid de 2 columnas para KPIs
- Tabla completa de jefes de turno

### Mobile (sm):
- Grid de 1 columna (apilado)
- Tabla con scroll horizontal
- Navbar con menú hamburguesa

## 🚀 Uso

### Flujo de Trabajo:
1. Iniciar sesión como administrador central
2. Clic en **"Admin Central"** en el navbar (morado)
3. Seleccionar sucursal del dropdown
4. Visualizar todas las estadísticas en tiempo real
5. Cambiar de sucursal para comparar

### Casos de Uso:
- ✅ Monitorear ventas diarias de todas las sucursales
- ✅ Verificar niveles de inventario y stock bajo
- ✅ Revisar personal activo por sucursal
- ✅ Obtener contacto de gerentes y jefes de turno
- ✅ Analizar desempeño mensual
- ✅ Identificar sucursales con problemas de inventario

## 📝 Archivos Creados

### Frontend:
```
frontend/src/pages/AdminCentral.jsx
```

### Backend:
```
backend/controllers/sucursalesController.js
  └─ función: estadisticasDetalladas()
backend/routes/sucursales.js
  └─ ruta: GET /:id/admin-stats
```

### Modificaciones:
```
frontend/src/App.jsx
  └─ Ruta: /admin
frontend/src/components/common/Navbar.jsx
  └─ Link de Admin Central (solo para admins)
```

## 🧪 Testing

### Pruebas Manuales:
1. **Login como admin:**
   - Usuario: `admin`
   - Contraseña: `admin123`

2. **Verificar navbar:**
   - Debe aparecer "Admin Central" con icono morado

3. **Acceder al panel:**
   - Click en "Admin Central"
   - Debe cargar lista de sucursales

4. **Seleccionar sucursal:**
   - Elegir una sucursal del dropdown
   - Verificar que carguen todas las estadísticas

5. **Verificar datos:**
   - KPIs con números correctos
   - Información de sucursal completa
   - Tabla de jefes de turno poblada

### Testing de Seguridad:
1. **Sin autenticación:**
   - Intentar acceder a `/admin` sin login
   - Debe redirigir a `/login`

2. **Usuario no admin:**
   - Login como empleado o gerente
   - No debe aparecer "Admin Central" en navbar
   - Acceso directo a `/admin` debe mostrar "Acceso Denegado"

3. **API endpoints:**
   - Intentar acceder sin token
   - Debe retornar 401 Unauthorized

## 🔄 Futuras Mejoras

### Funcionalidades Pendientes:
- [ ] Sesiones activas en tiempo real (WebSocket)
- [ ] Gráficos comparativos entre sucursales
- [ ] Exportar reportes a PDF/Excel
- [ ] Notificaciones de alertas (stock bajo, etc.)
- [ ] Dashboard con múltiples sucursales simultáneas
- [ ] Filtros por rango de fechas
- [ ] Comparación de rendimiento mensual/anual

### Optimizaciones:
- [ ] Caché de estadísticas (Redis)
- [ ] Actualización automática cada X minutos
- [ ] Paginación en tabla de empleados
- [ ] Búsqueda y filtros avanzados

## 📚 Documentación Relacionada

- [Sistema de Registro de Usuarios](./SISTEMA_REGISTRO_USUARIOS.md)
- [Guía de Ejecución](../GUIA_EJECUCION.md)
- [Guía Rápida](../GUIA_RAPIDA.md)
- [README Principal](../README.md)

---

**Última actualización:** Abril 2026  
**Versión:** 1.0.0  
**Estado:** ✅ Completo y funcional
