# 📐 Diagrama Entidad-Relación

Sistema de Base de Datos Distribuida para Farmacia

---

## Diagrama ER Completo (Notación Textual)

```
┌─────────────────────┐
│    PRODUCTOS        │ ◄─────┐
│─────────────────────│       │
│ PK id_producto      │       │
│    codigo_barras*   │       │
│    nombre           │       │
│    descripcion      │       │
│    categoria        │       │
│    precio_venta     │       │
│    precio_compra    │       │
│    requiere_receta  │       │
│    sustancia_activa │       │
│    laboratorio      │       │
│    presentacion     │       │
│    estado           │       │
└─────────────────────┘       │
         │                    │
         │ 1                  │
         │                    │ N
         │ N                  │
         ▼                    │
┌─────────────────────┐       │
│   INVENTARIO        │       │
│─────────────────────│       │
│ PK id_inventario    │       │
│ FK id_producto      ├───────┘
│ FK id_sucursal      ├───────┐
│    cantidad_disp    │       │
│    cantidad_minima  │       │
│    cantidad_maxima  │       │
│    lote             │       │
│    fecha_caducidad  │       │
│    ubicacion_fisica │       │
│    estado           │       │
└─────────────────────┘       │
         │                    │
         │ 1                  │
         │                    │ 1
         │ N                  │
         ▼                    │
┌─────────────────────┐       │
│ MOVIMIENTOS_INV     │       │
│─────────────────────│       │
│ PK id_movimiento    │       │
│ FK id_producto      │       │
│ FK id_sucursal      │       │
│ FK id_empleado      │       │
│    tipo_movimiento  │       │
│    cantidad         │       │
│    referencia_id    │       │
│    lote             │       │
│    observaciones    │       │
└─────────────────────┘       │
                              │
                              │
                              ▼
         ┌─────────────────────┐
         │    SUCURSALES       │
         │─────────────────────│
         │ PK id_sucursal      │
         │    codigo_sucursal* │
         │    nombre           │
         │    direccion        │
         │    ciudad           │
         │    telefono         │
         │    servidor_bd      │
         │    estado_sucursal  │
         └─────────────────────┘
                  │
                  │ 1
                  │
                  │ N
                  ▼
         ┌─────────────────────┐
         │    EMPLEADOS        │ ◄─────┐
         │─────────────────────│       │
         │ PK id_empleado      │       │
         │ FK id_sucursal      │       │
         │    numero_empleado* │       │
         │    nombre           │       │
         │    apellido_paterno │       │
         │    puesto           │       │
         │    usuario*         │       │
         │    password_hash    │       │
         │    rol              │       │
         │    estado           │       │
         └─────────────────────┘       │
                  │                    │
                  │                    │
                  │                    │
                  │                    │ 1
                  │ 1                  │
                  │                    │ N
                  │ N                  │
                  ▼                    │
         ┌─────────────────────┐       │
         │      VENTAS         │       │
         │─────────────────────│       │
         │ PK id_venta         │       │
         │    folio_venta*     │       │
         │ FK id_sucursal      │       │
         │ FK id_cliente       │       │
         │ FK id_empleado      ├───────┘
         │    fecha_venta      │
         │    subtotal         │
         │    descuento        │
         │    impuestos        │
         │    total            │
         │    metodo_pago      │
         │    receta_medica    │
         │    estado           │
         └─────────────────────┘
                  │
                  │ 1
                  │
                  │ N
                  ▼
         ┌─────────────────────┐
         │   DETALLE_VENTA     │
         │─────────────────────│
         │ PK id_detalle       │
         │ FK id_venta         │
         │ FK id_producto      ├───────┐
         │    cantidad         │       │
         │    precio_unitario  │       │
         │    descuento_linea  │       │
         │    subtotal_linea   │       │
         │    lote             │       │
         └─────────────────────┘       │
                                       │
                                       │ N
                                       │
                                       │ 1
                                       │
                                       ▼
                           ┌─────────────────────┐
                           │    PRODUCTOS        │
                           │  (ver arriba)       │
                           └─────────────────────┘


┌─────────────────────┐
│    CLIENTES         │
│─────────────────────│
│ PK id_cliente       │
│    numero_cliente*  │
│    nombre           │
│    apellido_paterno │
│    telefono         │
│    email            │
│    puntos_acumulados│
│ FK sucursal_registro│
│    estado           │
└─────────────────────┘
         │
         │ 1
         │
         │ N
         ▼
┌─────────────────────┐
│      VENTAS         │
│  (ver arriba)       │
└─────────────────────┘


┌─────────────────────┐
│   PROVEEDORES       │ ◄─────┐
│─────────────────────│       │
│ PK id_proveedor     │       │
│    razon_social     │       │
│    rfc*             │       │
│    telefono         │       │
│    email            │       │
│    direccion        │       │
│    dias_credito     │       │
│    estado           │       │
└─────────────────────┘       │
         │                    │
         │ 1                  │
         │                    │ 1
         │ N                  │
         ▼                    │
┌─────────────────────┐       │
│      COMPRAS        │       │
│─────────────────────│       │
│ PK id_compra        │       │
│    folio_compra*    │       │
│ FK id_sucursal      │       │
│ FK id_proveedor     ├───────┘
│ FK id_empleado      │
│    fecha_compra     │
│    fecha_recepcion  │
│    subtotal         │
│    impuestos        │
│    total            │
│    factura_proveedor│
│    estado           │
└─────────────────────┘
         │
         │ 1
         │
         │ N
         ▼
┌─────────────────────┐
│  DETALLE_COMPRA     │
│─────────────────────│
│ PK id_detalle       │
│ FK id_compra        │
│ FK id_producto      ├───────┐
│    cantidad_solicit │       │
│    cantidad_recibida│       │
│    precio_unitario  │       │
│    subtotal_linea   │       │
│    lote             │       │
│    fecha_caducidad  │       │
└─────────────────────┘       │
                              │ N
                              │
                              │ 1
                              │
                              ▼
                  ┌─────────────────────┐
                  │    PRODUCTOS        │
                  │  (ver arriba)       │
                  └─────────────────────┘
```

---

## Leyenda

- **PK** = Clave Primaria (Primary Key)
- **FK** = Clave Foránea (Foreign Key)
- **\*** = Clave Única (Unique)
- **1** = Uno (Cardinalidad)
- **N** = Muchos (Cardinalidad)
- **◄──** = Relación Uno a Muchos
- **──►** = Dirección de la relación

---

## Relaciones Principales

### 1. PRODUCTOS ↔ INVENTARIO
- **Tipo**: Uno a Muchos (1:N)
- **Descripción**: Un producto puede estar en el inventario de múltiples sucursales
- **Clave Foránea**: `inventario.id_producto` → `productos.id_producto`

### 2. SUCURSALES ↔ INVENTARIO
- **Tipo**: Uno a Muchos (1:N)
- **Descripción**: Una sucursal tiene múltiples productos en inventario
- **Clave Foránea**: `inventario.id_sucursal` → `sucursales.id_sucursal`

### 3. SUCURSALES ↔ EMPLEADOS
- **Tipo**: Uno a Muchos (1:N)
- **Descripción**: Una sucursal tiene múltiples empleados
- **Clave Foránea**: `empleados.id_sucursal` → `sucursales.id_sucursal`

### 4. EMPLEADOS ↔ VENTAS
- **Tipo**: Uno a Muchos (1:N)
- **Descripción**: Un empleado puede realizar múltiples ventas
- **Clave Foránea**: `ventas.id_empleado` → `empleados.id_empleado`

### 5. CLIENTES ↔ VENTAS
- **Tipo**: Uno a Muchos (1:N)
- **Descripción**: Un cliente puede tener múltiples ventas
- **Clave Foránea**: `ventas.id_cliente` → `clientes.id_cliente`

### 6. VENTAS ↔ DETALLE_VENTA
- **Tipo**: Uno a Muchos (1:N)
- **Descripción**: Una venta tiene múltiples líneas de detalle
- **Clave Foránea**: `detalle_venta.id_venta` → `ventas.id_venta`

### 7. PRODUCTOS ↔ DETALLE_VENTA
- **Tipo**: Uno a Muchos (1:N)
- **Descripción**: Un producto puede aparecer en múltiples detalles de venta
- **Clave Foránea**: `detalle_venta.id_producto` → `productos.id_producto`

### 8. PROVEEDORES ↔ COMPRAS
- **Tipo**: Uno a Muchos (1:N)
- **Descripción**: Un proveedor puede tener múltiples compras
- **Clave Foránea**: `compras.id_proveedor` → `proveedores.id_proveedor`

### 9. COMPRAS ↔ DETALLE_COMPRA
- **Tipo**: Uno a Muchos (1:N)
- **Descripción**: Una compra tiene múltiples líneas de detalle
- **Clave Foránea**: `detalle_compra.id_compra` → `compras.id_compra`

### 10. PRODUCTOS ↔ DETALLE_COMPRA
- **Tipo**: Uno a Muchos (1:N)
- **Descripción**: Un producto puede aparecer en múltiples detalles de compra
- **Clave Foránea**: `detalle_compra.id_producto` → `productos.id_producto`

---

## Tablas de Cache Local

### PRODUCTOS_LOCAL
- **Origen**: Replica de `productos` (BD Central)
- **Propósito**: Cache para operación offline
- **Sincronización**: Pull cada 5 minutos

### CLIENTES_LOCAL
- **Origen**: Replica de `clientes` (BD Central)
- **Propósito**: Cache para operación offline
- **Sincronización**: Pull cada 5 minutos

---

## Restricciones de Integridad Referencial

### ON DELETE CASCADE
- `detalle_venta` → Si se elimina una venta, se eliminan sus detalles
- `detalle_compra` → Si se elimina una compra, se eliminan sus detalles

### ON DELETE RESTRICT
- `productos` → No se puede eliminar si tiene ventas o inventario asociado
- `empleados` → No se puede eliminar si tiene ventas asociadas
- `clientes` → No se puede eliminar si tiene ventas asociadas

---

## Índices Importantes

```sql
-- Productos
CREATE INDEX idx_codigo_barras ON productos(codigo_barras);
CREATE INDEX idx_categoria ON productos(categoria);

-- Inventario
CREATE INDEX idx_producto ON inventario(id_producto);
CREATE INDEX idx_sucursal ON inventario(id_sucursal);
CREATE INDEX idx_estado ON inventario(estado);

-- Ventas
CREATE INDEX idx_fecha ON ventas(fecha_venta);
CREATE INDEX idx_cliente ON ventas(id_cliente);
CREATE INDEX idx_empleado ON ventas(id_empleado);
CREATE INDEX idx_sincronizado ON ventas(sincronizado);

-- Clientes
CREATE INDEX idx_telefono ON clientes(telefono);
CREATE INDEX idx_email ON clientes(email);
```

---

## Normalización

### Primera Forma Normal (1FN)
✅ Todos los atributos son atómicos  
✅ No hay grupos repetitivos  
✅ Cada columna tiene un único tipo de dato  

### Segunda Forma Normal (2FN)
✅ Cumple 1FN  
✅ Todos los atributos no-clave dependen completamente de la clave primaria  
✅ Ejemplo: `detalle_venta` tiene clave compuesta lógica (id_venta + id_producto)  

### Tercera Forma Normal (3FN)
✅ Cumple 2FN  
✅ No existen dependencias transitivas  
✅ Ejemplo: Datos del cliente están en tabla `clientes`, no en `ventas`  

### Forma Normal de Boyce-Codd (BCNF)
✅ Cumple 3FN  
✅ Toda dependencia funcional tiene como determinante una superclave  
✅ Las tablas están correctamente diseñadas sin anomalías  

---

## Distribución de Tablas

### Servidor Central
```
✓ productos
✓ proveedores
✓ empleados
✓ clientes (consolidado)
✓ sucursales
✓ log_sincronizacion
```

### Servidor Local (cada sucursal)
```
✓ inventario
✓ ventas
✓ detalle_venta
✓ compras
✓ detalle_compra
✓ movimientos_inventario
✓ caja
✓ productos_local (cache)
✓ clientes_local (cache)
```

---

Este diagrama ER representa la estructura completa de la base de datos distribuida, mostrando todas las entidades, relaciones y cardinalidades del sistema.
