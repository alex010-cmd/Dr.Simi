# 👨‍💻 Guía de Desarrollo — Dr. Simi

## Tabla de Contenidos

- [Configuración del Entorno de Desarrollo](#configuración-del-entorno-de-desarrollo)
- [Convenciones de Código](#convenciones-de-código)
- [Estructura de Commits](#estructura-de-commits)
- [Flujo de Trabajo (Git Flow)](#flujo-de-trabajo-git-flow)
- [Scripts Disponibles](#scripts-disponibles)
- [Testing](#testing)
- [Estándares de API](#estándares-de-api)
- [Guía de Frontend](#guía-de-frontend)
- [Guía de Backend](#guía-de-backend)
- [Agregar una Nueva Sucursal](#agregar-una-nueva-sucursal)
- [Agregar una Nueva Entidad Sincronizable](#agregar-una-nueva-entidad-sincronizable)
- [Pull Requests](#pull-requests)
- [Glosario](#glosario)

---

## Configuración del Entorno de Desarrollo

### 1. Instalar herramientas recomendadas

**Editor:** Visual Studio Code con las siguientes extensiones:
- `ESLint` — Linter de JavaScript
- `Prettier` — Formateador de código
- `MySQL` (de Weijan Chen) — Cliente MySQL integrado
- `REST Client` — Para probar la API desde el editor
- `GitLens` — Historial de Git avanzado
- `Tailwind CSS IntelliSense` — Autocompletado de Tailwind

### 2. Clonar y configurar

```bash
git clone https://github.com/alex010-cmd/Dr.Simi.git
cd Dr.Simi

# Instalar todas las dependencias
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 3. Configurar Prettier y ESLint

El proyecto usa configuraciones predefinidas. VSCode las aplicará automáticamente si tienes las extensiones instaladas.

```bash
# Verificar que ESLint no reporta errores
cd backend && npm run lint
cd frontend && npm run lint
```

### 4. Iniciar en modo desarrollo

```bash
# Backend (hot-reload con nodemon)
cd backend && npm run dev

# Frontend (HMR con Vite)
cd frontend && npm run dev

# Daemon (modo desarrollo, logs verbosos)
cd backend && npm run daemon:dev
```

---

## Convenciones de Código

### JavaScript (Backend — Node.js)

- **Estilo:** ESLint con `eslint:recommended` + reglas personalizadas
- **Formato:** Prettier (2 espacios, punto y coma, comillas simples)
- **Módulos:** CommonJS (`require/module.exports`)
- **Async:** `async/await` (evitar callbacks y `.then()` en código nuevo)
- **Errores:** Siempre usar `try/catch` en funciones `async`
- **Variables:** `camelCase`, constantes en `UPPER_SNAKE_CASE`
- **Funciones:** Arrow functions para callbacks, funciones nombradas para `exports`

```javascript
// ✅ Correcto
const { centralPool } = require('../config/database');

async function obtenerVentas(sucursalId, options = {}) {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  try {
    const [rows] = await centralPool.execute(
      'SELECT * FROM ventas_central WHERE sucursal_id = ? LIMIT ? OFFSET ?',
      [sucursalId, limit, offset]
    );
    return rows;
  } catch (error) {
    throw new Error(`Error al obtener ventas: ${error.message}`);
  }
}

module.exports = { obtenerVentas };

// ❌ Evitar
var ventas = [];
function getVentas(id, cb) {
  pool.query('SELECT * FROM ventas WHERE sucursal_id = ' + id, function(err, results) {
    cb(err, results);
  });
}
```

### React / JSX (Frontend)

- **Componentes:** `PascalCase`, un componente por archivo
- **Hooks:** `camelCase` con prefijo `use` (ej: `useVentas`, `useAuth`)
- **Props:** Desestructurar en la firma del componente
- **Estado:** `useState` para estado local, Context API o Zustand para estado global
- **Estilos:** Solo clases de Tailwind CSS (sin CSS modules ni CSS-in-JS)
- **API calls:** Siempre a través de los servicios en `src/services/`

```jsx
// ✅ Correcto
import { useState } from 'react';
import { useVentas } from '@/hooks/useVentas';
import DataTable from '@/components/DataTable';

function VentasPage() {
  const [filtros, setFiltros] = useState({ page: 1 });
  const { ventas, isLoading, error } = useVentas(filtros);

  if (isLoading) return <div className="flex justify-center p-8">Cargando...</div>;
  if (error)     return <div className="text-red-600 p-4">Error: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ventas</h1>
      <DataTable data={ventas} columns={columns} />
    </div>
  );
}

export default VentasPage;
```

### SQL

- **Nombres:** `snake_case`, minúsculas para keywords SQL (ej: `SELECT`, no `select`)
- **Parámetros:** Siempre usar parámetros preparados (`?` o `:nombre`), nunca concatenación
- **Transacciones:** Usar transacciones para operaciones que modifican múltiples tablas

---

## Estructura de Commits

El proyecto sigue [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<alcance>): <descripción breve>

[cuerpo opcional]

[notas de pie opcionales]
```

### Tipos permitidos

| Tipo | Descripción | Ejemplo |
|---|---|---|
| `feat` | Nueva funcionalidad | `feat(ventas): agregar filtro por forma de pago` |
| `fix` | Corrección de bug | `fix(sync): corregir deadlock en transacciones concurrentes` |
| `docs` | Solo cambios en documentación | `docs(api): actualizar ejemplos de autenticación` |
| `style` | Cambios de formato sin afectar lógica | `style(frontend): aplicar Prettier en componentes` |
| `refactor` | Refactorización sin nueva funcionalidad | `refactor(daemon): extraer lógica de conflictos a módulo` |
| `test` | Agregar o corregir tests | `test(ventas): agregar tests de cancelación` |
| `chore` | Tareas de mantenimiento | `chore(deps): actualizar mysql2 a 3.6.0` |
| `perf` | Mejoras de rendimiento | `perf(productos): agregar índice fulltext para búsqueda` |
| `ci` | Cambios en CI/CD | `ci: agregar workflow de deploy automático` |

### Ejemplos

```bash
git commit -m "feat(inventario): agregar alerta de stock mínimo en dashboard"
git commit -m "fix(auth): corregir validación de token expirado en refresh"
git commit -m "docs(api): agregar ejemplos de respuesta para /sync/status"
git commit -m "chore: actualizar .gitignore para ignorar logs del daemon"
```

---

## Flujo de Trabajo (Git Flow)

```
main (producción)
  └── develop (integración)
        ├── feature/nueva-funcionalidad
        ├── feature/otro-modulo
        └── hotfix/correccion-critica
```

### Crear una rama de feature

```bash
# Siempre partir desde develop
git checkout develop
git pull origin develop
git checkout -b feature/nombre-descriptivo

# Hacer cambios...
git add .
git commit -m "feat(modulo): descripción del cambio"

# Subir la rama y crear Pull Request
git push origin feature/nombre-descriptivo
```

### Hotfix (corrección urgente en producción)

```bash
git checkout main
git pull origin main
git checkout -b hotfix/descripcion-breve

# Aplicar corrección...
git commit -m "fix(modulo): descripción de la corrección crítica"

# Merge a main Y develop
git checkout main && git merge hotfix/descripcion-breve
git checkout develop && git merge hotfix/descripcion-breve
```

---

## Scripts Disponibles

### Backend (`cd backend`)

| Comando | Descripción |
|---|---|
| `npm start` | Iniciar en modo producción |
| `npm run dev` | Iniciar con nodemon (hot-reload) |
| `npm run daemon` | Iniciar el daemon de sincronización |
| `npm run daemon:dev` | Daemon con logs verbose |
| `npm test` | Ejecutar tests |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Tests con reporte de cobertura |
| `npm run lint` | Revisar estilo de código con ESLint |
| `npm run lint:fix` | Corregir errores de estilo automáticamente |
| `npm run migrate` | Aplicar migraciones de BD pendientes |
| `npm run migrate:rollback` | Revertir la última migración |
| `npm run db:seed` | Cargar datos de prueba |
| `npm run db:check` | Verificar conectividad a ambas BDs |

### Frontend (`cd frontend`)

| Comando | Descripción |
|---|---|
| `npm run dev` | Iniciar servidor de desarrollo (Vite) |
| `npm run build` | Generar build de producción |
| `npm run preview` | Vista previa del build de producción |
| `npm test` | Ejecutar tests con Vitest |
| `npm run lint` | ESLint |
| `npm run lint:fix` | Corregir errores automáticamente |

---

## Testing

### Backend

El proyecto usa **Jest** con **Supertest** para tests de integración.

```bash
cd backend
npm test                    # Todos los tests
npm run test:watch          # Watch mode
npm run test:coverage       # Con cobertura (objetivo: >80%)
```

#### Estructura de tests

```
backend/
├── __tests__/
│   ├── unit/
│   │   ├── services/syncService.test.js
│   │   └── utils/conflictResolver.test.js
│   ├── integration/
│   │   ├── auth.test.js
│   │   ├── ventas.test.js
│   │   └── sync.test.js
│   └── helpers/
│       ├── db.js           # Setup/teardown de BD de test
│       └── fixtures.js     # Datos de prueba
```

#### Ejemplo de test de integración

```javascript
// __tests__/integration/ventas.test.js
const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, teardownTestDB, getAuthToken } = require('../helpers');

describe('POST /api/v1/ventas', () => {
  let token;

  beforeAll(async () => {
    await setupTestDB();
    token = await getAuthToken('cajero@test.com', 'password');
  });

  afterAll(teardownTestDB);

  test('debe registrar una venta correctamente', async () => {
    const res = await request(app)
      .post('/api/v1/ventas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        forma_pago: 'efectivo',
        items: [{ producto_id: 1, cantidad: 2, precio_unitario: 45.00 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.folio).toMatch(/^VTA-\d{4}-\d{6}$/);
    expect(res.body.data.total).toBe(90.00);
  });

  test('debe fallar si el producto no existe', async () => {
    const res = await request(app)
      .post('/api/v1/ventas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        forma_pago: 'efectivo',
        items: [{ producto_id: 99999, cantidad: 1, precio_unitario: 10.00 }],
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });
});
```

### Frontend

El proyecto usa **Vitest** con **React Testing Library**.

```bash
cd frontend
npm test
```

---

## Estándares de API

Al crear o modificar endpoints, seguir estas convenciones:

### Respuestas exitosas

```json
{
  "success": true,
  "data": { ... },
  "pagination": { "page": 1, "limit": 20, "total": 100, "pages": 5 }
}
```

### Respuestas de error

```json
{
  "success": false,
  "error": "CODIGO_ERROR",
  "message": "Mensaje legible para el usuario",
  "details": [ ... ]
}
```

### Validación de inputs

Usar la librería `express-validator` en todas las rutas que reciben datos:

```javascript
const { body, validationResult } = require('express-validator');

const validarVenta = [
  body('forma_pago')
    .isIn(['efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia'])
    .withMessage('Forma de pago inválida'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un producto'),
  body('items.*.cantidad')
    .isFloat({ min: 0.001 })
    .withMessage('La cantidad debe ser mayor a 0'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Datos de entrada inválidos',
        details: errors.array(),
      });
    }
    next();
  },
];
```

---

## Guía de Frontend

### Estructura de un nuevo módulo

Para agregar una nueva sección (ej: "Proveedores"):

```
src/
├── pages/
│   └── Proveedores.jsx         # Componente de página
├── components/
│   └── Proveedores/
│       ├── ProveedorForm.jsx   # Formulario de creación/edición
│       └── ProveedorCard.jsx   # Tarjeta de proveedor
├── hooks/
│   └── useProveedores.js       # Hook de datos (React Query)
└── services/
    └── proveedoresService.js   # Llamadas a la API
```

### Patrón de hook de datos

```javascript
// hooks/useProveedores.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proveedoresService } from '@/services/proveedoresService';

export function useProveedores(filtros = {}) {
  return useQuery({
    queryKey: ['proveedores', filtros],
    queryFn: () => proveedoresService.listar(filtros),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCrearProveedor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: proveedoresService.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
    },
  });
}
```

---

## Guía de Backend

### Estructura de un nuevo endpoint

1. **Definir la ruta** en `src/routes/proveedores.routes.js`
2. **Implementar el controlador** en `src/controllers/proveedoresController.js`
3. **Agregar validaciones** con `express-validator`
4. **Registrar la ruta** en `src/app.js`

### Plantilla de controlador

```javascript
// src/controllers/proveedoresController.js
const { localPool } = require('../config/database');

async function listar(req, res, next) {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = 'SELECT * FROM proveedores WHERE activo = 1';
    const params = [];

    if (search) {
      query += ' AND nombre LIKE ?';
      params.push(`%${search}%`);
    }

    const [rows] = await localPool.execute(
      `${query} LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const [[{ total }]] = await localPool.execute(
      `SELECT COUNT(*) as total FROM proveedores WHERE activo = 1${search ? ' AND nombre LIKE ?' : ''}`,
      search ? [`%${search}%`] : []
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar };
```

---

## Agregar una Nueva Sucursal

1. **Registrar en la BD central:**
   ```sql
   INSERT INTO sucursales (nombre, codigo, direccion, ciudad, estado)
   VALUES ('Sucursal Norte', 'SUC-002', 'Av. Norte 100', 'CDMX', 'CDMX');
   ```

2. **Inicializar la BD local** en el servidor de la sucursal:
   ```bash
   mysql -u root -p < database/local_schema.sql
   ```

3. **Configurar el `.env`** del servidor de la sucursal con el `SUCURSAL_ID` correcto.

4. **Iniciar** el backend y el daemon en el servidor de la sucursal.

---

## Agregar una Nueva Entidad Sincronizable

Si necesitas que una nueva tabla se sincronice entre sucursal y central:

1. **Agregar `synced` y `synced_at`** a la tabla local.
2. **Agregar el trigger** en la BD local para insertar en `sync_queue` al hacer INSERT/UPDATE.
3. **Agregar el handler** en `backend/src/services/syncService.js` para el nuevo `entity_type`.
4. **Agregar el endpoint** en la API central para recibir los registros (`/sync/push` con el nuevo tipo).
5. **Actualizar la documentación** en [`sincronizacion.md`](sincronizacion.md).

---

## Pull Requests

### Checklist antes de crear un PR

- [ ] Código sigue las convenciones del proyecto
- [ ] Tests añadidos o actualizados para los cambios
- [ ] Todos los tests pasan (`npm test`)
- [ ] No hay errores de linter (`npm run lint`)
- [ ] Documentación actualizada si aplica
- [ ] El PR apunta a la rama `develop` (no a `main`)
- [ ] Descripción clara de qué cambia y por qué

### Plantilla de descripción de PR

```markdown
## ¿Qué hace este PR?

Describe brevemente los cambios.

## ¿Por qué?

Contexto o problema que resuelve.

## Cambios

- Cambio 1
- Cambio 2

## Tests

Describe cómo se puede verificar manualmente.

## Screenshots (si aplica)
```

---

## Glosario

| Término | Definición |
|---|---|
| **BD Central** | Base de datos MySQL alojada en el servidor principal de la empresa |
| **BD Local** | Base de datos MySQL de una sucursal específica |
| **Daemon** | Proceso Node.js que corre en segundo plano para sincronización automática |
| **Sucursal** | Una tienda física de la cadena Dr. Simi |
| **RBAC** | Control de Acceso Basado en Roles (_Role-Based Access Control_) |
| **JWT** | JSON Web Token — mecanismo de autenticación sin estado |
| **LWW** | Last-Write-Wins — estrategia de resolución de conflictos |
| **Delta** | Diferencia entre dos valores, en lugar del valor absoluto |
| **sync_queue** | Tabla en la BD local que almacena cambios pendientes de sincronizar |
| **sync_log** | Tabla en la BD central con el historial de sincronizaciones |
| **Folio** | Identificador único legible de una venta (ej: `VTA-2024-001001`) |
| **HMR** | Hot Module Replacement — recarga instantánea en desarrollo de Vite |
| **Pool** | Conjunto de conexiones reutilizables a la base de datos |
