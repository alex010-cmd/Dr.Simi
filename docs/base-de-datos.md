# 🗄️ Base de Datos — Dr. Simi

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Base de Datos Central (db_central)](#base-de-datos-central-db_central)
- [Base de Datos Local (db_local_<sucursal>)](#base-de-datos-local-db_local_sucursal)
- [Tablas de Sincronización](#tablas-de-sincronización)
- [Índices y Optimización](#índices-y-optimización)
- [Modelo Entidad-Relación](#modelo-entidad-relación)
- [Convenciones](#convenciones)

---

## Visión General

El sistema utiliza **dos instancias MySQL** con esquemas relacionados pero diferenciados:

| Base de Datos | Instancia | Propósito |
|---|---|---|
| `db_central` | Servidor central | Catálogo maestro, historial consolidado, configuraciones globales |
| `db_local_<id>` | Cada sucursal | Operaciones diarias autónomas, caché del catálogo |

**Versión MySQL requerida:** 8.0+  
**Charset:** `utf8mb4`  
**Collation:** `utf8mb4_unicode_ci`

---

## Base de Datos Central (`db_central`)

### Tabla: `sucursales`

Registro de todas las sucursales de la cadena.

```sql
CREATE TABLE sucursales (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(100)    NOT NULL,
  codigo          VARCHAR(20)     NOT NULL UNIQUE,   -- Ej: SUC-001
  direccion       VARCHAR(255)    NOT NULL,
  ciudad          VARCHAR(100)    NOT NULL,
  estado          VARCHAR(100)    NOT NULL,
  cp              VARCHAR(10),
  telefono        VARCHAR(20),
  email           VARCHAR(150),
  responsable_id  INT UNSIGNED,
  activa          BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_activa (activa),
  INDEX idx_codigo (codigo)
) ENGINE=InnoDB;
```

---

### Tabla: `usuarios`

Empleados con acceso al sistema.

```sql
CREATE TABLE usuarios (
  id                INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(150)    NOT NULL,
  email             VARCHAR(150)    NOT NULL UNIQUE,
  password_hash     VARCHAR(255)    NOT NULL,   -- bcrypt hash
  rol               ENUM(
                      'super_admin',
                      'admin',
                      'gerente',
                      'cajero',
                      'almacenista'
                    )               NOT NULL DEFAULT 'cajero',
  sucursal_id       INT UNSIGNED,               -- NULL = acceso a todas
  telefono          VARCHAR(20),
  curp              VARCHAR(18)     UNIQUE,
  fecha_contratacion DATE,
  activo            BOOLEAN         NOT NULL DEFAULT TRUE,
  ultimo_acceso     DATETIME,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL,
  INDEX idx_email (email),
  INDEX idx_rol (rol),
  INDEX idx_sucursal (sucursal_id)
) ENGINE=InnoDB;
```

---

### Tabla: `categorias`

Categorías del catálogo de productos.

```sql
CREATE TABLE categorias (
  id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100)    NOT NULL UNIQUE,
  descripcion TEXT,
  activa      BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

---

### Tabla: `proveedores`

Proveedores de productos.

```sql
CREATE TABLE proveedores (
  id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(150)    NOT NULL,
  rfc         VARCHAR(13)     UNIQUE,
  email       VARCHAR(150),
  telefono    VARCHAR(20),
  direccion   VARCHAR(255),
  contacto    VARCHAR(150),
  activo      BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

---

### Tabla: `productos`

Catálogo maestro de productos (fuente de verdad).

```sql
CREATE TABLE productos (
  id                  INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  codigo_barras       VARCHAR(50)     UNIQUE,
  sku                 VARCHAR(50)     UNIQUE,
  nombre              VARCHAR(200)    NOT NULL,
  descripcion         TEXT,
  categoria_id        INT UNSIGNED    NOT NULL,
  proveedor_id        INT UNSIGNED,
  precio_compra       DECIMAL(10,2)   NOT NULL DEFAULT 0,
  precio_venta        DECIMAL(10,2)   NOT NULL,
  precio_mayoreo      DECIMAL(10,2),
  iva_porcentaje      DECIMAL(5,2)    NOT NULL DEFAULT 16.00,
  unidad              VARCHAR(50)     NOT NULL DEFAULT 'pieza',
  requiere_receta     BOOLEAN         NOT NULL DEFAULT FALSE,
  controlado          BOOLEAN         NOT NULL DEFAULT FALSE,  -- medicamento controlado
  imagen_url          VARCHAR(500),
  activo              BOOLEAN         NOT NULL DEFAULT TRUE,
  version             INT UNSIGNED    NOT NULL DEFAULT 1,      -- para sincronización
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
  INDEX idx_codigo_barras (codigo_barras),
  INDEX idx_sku (sku),
  INDEX idx_categoria (categoria_id),
  INDEX idx_activo (activo),
  FULLTEXT INDEX ft_nombre_descripcion (nombre, descripcion)
) ENGINE=InnoDB;
```

---

### Tabla: `clientes`

Clientes registrados en el programa de lealtad.

```sql
CREATE TABLE clientes (
  id                  INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  nombre              VARCHAR(150)    NOT NULL,
  email               VARCHAR(150)    UNIQUE,
  telefono            VARCHAR(20),
  fecha_nacimiento    DATE,
  sexo                ENUM('M','F','O'),
  direccion           VARCHAR(255),
  curp                VARCHAR(18)     UNIQUE,
  puntos_acumulados   INT UNSIGNED    NOT NULL DEFAULT 0,
  activo              BOOLEAN         NOT NULL DEFAULT TRUE,
  version             INT UNSIGNED    NOT NULL DEFAULT 1,
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_telefono (telefono),
  FULLTEXT INDEX ft_nombre (nombre)
) ENGINE=InnoDB;
```

---

### Tabla: `ventas_central`

Historial consolidado de ventas de todas las sucursales.

```sql
CREATE TABLE ventas_central (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  folio           VARCHAR(30)     NOT NULL UNIQUE,  -- VTA-YYYY-NNNNNN
  sucursal_id     INT UNSIGNED    NOT NULL,
  cajero_id       INT UNSIGNED    NOT NULL,
  cliente_id      INT UNSIGNED,
  fecha           DATETIME        NOT NULL,
  subtotal        DECIMAL(12,2)   NOT NULL,
  iva             DECIMAL(12,2)   NOT NULL DEFAULT 0,
  descuento       DECIMAL(12,2)   NOT NULL DEFAULT 0,
  total           DECIMAL(12,2)   NOT NULL,
  forma_pago      ENUM('efectivo','tarjeta_debito','tarjeta_credito','transferencia','otro') NOT NULL,
  status          ENUM('completada','cancelada','devuelta')   NOT NULL DEFAULT 'completada',
  local_id        BIGINT UNSIGNED NOT NULL,  -- ID original en BD local
  sync_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at      DATETIME        NOT NULL,  -- fecha original de la venta

  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
  INDEX idx_sucursal_fecha (sucursal_id, fecha),
  INDEX idx_cajero (cajero_id),
  INDEX idx_cliente (cliente_id),
  INDEX idx_fecha (fecha),
  INDEX idx_folio (folio)
) ENGINE=InnoDB;
```

---

### Tabla: `ventas_central_items`

Detalle de productos en cada venta.

```sql
CREATE TABLE ventas_central_items (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venta_id        BIGINT UNSIGNED NOT NULL,
  producto_id     INT UNSIGNED    NOT NULL,
  cantidad        DECIMAL(10,3)   NOT NULL,
  precio_unitario DECIMAL(10,2)   NOT NULL,
  descuento       DECIMAL(10,2)   NOT NULL DEFAULT 0,
  subtotal        DECIMAL(12,2)   NOT NULL,

  FOREIGN KEY (venta_id) REFERENCES ventas_central(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  INDEX idx_venta (venta_id),
  INDEX idx_producto (producto_id)
) ENGINE=InnoDB;
```

---

### Tabla: `inventario_central`

Stock por sucursal (vista consolidada).

```sql
CREATE TABLE inventario_central (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  sucursal_id     INT UNSIGNED    NOT NULL,
  producto_id     INT UNSIGNED    NOT NULL,
  stock_actual    DECIMAL(10,3)   NOT NULL DEFAULT 0,
  stock_minimo    DECIMAL(10,3)   NOT NULL DEFAULT 0,
  stock_maximo    DECIMAL(10,3),
  ultimo_movimiento DATETIME,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  UNIQUE KEY uq_sucursal_producto (sucursal_id, producto_id),
  INDEX idx_stock_bajo (stock_actual, stock_minimo)
) ENGINE=InnoDB;
```

---

## Base de Datos Local (`db_local_<sucursal>`)

Contiene tablas similares a la central, pero adaptadas para operación local.

### Tabla: `productos_local`

Caché del catálogo central de productos.

```sql
CREATE TABLE productos_local (
  id              INT UNSIGNED    PRIMARY KEY,  -- Mismo ID que en central
  codigo_barras   VARCHAR(50)     UNIQUE,
  nombre          VARCHAR(200)    NOT NULL,
  categoria       VARCHAR(100),
  precio_venta    DECIMAL(10,2)   NOT NULL,
  iva_porcentaje  DECIMAL(5,2)    NOT NULL DEFAULT 16.00,
  unidad          VARCHAR(50)     NOT NULL DEFAULT 'pieza',
  requiere_receta BOOLEAN         NOT NULL DEFAULT FALSE,
  activo          BOOLEAN         NOT NULL DEFAULT TRUE,
  version_central INT UNSIGNED    NOT NULL DEFAULT 1,
  synced_at       DATETIME,

  INDEX idx_codigo_barras (codigo_barras),
  INDEX idx_activo (activo)
) ENGINE=InnoDB;
```

---

### Tabla: `inventario_local`

Stock actual en la sucursal.

```sql
CREATE TABLE inventario_local (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  producto_id     INT UNSIGNED    NOT NULL,
  stock_actual    DECIMAL(10,3)   NOT NULL DEFAULT 0,
  stock_minimo    DECIMAL(10,3)   NOT NULL DEFAULT 0,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  version         INT UNSIGNED    NOT NULL DEFAULT 1,

  FOREIGN KEY (producto_id) REFERENCES productos_local(id),
  UNIQUE KEY uq_producto (producto_id)
) ENGINE=InnoDB;
```

---

### Tabla: `ventas`

Ventas registradas en la sucursal.

```sql
CREATE TABLE ventas (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  folio           VARCHAR(30)     NOT NULL UNIQUE,
  cajero_id       INT UNSIGNED    NOT NULL,
  cliente_id      INT UNSIGNED,
  fecha           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal        DECIMAL(12,2)   NOT NULL,
  iva             DECIMAL(12,2)   NOT NULL DEFAULT 0,
  descuento       DECIMAL(12,2)   NOT NULL DEFAULT 0,
  total           DECIMAL(12,2)   NOT NULL,
  forma_pago      ENUM('efectivo','tarjeta_debito','tarjeta_credito','transferencia','otro') NOT NULL,
  status          ENUM('completada','cancelada','devuelta') NOT NULL DEFAULT 'completada',
  synced          BOOLEAN         NOT NULL DEFAULT FALSE,
  synced_at       DATETIME,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_fecha (fecha),
  INDEX idx_cajero (cajero_id),
  INDEX idx_synced (synced)
) ENGINE=InnoDB;
```

---

### Tabla: `ventas_items`

```sql
CREATE TABLE ventas_items (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venta_id        BIGINT UNSIGNED NOT NULL,
  producto_id     INT UNSIGNED    NOT NULL,
  cantidad        DECIMAL(10,3)   NOT NULL,
  precio_unitario DECIMAL(10,2)   NOT NULL,
  descuento       DECIMAL(10,2)   NOT NULL DEFAULT 0,
  subtotal        DECIMAL(12,2)   NOT NULL,

  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  INDEX idx_venta (venta_id),
  INDEX idx_producto (producto_id)
) ENGINE=InnoDB;
```

---

### Tabla: `movimientos_inventario`

Registro de todos los movimientos de stock.

```sql
CREATE TABLE movimientos_inventario (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  producto_id INT UNSIGNED    NOT NULL,
  tipo        ENUM(
                'venta',
                'entrada',
                'salida',
                'ajuste_positivo',
                'ajuste_negativo',
                'transferencia_entrada',
                'transferencia_salida',
                'devolucion'
              )               NOT NULL,
  cantidad    DECIMAL(10,3)   NOT NULL,
  stock_antes DECIMAL(10,3)   NOT NULL,
  stock_despues DECIMAL(10,3) NOT NULL,
  referencia  VARCHAR(50),    -- Folio de venta, OC, etc.
  motivo      TEXT,
  usuario_id  INT UNSIGNED    NOT NULL,
  fecha       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  synced      BOOLEAN         NOT NULL DEFAULT FALSE,

  FOREIGN KEY (producto_id) REFERENCES productos_local(id),
  INDEX idx_producto_fecha (producto_id, fecha),
  INDEX idx_tipo (tipo),
  INDEX idx_synced (synced)
) ENGINE=InnoDB;
```

---

## Tablas de Sincronización

### `sync_queue` (en BD local)

Cola de cambios pendientes de enviar al servidor central.

```sql
CREATE TABLE sync_queue (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_type     VARCHAR(50)     NOT NULL,  -- 'venta', 'cliente', 'movimiento'
  entity_id       BIGINT UNSIGNED NOT NULL,
  operation       ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  payload         JSON            NOT NULL,  -- Datos completos del registro
  status          ENUM('PENDING','IN_PROGRESS','DONE','FAILED') NOT NULL DEFAULT 'PENDING',
  attempts        TINYINT UNSIGNED NOT NULL DEFAULT 0,
  last_error      TEXT,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at    DATETIME,

  INDEX idx_status (status),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;
```

---

### `sync_log` (en BD central)

Historial de sincronizaciones recibidas.

```sql
CREATE TABLE sync_log (
  id                  VARCHAR(50)     PRIMARY KEY,  -- sync-YYYYMMDD-HHMMSS-NNN
  sucursal_id         INT UNSIGNED    NOT NULL,
  iniciada_at         DATETIME        NOT NULL,
  completada_at       DATETIME,
  duracion_ms         INT UNSIGNED,
  registros_enviados  INT UNSIGNED    NOT NULL DEFAULT 0,
  registros_recibidos INT UNSIGNED    NOT NULL DEFAULT 0,
  conflictos          INT UNSIGNED    NOT NULL DEFAULT 0,
  status              ENUM('running','success','partial','error') NOT NULL DEFAULT 'running',
  error_detail        TEXT,

  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
  INDEX idx_sucursal_fecha (sucursal_id, iniciada_at),
  INDEX idx_status (status)
) ENGINE=InnoDB;
```

---

## Índices y Optimización

### Índices críticos para el rendimiento

```sql
-- Para reportes de ventas por período
CREATE INDEX idx_ventas_fecha_sucursal ON ventas_central (fecha, sucursal_id);

-- Para búsqueda de productos en el punto de venta
CREATE FULLTEXT INDEX ft_productos_nombre ON productos (nombre, descripcion);

-- Para alertas de stock bajo
CREATE INDEX idx_inventario_stock ON inventario_central (sucursal_id, stock_actual, stock_minimo);

-- Para la cola de sincronización
CREATE INDEX idx_sync_queue_pending ON sync_queue (status, created_at)
  WHERE status = 'PENDING';
```

### Particionamiento recomendado (producción)

Para tablas de alto volumen como `ventas_central`, se recomienda particionamiento por rango de fecha:

```sql
ALTER TABLE ventas_central
PARTITION BY RANGE (YEAR(fecha)) (
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

---

## Modelo Entidad-Relación

```
CENTRAL:
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  sucursales  │──1:N──│ inventario   │──N:1──│  productos   │
└──────────────┘       │   _central   │       └──────────────┘
       │               └──────────────┘              │ N:1
       │                                       ┌─────────────┐
       │ 1:N                                   │  categorias │
┌──────────────┐                               └─────────────┘
│   usuarios   │──1:N──┌──────────────┐
└──────────────┘       │ventas_central│──N:1──┌──────────────┐
                       └──────────────┘       │   clientes   │
                              │               └──────────────┘
                              │ 1:N
                       ┌──────────────┐
                       │ventas_central│
                       │   _items     │
                       └──────────────┘

LOCAL (por sucursal):
┌──────────────┐       ┌──────────────┐
│ inventario   │──N:1──│productos_local│
│   _local     │       └──────────────┘
└──────────────┘
                       ┌──────────────┐       ┌──────────────┐
                       │   ventas     │──N:1──│ventas_items  │
                       └──────────────┘       └──────────────┘
                              │
                       ┌──────────────┐
                       │ sync_queue   │
                       └──────────────┘
```

---

## Convenciones

| Convención | Detalle |
|---|---|
| **Nombres de tabla** | `snake_case`, plural |
| **Nombres de columna** | `snake_case` |
| **Claves primarias** | Siempre `id`, tipo `INT UNSIGNED AUTO_INCREMENT` (o `BIGINT` para tablas de alto volumen) |
| **Claves foráneas** | `{tabla_referenciada_singular}_id` (ej: `sucursal_id`) |
| **Timestamps** | `created_at` y `updated_at` en todas las tablas |
| **Booleans** | `BOOLEAN` con nombre afirmativo (ej: `activo`, `synced`) |
| **Decimales monetarios** | `DECIMAL(12,2)` para totales, `DECIMAL(10,2)` para precios unitarios |
| **ENUMs** | Para campos con valores predefinidos y estables |
| **Soft delete** | Campo `activo BOOLEAN` en lugar de eliminar registros |
| **Textos largos** | `TEXT` para descripciones, `JSON` para payloads de sincronización |
