# 🔄 Servicio de Sincronización — Dr. Simi

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Arquitectura del Daemon](#arquitectura-del-daemon)
- [Ciclo de Sincronización](#ciclo-de-sincronización)
- [Cola de Cambios (sync_queue)](#cola-de-cambios-sync_queue)
- [Protocolo de Sincronización](#protocolo-de-sincronización)
- [Resolución de Conflictos](#resolución-de-conflictos)
- [Manejo de Errores y Reintentos](#manejo-de-errores-y-reintentos)
- [Configuración del Daemon](#configuración-del-daemon)
- [Monitoreo y Logs](#monitoreo-y-logs)
- [Tablas Sincronizadas](#tablas-sincronizadas)

---

## Visión General

El **daemon de sincronización** es un proceso Node.js independiente que se ejecuta en cada sucursal. Su función es mantener la coherencia de datos entre la base de datos local de la sucursal y la base de datos central del servidor.

### Principios de diseño

1. **Idempotencia:** Cada operación de sincronización puede ejecutarse múltiples veces sin efectos secundarios.
2. **Tolerancia a fallos:** Si la central no está disponible, el daemon almacena los cambios localmente y reintenta cuando la conexión se restaura.
3. **Mínimo impacto:** Las operaciones de sincronización son transaccionales y no bloquean las operaciones del punto de venta.
4. **Auditoría completa:** Cada sincronización queda registrada con detalle en `sync_log`.

---

## Arquitectura del Daemon

```
┌────────────────────────────────────────────────────────────┐
│                    DAEMON DE SINCRONIZACIÓN                 │
│                                                            │
│  ┌─────────────────┐    ┌──────────────────────────────┐  │
│  │  Scheduler      │    │  Sync Manager                │  │
│  │  (setInterval)  │───►│  - orchestrateSync()         │  │
│  └─────────────────┘    │  - handlePushPhase()         │  │
│                         │  - handlePullPhase()         │  │
│  ┌─────────────────┐    └──────────┬───────────────────┘  │
│  │  Health Monitor │               │                       │
│  │  - checkCentral │    ┌──────────▼───────────────────┐  │
│  │  - checkLocal   │    │  HTTP Client (Axios)          │  │
│  └─────────────────┘    │  - POST /sync/push            │  │
│                         │  - GET  /sync/pull            │  │
│  ┌─────────────────┐    └──────────┬───────────────────┘  │
│  │  Logger         │               │                       │
│  │  (Winston)      │    ┌──────────▼───────────────────┐  │
│  └─────────────────┘    │  Conflict Resolver            │  │
│                         │  - lastWriteWins()            │  │
│                         │  - applyDelta()               │  │
│                         └──────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
         │ MySQL queries              │ MySQL queries
         ▼                           ▼
   [DB Local]                  [API Central]
   sync_queue                       │
                                    ▼
                              [DB Central]
                              sync_log
```

---

## Ciclo de Sincronización

Cada ciclo se ejecuta en el intervalo configurado (`SYNC_INTERVAL_MS`, default: 30 segundos):

```
INICIO DEL CICLO
       │
       ▼
[1. VERIFICAR CONECTIVIDAD]
   ¿Central disponible?
       │
       ├─ NO → Registrar intento fallido → ESPERAR PRÓXIMO CICLO
       │
       ▼ SÍ
[2. FASE PUSH: Local → Central]
   - Leer registros PENDING de sync_queue
   - Agrupar por entity_type
   - Enviar lote a POST /api/v1/sync/push
   - Marcar como DONE los exitosos
   - Marcar como FAILED con error los fallidos
       │
       ▼
[3. FASE PULL: Central → Local]
   - Solicitar cambios desde última sincronización exitosa
   - GET /api/v1/sync/pull?since=<last_sync_timestamp>&sucursal_id=<id>
   - Aplicar cada cambio en la BD local
   - Resolver conflictos detectados
       │
       ▼
[4. REGISTRAR RESULTADO]
   - INSERT en sync_log (BD central vía API)
   - Actualizar timestamp de última sincronización
       │
       ▼
FIN DEL CICLO → ESPERAR PRÓXIMO CICLO
```

---

## Cola de Cambios (`sync_queue`)

Cada vez que se realiza una operación en la BD local que debe sincronizarse, se inserta un registro en `sync_queue`. Esto ocurre dentro de la misma transacción que la operación original.

### Ejemplo: registro de una venta

```javascript
// En ventasController.js
async function registrarVenta(req, res) {
  const conn = await db.beginTransaction();
  try {
    // 1. Insertar la venta
    const [result] = await conn.execute(
      'INSERT INTO ventas (folio, cajero_id, total, ...) VALUES (?, ?, ?, ...)',
      [folio, cajeroId, total, ...]
    );
    const ventaId = result.insertId;

    // 2. Actualizar inventario
    for (const item of items) {
      await conn.execute(
        'UPDATE inventario_local SET stock_actual = stock_actual - ? WHERE producto_id = ?',
        [item.cantidad, item.producto_id]
      );
    }

    // 3. Encolar para sincronización (misma transacción)
    await conn.execute(
      `INSERT INTO sync_queue (entity_type, entity_id, operation, payload)
       VALUES ('venta', ?, 'INSERT', ?)`,
      [ventaId, JSON.stringify({ venta, items })]
    );

    await conn.commit();
    res.status(201).json({ success: true, data: { id: ventaId, folio } });
  } catch (err) {
    await conn.rollback();
    throw err;
  }
}
```

### Estados de la cola

```
PENDING → IN_PROGRESS → DONE
                    └──→ FAILED (se reintenta hasta MAX_ATTEMPTS)
```

---

## Protocolo de Sincronización

### PUSH: Sucursal → Central

**Endpoint:** `POST /api/v1/sync/push`  
**Auth:** Token de servicio (`SYNC_SERVICE_TOKEN`)

**Request:**
```json
{
  "sucursal_id": 1,
  "batch_id": "batch-20240115-103000-001",
  "records": [
    {
      "queue_id": 501,
      "entity_type": "venta",
      "entity_id": 1002,
      "operation": "INSERT",
      "payload": {
        "folio": "VTA-2024-001002",
        "cajero_id": 3,
        "cliente_id": 42,
        "fecha": "2024-01-15T10:35:00.000Z",
        "total": 285.50,
        "items": [ ... ]
      },
      "created_at": "2024-01-15T10:35:00.000Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "batch_id": "batch-20240115-103000-001",
  "results": [
    {
      "queue_id": 501,
      "status": "accepted",
      "central_id": 10502
    }
  ],
  "processed": 1,
  "rejected": 0
}
```

---

### PULL: Central → Sucursal

**Endpoint:** `GET /api/v1/sync/pull`  
**Auth:** Token de servicio

**Query params:**
- `since` — ISO timestamp de la última sincronización exitosa
- `sucursal_id` — ID de la sucursal que solicita los cambios
- `entities` — Tipos de entidades a recibir (default: `productos,clientes`)

**Response:**
```json
{
  "success": true,
  "since": "2024-01-15T10:00:00.000Z",
  "until": "2024-01-15T10:30:00.000Z",
  "changes": [
    {
      "entity_type": "producto",
      "entity_id": 101,
      "operation": "UPDATE",
      "payload": {
        "id": 101,
        "precio_venta": 48.00,
        "version": 5,
        "updated_at": "2024-01-15T10:15:00.000Z"
      }
    }
  ],
  "total_changes": 1
}
```

---

## Resolución de Conflictos

Un conflicto ocurre cuando el mismo registro es modificado tanto en la sucursal como en la central entre dos sincronizaciones.

### Estrategia 1: Last-Write-Wins (LWW)

Estrategia por defecto. El cambio con el `updated_at` más reciente prevalece.

```javascript
function resolveConflict(localRecord, centralRecord) {
  const localTs = new Date(localRecord.updated_at).getTime();
  const centralTs = new Date(centralRecord.updated_at).getTime();

  if (centralTs > localTs) {
    return { winner: 'central', record: centralRecord };
  }
  return { winner: 'local', record: localRecord };
}
```

### Estrategia 2: Aplicación de Deltas (Inventario)

Para el inventario, en lugar de sincronizar valores absolutos, se sincronizan **las diferencias**. Esto evita conflictos al sumar/restar el delta en ambas bases de datos.

```javascript
// En lugar de: SET stock_actual = 150
// Se envía: stock_delta = -2 (se vendieron 2 unidades)

async function applyInventarioDelta(productoId, delta) {
  await db.execute(
    'UPDATE inventario_local SET stock_actual = stock_actual + ? WHERE producto_id = ?',
    [delta, productoId]
  );
}
```

### Estrategia 3: Revisión Manual

Para conflictos de alta importancia o irresolubles automáticamente (como descuentos y precios modificados simultáneamente), el sistema:

1. Aplica la versión de la central (para mantener consistencia)
2. Genera una alerta en el dashboard del administrador
3. Registra ambas versiones en `conflict_log` para revisión humana

```sql
CREATE TABLE conflict_log (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  entity_type     VARCHAR(50)     NOT NULL,
  entity_id       BIGINT UNSIGNED NOT NULL,
  sucursal_id     INT UNSIGNED    NOT NULL,
  local_payload   JSON            NOT NULL,
  central_payload JSON            NOT NULL,
  resolution      ENUM('local','central','manual') NOT NULL DEFAULT 'central',
  resolved_by     INT UNSIGNED,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at     DATETIME
) ENGINE=InnoDB;
```

---

## Manejo de Errores y Reintentos

### Política de reintentos

| Intento | Espera antes del reintento |
|---|---|
| 1° intento | inmediato |
| 2° intento | 30 segundos |
| 3° intento | 5 minutos |
| 4° intento | 30 minutos |
| 5° intento | 2 horas |
| Después del 5° | marcado como `FAILED`, alerta al administrador |

### Implementación de backoff exponencial

```javascript
function calcularEspera(intentos) {
  const baseMs = 30_000; // 30 segundos
  const maxMs = 7_200_000; // 2 horas
  const espera = Math.min(baseMs * Math.pow(2, intentos - 1), maxMs);
  // Agregar jitter para evitar thundering herd
  return espera + Math.floor(Math.random() * 5000);
}
```

### Escenarios de error

| Error | Comportamiento |
|---|---|
| Red no disponible | Esperar próximo ciclo, no marcar como FAILED |
| API central retorna 5xx | Reintento con backoff |
| API central retorna 4xx | Marcar como FAILED inmediatamente (error de datos) |
| Conflicto no resuelto | Registrar en `conflict_log`, continuar con otros registros |
| BD local no disponible | Abortar ciclo, alertar administrador |
| Timeout de red | Reintento con backoff |

---

## Configuración del Daemon

Variables de entorno relevantes para el daemon:

```env
# Identificador único de esta sucursal
SUCURSAL_ID=1

# URL del servidor central
CENTRAL_API_URL=https://central.drsimi.com

# Token de autenticación del servicio de sincronización
SYNC_SERVICE_TOKEN=token_secreto_64_caracteres_minimo

# Intervalo entre ciclos (en milisegundos)
SYNC_INTERVAL_MS=30000

# Tamaño máximo del lote push
SYNC_BATCH_SIZE=100

# Máximo de reintentos por registro
SYNC_MAX_ATTEMPTS=5

# Timeout para las peticiones HTTP (ms)
SYNC_HTTP_TIMEOUT_MS=15000

# Nivel de log del daemon
DAEMON_LOG_LEVEL=info

# Ruta de los archivos de log
DAEMON_LOG_FILE=logs/sync-daemon.log
```

### Iniciar el daemon

```bash
# Producción
node backend/sync-daemon/daemon.js

# Con PM2 (recomendado en producción)
pm2 start backend/sync-daemon/daemon.js --name "sync-daemon-suc1"
pm2 startup  # Para iniciar automáticamente con el sistema

# Con npm script
cd backend && npm run daemon
```

---

## Monitoreo y Logs

### Dashboard de sincronización

La interfaz web incluye una sección de estado del daemon accesible para administradores en `/sync-status`:

- ✅ Estado del daemon (corriendo / detenido)
- 🕐 Hora de la última sincronización exitosa
- 📊 Gráfica de sincronizaciones por hora (últimas 24h)
- ⚠️ Alertas de registros FAILED
- 📋 Historial de los últimos 100 ciclos

### Formato de logs (Winston)

```
[2024-01-15 10:30:00] INFO  sync-daemon: Iniciando ciclo #1523
[2024-01-15 10:30:00] INFO  sync-daemon: Conectividad con central: OK (45ms)
[2024-01-15 10:30:00] INFO  sync-daemon: PUSH - 3 registros pendientes
[2024-01-15 10:30:01] INFO  sync-daemon: PUSH - Enviando lote batch-20240115-103000-001
[2024-01-15 10:30:01] INFO  sync-daemon: PUSH - 3 aceptados, 0 rechazados (823ms)
[2024-01-15 10:30:01] INFO  sync-daemon: PULL - Desde 2024-01-15T10:00:00.000Z
[2024-01-15 10:30:02] INFO  sync-daemon: PULL - 1 cambio recibido y aplicado
[2024-01-15 10:30:02] INFO  sync-daemon: Ciclo #1523 completado en 2.1s
[2024-01-15 10:30:02] INFO  sync-daemon: Próximo ciclo en 30s (10:30:32)
```

---

## Tablas Sincronizadas

| Entidad | Dirección | Estrategia de conflicto | Notas |
|---|---|---|---|
| `ventas` | Local → Central | N/A (solo INSERT) | Las ventas no se modifican en la central |
| `ventas_items` | Local → Central | N/A (solo INSERT) | Asociadas a su venta |
| `movimientos_inventario` | Local → Central | Delta | Se aplican como deltas |
| `clientes` | Bidireccional | LWW por `updated_at` | Clientes pueden registrarse en cualquier sucursal |
| `productos` | Central → Local | Central siempre gana | El catálogo es propiedad de la central |
| `inventario` | Bidireccional | Delta | Crítico: siempre usar deltas |
| `usuarios` | Central → Local | Central siempre gana | Gestión centralizada de usuarios |
