# 🔌 Referencia de API REST — Dr. Simi

**Base URL:** `http://localhost:3000/api/v1`  
**Formato:** JSON (`Content-Type: application/json`)  
**Autenticación:** Bearer Token (JWT)

---

## Tabla de Contenidos

- [Autenticación](#autenticación)
- [Salud del Sistema](#salud-del-sistema)
- [Ventas](#ventas)
- [Inventario / Productos](#inventario--productos)
- [Clientes](#clientes)
- [Empleados](#empleados)
- [Sucursales](#sucursales)
- [Sincronización](#sincronización)
- [Reportes](#reportes)
- [Códigos de Error](#códigos-de-error)

---

## Autenticación

Todos los endpoints (excepto `/auth/*` y `/health`) requieren el header:

```
Authorization: Bearer <token_jwt>
```

### `POST /auth/login`

Iniciar sesión y obtener token JWT.

**Request:**
```json
{
  "email": "admin@drsimi.com",
  "password": "Admin123!"
}
```

**Response 200:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "8h",
  "user": {
    "id": 1,
    "nombre": "Administrador Central",
    "email": "admin@drsimi.com",
    "rol": "super_admin",
    "sucursal_id": null
  }
}
```

**Response 401:**
```json
{
  "success": false,
  "error": "Credenciales inválidas"
}
```

---

### `POST /auth/logout`

Cerrar sesión (invalida el token en el servidor).

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "success": true,
  "message": "Sesión cerrada correctamente"
}
```

---

### `POST /auth/refresh`

Renovar el token JWT antes de que expire.

**Request:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response 200:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "8h"
}
```

---

### `GET /auth/me`

Obtener información del usuario autenticado.

**Response 200:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "nombre": "Administrador Central",
    "email": "admin@drsimi.com",
    "rol": "super_admin",
    "sucursal_id": null,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Salud del Sistema

### `GET /health`

Verificar el estado del servidor (no requiere autenticación).

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "db_central": "connected",
  "db_local": "connected",
  "uptime_seconds": 3600
}
```

---

## Ventas

### `GET /ventas`

Listar ventas con filtros y paginación.

**Query Parameters:**

| Parámetro | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `page` | number | Página (default: 1) | `?page=2` |
| `limit` | number | Resultados por página (default: 20, max: 100) | `?limit=50` |
| `fecha_inicio` | date | Filtrar desde fecha (YYYY-MM-DD) | `?fecha_inicio=2024-01-01` |
| `fecha_fin` | date | Filtrar hasta fecha | `?fecha_fin=2024-01-31` |
| `sucursal_id` | number | Filtrar por sucursal | `?sucursal_id=1` |
| `cajero_id` | number | Filtrar por cajero | `?cajero_id=5` |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1001,
      "folio": "VTA-2024-001001",
      "fecha": "2024-01-15T10:30:00.000Z",
      "total": 285.50,
      "subtotal": 246.98,
      "iva": 38.52,
      "descuento": 0,
      "forma_pago": "efectivo",
      "status": "completada",
      "cliente_id": 42,
      "cliente_nombre": "María García López",
      "cajero_id": 3,
      "cajero_nombre": "Juan Pérez",
      "sucursal_id": 1,
      "items_count": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 154,
    "pages": 8
  }
}
```

---

### `POST /ventas`

Registrar una nueva venta.

**Roles requeridos:** `cajero`, `gerente`, `admin`, `super_admin`

**Request:**
```json
{
  "cliente_id": 42,
  "forma_pago": "efectivo",
  "descuento": 0,
  "items": [
    {
      "producto_id": 101,
      "cantidad": 2,
      "precio_unitario": 45.00
    },
    {
      "producto_id": 205,
      "cantidad": 1,
      "precio_unitario": 156.98
    }
  ]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 1002,
    "folio": "VTA-2024-001002",
    "fecha": "2024-01-15T10:35:00.000Z",
    "subtotal": 246.98,
    "iva": 38.52,
    "descuento": 0,
    "total": 285.50,
    "forma_pago": "efectivo",
    "status": "completada",
    "sucursal_id": 1,
    "items": [
      {
        "producto_id": 101,
        "nombre": "Paracetamol 500mg",
        "cantidad": 2,
        "precio_unitario": 45.00,
        "subtotal": 90.00
      },
      {
        "producto_id": 205,
        "nombre": "Vitamina C 1000mg",
        "cantidad": 1,
        "precio_unitario": 156.98,
        "subtotal": 156.98
      }
    ]
  }
}
```

---

### `GET /ventas/:id`

Obtener el detalle completo de una venta.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1001,
    "folio": "VTA-2024-001001",
    "fecha": "2024-01-15T10:30:00.000Z",
    "total": 285.50,
    "subtotal": 246.98,
    "iva": 38.52,
    "descuento": 0,
    "forma_pago": "efectivo",
    "status": "completada",
    "cliente": {
      "id": 42,
      "nombre": "María García López",
      "email": "mgarcia@email.com"
    },
    "cajero": {
      "id": 3,
      "nombre": "Juan Pérez"
    },
    "sucursal": {
      "id": 1,
      "nombre": "Sucursal Centro"
    },
    "items": [ ... ],
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### `DELETE /ventas/:id`

Cancelar una venta (solo el mismo día).

**Roles requeridos:** `gerente`, `admin`, `super_admin`

**Response 200:**
```json
{
  "success": true,
  "message": "Venta VTA-2024-001001 cancelada correctamente",
  "inventario_restaurado": true
}
```

---

## Inventario / Productos

### `GET /productos`

Listar productos del catálogo.

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `page` | number | Página (default: 1) |
| `limit` | number | Resultados por página (default: 20) |
| `search` | string | Buscar por nombre o código de barras |
| `categoria` | string | Filtrar por categoría |
| `stock_bajo` | boolean | Solo productos con stock bajo el mínimo |
| `sucursal_id` | number | Inventario de sucursal específica |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "codigo_barras": "7501059203264",
      "nombre": "Paracetamol 500mg",
      "descripcion": "Analgésico y antipirético",
      "categoria": "Analgésicos",
      "precio_venta": 45.00,
      "precio_compra": 22.50,
      "stock_actual": 150,
      "stock_minimo": 20,
      "unidad": "caja",
      "requiere_receta": false,
      "proveedor_id": 5
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 480, "pages": 24 }
}
```

---

### `POST /productos`

Crear un nuevo producto en el catálogo.

**Roles requeridos:** `admin`, `super_admin`

**Request:**
```json
{
  "codigo_barras": "7501234567890",
  "nombre": "Ibuprofeno 400mg",
  "descripcion": "Antiinflamatorio no esteroideo",
  "categoria": "Analgésicos",
  "precio_venta": 35.00,
  "precio_compra": 16.00,
  "stock_minimo": 30,
  "unidad": "caja",
  "requiere_receta": false,
  "proveedor_id": 5
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 481,
    "codigo_barras": "7501234567890",
    "nombre": "Ibuprofeno 400mg",
    ...
  }
}
```

---

### `PUT /productos/:id`

Actualizar información de un producto.

**Roles requeridos:** `almacenista`, `gerente`, `admin`, `super_admin`

**Request:** (campos a actualizar)
```json
{
  "precio_venta": 38.00,
  "stock_minimo": 25
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { ... producto actualizado ... }
}
```

---

### `POST /productos/:id/ajuste-inventario`

Realizar un ajuste de inventario (entrada o salida).

**Roles requeridos:** `almacenista`, `gerente`, `admin`, `super_admin`

**Request:**
```json
{
  "tipo": "entrada",
  "cantidad": 100,
  "motivo": "Compra a proveedor",
  "referencia": "OC-2024-0015"
}
```

**Tipos válidos:** `entrada`, `salida`, `ajuste_positivo`, `ajuste_negativo`, `transferencia`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "movimiento_id": 2501,
    "producto_id": 101,
    "stock_anterior": 150,
    "stock_nuevo": 250,
    "diferencia": 100,
    "tipo": "entrada",
    "motivo": "Compra a proveedor",
    "fecha": "2024-01-15T11:00:00.000Z"
  }
}
```

---

## Clientes

### `GET /clientes`

Listar clientes registrados.

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `page` | number | Página |
| `limit` | number | Resultados por página |
| `search` | string | Buscar por nombre, email o teléfono |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "nombre": "María García López",
      "email": "mgarcia@email.com",
      "telefono": "555-123-4567",
      "fecha_nacimiento": "1985-03-15",
      "puntos_acumulados": 1250,
      "total_compras": 18,
      "ultima_compra": "2024-01-10T14:22:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

### `POST /clientes`

Registrar un nuevo cliente.

**Roles requeridos:** `cajero`, `gerente`, `admin`, `super_admin`

**Request:**
```json
{
  "nombre": "Carlos Ramírez Vega",
  "email": "cramirez@email.com",
  "telefono": "555-987-6543",
  "fecha_nacimiento": "1990-07-22",
  "direccion": "Calle Morelos 123, Col. Centro"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 301,
    "nombre": "Carlos Ramírez Vega",
    "email": "cramirez@email.com",
    ...
    "puntos_acumulados": 0,
    "created_at": "2024-01-15T11:15:00.000Z"
  }
}
```

---

### `GET /clientes/:id`

Obtener el perfil completo de un cliente.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "nombre": "María García López",
    "email": "mgarcia@email.com",
    "telefono": "555-123-4567",
    "puntos_acumulados": 1250,
    "historial_compras": [
      {
        "id": 1001,
        "folio": "VTA-2024-001001",
        "fecha": "2024-01-15T10:30:00.000Z",
        "total": 285.50
      }
    ]
  }
}
```

---

## Empleados

### `GET /empleados`

Listar empleados.

**Roles requeridos:** `gerente`, `admin`, `super_admin`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "nombre": "Juan Pérez Martínez",
      "email": "jperez@drsimi.com",
      "rol": "cajero",
      "sucursal_id": 1,
      "sucursal_nombre": "Sucursal Centro",
      "telefono": "555-111-2222",
      "fecha_contratacion": "2022-06-01",
      "activo": true
    }
  ],
  "pagination": { ... }
}
```

---

### `POST /empleados`

Registrar un nuevo empleado (crea también el usuario del sistema).

**Roles requeridos:** `admin`, `super_admin`

**Request:**
```json
{
  "nombre": "Ana Martínez Soto",
  "email": "amartinez@drsimi.com",
  "password": "TempPass123!",
  "rol": "cajero",
  "sucursal_id": 2,
  "telefono": "555-333-4444",
  "fecha_contratacion": "2024-01-15",
  "curp": "MASA900101MDFRRN00"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 25,
    "nombre": "Ana Martínez Soto",
    "email": "amartinez@drsimi.com",
    "rol": "cajero",
    "sucursal_id": 2,
    "activo": true,
    "created_at": "2024-01-15T11:30:00.000Z"
  }
}
```

---

### `PUT /empleados/:id`

Actualizar datos de un empleado.

**Roles requeridos:** `admin`, `super_admin`

---

### `DELETE /empleados/:id`

Desactivar un empleado (baja lógica, no elimina el registro).

**Roles requeridos:** `admin`, `super_admin`

---

## Sucursales

### `GET /sucursales`

Listar todas las sucursales.

**Roles requeridos:** `admin`, `super_admin`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Sucursal Centro",
      "direccion": "Av. Insurgentes 500, Col. Centro, CDMX",
      "telefono": "55-5555-1111",
      "responsable_id": 10,
      "responsable_nombre": "Laura Gómez",
      "activa": true,
      "ultima_sincronizacion": "2024-01-15T10:29:30.000Z",
      "sync_status": "ok"
    }
  ]
}
```

---

## Sincronización

### `GET /sync/status`

Obtener el estado actual del daemon de sincronización.

**Response 200:**
```json
{
  "success": true,
  "daemon_running": true,
  "sucursal_id": 1,
  "last_sync_at": "2024-01-15T10:29:30.000Z",
  "next_sync_in_seconds": 15,
  "pending_changes": 3,
  "sync_errors_today": 0,
  "status": "idle"
}
```

---

### `POST /sync/force`

Forzar una sincronización inmediata (no esperar el intervalo).

**Roles requeridos:** `admin`, `super_admin`

**Response 200:**
```json
{
  "success": true,
  "message": "Sincronización iniciada",
  "sync_id": "sync-20240115-103000-001"
}
```

---

### `GET /sync/logs`

Obtener el historial de sincronizaciones.

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `page` | number | Página |
| `limit` | number | Resultados por página |
| `sucursal_id` | number | Filtrar por sucursal |
| `status` | string | `success`, `error`, `partial` |
| `fecha_inicio` | date | Desde fecha |
| `fecha_fin` | date | Hasta fecha |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "sync-20240115-103000-001",
      "sucursal_id": 1,
      "iniciada_at": "2024-01-15T10:30:00.000Z",
      "completada_at": "2024-01-15T10:30:02.345Z",
      "duracion_ms": 2345,
      "registros_enviados": 3,
      "registros_recibidos": 1,
      "conflictos": 0,
      "status": "success"
    }
  ],
  "pagination": { ... }
}
```

---

## Reportes

### `GET /reportes/ventas-diarias`

Reporte de ventas del día (o fecha especificada).

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `fecha` | date | Fecha del reporte (default: hoy) |
| `sucursal_id` | number | Filtrar por sucursal |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "fecha": "2024-01-15",
    "sucursal_id": 1,
    "sucursal_nombre": "Sucursal Centro",
    "total_ventas": 48,
    "monto_total": 12350.75,
    "monto_efectivo": 8200.00,
    "monto_tarjeta": 4150.75,
    "ticket_promedio": 257.31,
    "top_productos": [
      {
        "producto_id": 101,
        "nombre": "Paracetamol 500mg",
        "unidades_vendidas": 45,
        "monto_total": 2025.00
      }
    ]
  }
}
```

---

### `GET /reportes/inventario`

Reporte de inventario actual.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "sucursal_id": 1,
    "total_productos": 480,
    "productos_stock_bajo": 12,
    "productos_agotados": 3,
    "valor_inventario": 145230.50,
    "alertas": [
      {
        "producto_id": 205,
        "nombre": "Vitamina C 1000mg",
        "stock_actual": 8,
        "stock_minimo": 20
      }
    ]
  }
}
```

---

## Códigos de Error

| Código HTTP | Código de Error | Descripción |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Datos de entrada inválidos |
| 401 | `UNAUTHORIZED` | Token JWT inválido o expirado |
| 403 | `FORBIDDEN` | Sin permiso para este recurso |
| 404 | `NOT_FOUND` | Recurso no encontrado |
| 409 | `CONFLICT` | Conflicto (ej: email ya registrado) |
| 422 | `UNPROCESSABLE` | Datos válidos pero imposibles de procesar |
| 429 | `RATE_LIMITED` | Demasiadas solicitudes |
| 500 | `INTERNAL_ERROR` | Error interno del servidor |
| 503 | `DB_UNAVAILABLE` | Base de datos no disponible |

**Formato de error estándar:**

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "El campo 'email' no es válido",
  "details": [
    {
      "field": "email",
      "message": "Debe ser un email válido"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "request_id": "req-abc123"
}
```

---

## Límites de la API

| Endpoint | Límite |
|---|---|
| `POST /auth/login` | 5 intentos por IP cada 15 minutos |
| Endpoints generales | 100 solicitudes por minuto por usuario |
| `POST /sync/*` | 10 solicitudes por minuto por sucursal |
| Descarga de reportes | 5 por minuto por usuario |
