# 🏗️ Arquitectura del Sistema

Sistema de Base de Datos Distribuida para Farmacia

---

## 📊 Visión General

El sistema implementa una arquitectura de **base de datos distribuida híbrida** que combina:

- **Centralización** para datos maestros compartidos
- **Distribución** para datos operacionales locales
- **Replicación** para disponibilidad y rendimiento
- **Sincronización** automática bidireccional

---

## 🎯 Objetivos de Arquitectura

1. **Alta Disponibilidad**: Operación continua incluso con fallos de red
2. **Escalabilidad Horizontal**: Agregar sucursales sin degradar rendimiento
3. **Consistencia Eventual**: Sincronización periódica de datos
4. **Autonomía Local**: Cada sucursal opera independientemente
5. **Integridad Referencial**: Mantener consistencia de datos

---

## 🏢 Arquitectura de 3 Capas

```
┌─────────────────────────────────────────────────────────────────┐
│                      CAPA DE PRESENTACIÓN                        │
│                     (Frontend - React)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Dashboard │  │  Ventas  │  │Inventario│  │ Reportes │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP/REST API
┌─────────────────────────────▼───────────────────────────────────┐
│                    CAPA DE APLICACIÓN                            │
│                  (Backend - Node.js/Express)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Controladores  │  Servicios  │  Middleware  │  Auth     │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Servicio de Sincronización (Daemon)              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────┬─────────────────┬─────────────────────────┘
                      │                 │
        ┌─────────────▼──────┐   ┌──────▼──────────┐
        │   Conexión BD      │   │  Conexión BD    │
        │    CENTRAL         │   │     LOCAL       │
        └─────────────┬──────┘   └──────┬──────────┘
                      │                 │
┌─────────────────────▼─────────────────▼─────────────────────────┐
│                      CAPA DE DATOS                               │
│  ┌──────────────────────┐        ┌──────────────────────┐      │
│  │   BD CENTRAL         │        │   BD LOCAL           │      │
│  │   (MySQL Master)     │◄──────►│   (MySQL Replica)    │      │
│  │                      │        │                      │      │
│  │  • Productos         │        │  • Inventario        │      │
│  │  • Proveedores       │        │  • Ventas            │      │
│  │  • Empleados         │        │  • Compras           │      │
│  │  • Clientes          │        │  • Cache Productos   │      │
│  │  • Sucursales        │        │  • Cache Clientes    │      │
│  └──────────────────────┘        └──────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Modelo de Distribución de Datos

### Datos Centralizados (Servidor Central)

| Entidad | Ubicación | Tipo | Propósito |
|---------|-----------|------|-----------|
| **productos** | Central | Maestro | Catálogo único de productos |
| **proveedores** | Central | Maestro | Información de proveedores |
| **empleados** | Central | Maestro | Personal de todas las sucursales |
| **clientes** | Central | Consolidado | Clientes unificados de todas las sucursales |
| **sucursales** | Central | Configuración | Catálogo de farmacias |
| **log_sincronizacion** | Central | Auditoría | Registro de sincronizaciones |

**Ventajas**:
- Única fuente de verdad para datos maestros
- Actualizaciones centralizadas (precios, productos)
- Reportes consolidados multi-sucursal
- Gestión centralizada de usuarios

### Datos Distribuidos (Servidores Locales)

| Entidad | Ubicación | Fragmentación | Propósito |
|---------|-----------|---------------|-----------|
| **inventario** | Local | Horizontal por `id_sucursal` | Stock específico de cada sucursal |
| **ventas** | Local | Horizontal por `id_sucursal` | Transacciones locales |
| **detalle_venta** | Local | Horizontal por `id_venta` | Líneas de venta |
| **compras** | Local | Horizontal por `id_sucursal` | Órdenes de compra |
| **detalle_compra** | Local | Horizontal por `id_compra` | Líneas de compra |
| **movimientos_inventario** | Local | Horizontal por `id_sucursal` | Trazabilidad de movimientos |
| **caja** | Local | Horizontal por `id_sucursal` | Control de efectivo |

**Ventajas**:
- Operación sin dependencia del servidor central
- Rendimiento de consultas locales rápido
- Reducción de tráfico de red
- Aislamiento de fallos

### Datos Replicados (Caché Local)

| Entidad | Origen | Destino | Sincronización |
|---------|--------|---------|----------------|
| **productos_local** | Central | Local | Pull cada 5 min |
| **clientes_local** | Central | Local | Pull cada 5 min |

**Ventajas**:
- Consultas rápidas sin latencia de red
- Operación offline
- Reducción de carga en servidor central

---

## 🔄 Estrategia de Sincronización

### Sincronización Bidireccional

```
           ┌────────────────────────────────┐
           │     SERVIDOR CENTRAL           │
           │    (farmacia_central)          │
           └──────────┬─────────────────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
    Pull  │     Push  │     Pull  │
    ◄─────┤     ─────►│     ◄─────┤
          │           │           │
    ┌─────▼─────┐ ┌───▼─────┐ ┌──▼──────┐
    │  SUC 001  │ │ SUC 002 │ │ SUC 003 │
    └───────────┘ └─────────┘ └─────────┘
```

### Proceso de Sincronización (cada 5 minutos)

1. **Pull: Central → Local** (Replicación Descendente)
   ```
   Sincronizar:
   - Nuevos productos
   - Actualizaciones de precios
   - Nuevos clientes de otras sucursales
   - Cambios en catálogos maestros
   ```

2. **Push: Local → Central** (Replicación Ascendente)
   ```
   Sincronizar:
   - Nuevas ventas realizadas
   - Nuevas compras registradas
   - Movimientos de inventario
   - Nuevos clientes registrados localmente
   ```

3. **Resolución de Conflictos**
   - **Last Write Wins (LWW)**: Se usa timestamp para decidir
   - **Integridad Referencial**: Validación antes de insertar
   - **Logs de Conflictos**: Registro en tabla `log_sincronizacion`

---

## 🔐 Seguridad en Capas

### Nivel 1: Autenticación

```javascript
Usuario → Login → Validar Credenciales → Generar JWT
                          ↓
                  bcrypt.compare(password, hash)
                          ↓
                   ¿Válido? → JWT Token
```

**Características**:
- Passwords hasheados con bcrypt (10 rounds)
- Tokens JWT con expiración (8 horas)
- Validación de estado de cuenta (activo/inactivo)

### Nivel 2: Autorización

```javascript
Request → Verificar JWT → Extraer Rol → Validar Permiso
                             ↓
                    ┌────────┴────────┐
                    │                 │
                  Admin          Gerente/Empleado
                    │                 │
              Todo acceso     Acceso limitado
```

**Matriz de Permisos**:

| Recurso | Admin | Gerente | Empleado |
|---------|-------|---------|----------|
| Productos (Crear/Editar) | ✅ | ❌ | ❌ |
| Ventas (Crear) | ✅ | ✅ | ✅ |
| Ventas (Cancelar) | ✅ | ✅ | ❌ |
| Inventario (Ver) | ✅ | ✅ | ✅ |
| Inventario (Editar) | ✅ | ✅ | ❌ |
| Reportes Multi-Sucursal | ✅ | ❌ | ❌ |
| Configuración | ✅ | ❌ | ❌ |

### Nivel 3: Encriptación y Transporte

- **HTTPS**: Comunicación encriptada (TLS 1.2+)
- **Bcrypt**: Hash de contraseñas con salt
- **JWT**: Tokens firmados con HS256
- **SQL Injection**: Prepared Statements con Sequelize
- **XSS**: Content Security Policy Headers

---

## 📡 API RESTful

### Estructura de Endpoints

```
/api/auth
  POST   /login              - Iniciar sesión
  POST   /logout             - Cerrar sesión
  GET    /me                 - Obtener usuario actual
  POST   /change-password    - Cambiar contraseña

/api/productos
  GET    /                   - Listar productos
  GET    /:id                - Obtener producto
  GET    /barcode/:codigo    - Buscar por código de barras
  POST   /                   - Crear producto (Admin)
  PUT    /:id                - Actualizar producto (Admin)

/api/ventas
  GET    /                   - Listar ventas
  GET    /:id                - Obtener venta
  POST   /                   - Crear venta
  PUT    /:id/cancelar       - Cancelar venta

/api/inventario
  GET    /                   - Listar inventario
  GET    /producto/:id       - Inventario de producto
  GET    /alertas            - Alertas de stock
  PUT    /:id                - Actualizar inventario

/api/clientes
  GET    /                   - Listar clientes
  GET    /:id                - Obtener cliente
  POST   /                   - Crear cliente
  PUT    /:id                - Actualizar cliente

/api/reportes
  GET    /ventas             - Reporte de ventas
  GET    /inventario         - Reporte de inventario
  GET    /productos-vendidos - Productos más vendidos
```

### Formato de Respuestas

**Respuesta Exitosa**:
```json
{
  "success": true,
  "data": {
    // Datos solicitados
  },
  "message": "Operación exitosa"
}
```

**Respuesta de Error**:
```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalles técnicos (solo en desarrollo)"
}
```

---

## ⚡ Optimización de Rendimiento

### Nivel de Base de Datos

1. **Índices Estratégicos**
   ```sql
   -- Búsqueda de productos
   INDEX idx_codigo_barras ON productos(codigo_barras)
   INDEX idx_categoria ON productos(categoria)
   
   -- Consultas de ventas
   INDEX idx_fecha ON ventas(fecha_venta)
   INDEX idx_sucursal ON ventas(id_sucursal)
   
   -- Inventario
   INDEX idx_producto ON inventario(id_producto)
   INDEX idx_estado ON inventario(estado)
   ```

2. **Vistas Materializadas** (simuladas con caché)
   ```sql
   CREATE VIEW v_productos_bajo_stock AS ...
   CREATE VIEW v_ventas_dia AS ...
   ```

3. **Connection Pooling**
   ```javascript
   pool: {
     max: 15,        // Máximo conexiones
     min: 0,         // Mínimo conexiones
     acquire: 30000, // Timeout para adquirir
     idle: 10000     // Timeout de inactividad
   }
   ```

### Nivel de Aplicación

1. **Caché de Datos Frecuentes**
   - Productos en memoria (Redis opcional)
   - Sesiones de usuario
   - Resultados de consultas complejas

2. **Paginación de Resultados**
   ```javascript
   GET /api/productos?page=1&limit=50
   ```

3. **Lazy Loading**
   - Carga de imágenes diferida
   - Datos del dashboard bajo demanda

---

## 🔍 Descomposición de Consultas Distribuidas

### Ejemplo: Total de Ventas por Sucursal (Último Mes)

**Consulta Fragmentada**:

```javascript
// Paso 1: Ejecutar en cada sucursal local
const queryLocal = `
  SELECT 
    id_sucursal,
    COUNT(*) as total_ventas,
    SUM(total) as monto_total
  FROM ventas
  WHERE fecha_venta >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  GROUP BY id_sucursal
`;

// Paso 2: Consolidar en servidor central
const resultados = await Promise.all(
  sucursales.map(suc => ejecutarEnSucursal(suc.id, queryLocal))
);

// Paso 3: Agregar resultados
const consolidado = resultados.reduce((acc, curr) => {
  acc.total_ventas += curr.total_ventas;
  acc.monto_total += curr.monto_total;
  return acc;
}, { total_ventas: 0, monto_total: 0 });
```

---

## 📊 Diagrama Entidad-Relación (Simplificado)

Ver archivo: `docs/diagramas/diagrama_er.png`

### Relaciones Principales

```
PRODUCTOS (1) ──< (N) INVENTARIO
                      │
                      └──< (N) MOVIMIENTOS_INVENTARIO

PRODUCTOS (1) ──< (N) DETALLE_VENTA (N) >── (1) VENTAS
                                                  │
                                                  ├── (1) CLIENTES
                                                  ├── (1) EMPLEADOS
                                                  └── (1) SUCURSALES

PROVEEDORES (1) ──< (N) COMPRAS ──< (N) DETALLE_COMPRA >── (N) PRODUCTOS
```

---

## 🛡️ Tolerancia a Fallos

### Escenarios de Fallo

| Escenario | Impacto | Solución |
|-----------|---------|----------|
| Fallo de red | Sucursal no sincroniza | Opera con caché local, sincroniza al reconectar |
| Servidor central caído | No se reciben actualizaciones | Sucursales operan independientemente |
| Servidor local caído | Sucursal no opera | Respaldo de datos en central, restauración rápida |
| Base de datos corrupta | Pérdida de datos | Backups automáticos diarios |

### Estrategias de Recuperación

1. **Reintentos Automáticos**
   ```javascript
   // Reintento con backoff exponencial
   maxRetries: 3
   backoffMultiplier: 2 (1s, 2s, 4s)
   ```

2. **Cola de Sincronización**
   - Ventas se marcan como `sincronizado = FALSE`
   - Daemon reintenta en próxima ejecución
   - Garantiza eventual consistency

3. **Backups Incrementales**
   ```bash
   # Diario a las 2:00 AM
   mysqldump farmacia_central > backup_$(date +%Y%m%d).sql
   ```

---

## 📈 Escalabilidad

### Escalabilidad Horizontal

```
Agregar Nueva Sucursal:
1. Instalar servidor local
2. Crear BD local con schema_local.sql
3. Registrar en tabla `sucursales` de BD central
4. Configurar daemon de sincronización
5. Iniciar operaciones
```

### Escalabilidad Vertical

- Incrementar recursos de servidor central
- Optimizar consultas con índices
- Implementar particionamiento de tablas

---

## 📝 Conclusión

Esta arquitectura proporciona:

✅ **Alta disponibilidad** mediante operación autónoma de sucursales  
✅ **Escalabilidad** horizontal agregando nuevas sucursales  
✅ **Consistencia eventual** a través de sincronización periódica  
✅ **Rendimiento óptimo** con caché local y consultas distribuidas  
✅ **Seguridad robusta** con autenticación, autorización y encriptación  
✅ **Tolerancia a fallos** con sincronización resiliente  

El diseño balanceo entre autonomía local y consolidación centralizada, permitiendo que cada sucursal opere de manera independiente mientras mantiene una vista unificada del negocio.
