# 📋 SISTEMA DE REGISTRO Y AUTENTICACIÓN

## 🔐 Respuestas a las Preguntas

### 1. ¿Con qué usuarios puedo entrar?

**IMPORTANTE:** Los usuarios deben registrarse a través de la plataforma para que sus contraseñas sean encriptadas correctamente con bcrypt.

#### Usuarios de Prueba (Temporales - Solo para testing inicial):
Estos usuarios tienen la contraseña temporal `admin123`:

```
Admin Central:
- Usuario: admin
- Contraseña: admin123
- Rol: admin
- Sucursal: 1

Gerente Sucursal 1:
- Usuario: jperez
- Contraseña: admin123
- Rol: gerente
- Sucursal: 1

Empleado Sucursal 1:
- Usuario: mlopez
- Contraseña: admin123
- Rol: empleado
- Sucursal: 1
```

### 2. Error de "Acceso denegado. No se proporcionó token"

Este error es **CORRECTO** y esperado. Las rutas `/api/sucursales` y otras rutas protegidas requieren autenticación mediante token JWT.

**Cómo acceder correctamente:**
1. Primero inicia sesión en `/login` o registra un usuario en `/register`
2. El sistema automáticamente guarda el token en localStorage
3. Todas las peticiones posteriores incluyen el token en el header Authorization
4. Ahora podrás acceder a las rutas protegidas

### 3. Sistema de Registro Implementado

#### Frontend: `/register`

El formulario de registro tiene **3 pasos**:

**Paso 1: Datos Personales**
- Nombre (obligatorio)
- Apellido Paterno (obligatorio)
- Apellido Materno
- Fecha de Nacimiento
- CURP
- RFC
- Teléfono
- Email
- Dirección completa (calle, ciudad, estado, código postal)

**Paso 2: Datos Laborales**
- Sucursal (obligatorio) - Dropdown con todas las sucursales disponibles
- Puesto (obligatorio) - Opciones:
  - Gerente
  - Farmacéutico
  - Vendedor
  - Cajero
  - Almacenista
  - Auxiliar
- Cédula Profesional (para farmacéuticos)
- Salario

**Paso 3: Credenciales**
- Usuario (obligatorio, único)
- Contraseña (obligatorio, mínimo 6 caracteres)
- Confirmar Contraseña
- **Código de Administrador Central** (opcional)
  - Checkbox para activar
  - Código: `SR123456789SR`
  - Solo usuarios con este código tendrán rol `admin`

#### Backend: `POST /api/auth/register`

**Características de Seguridad:**
```javascript
// 1. Validación del código de admin central
const ADMIN_CENTRAL_CODE = 'SR123456789SR';

// 2. Encriptación de contraseña con bcrypt
const salt = await bcrypt.genSalt(10);
const password_hash = await bcrypt.hash(password, salt);

// 3. Asignación automática de roles:
- Si tiene código admin válido: rol = 'admin'
- Si puesto es gerente: rol = 'gerente'
- Otros: rol = 'empleado'

// 4. Generación automática de número de empleado
// EMP001, EMP002, EMP003, etc.
```

**Respuesta del registro:**
```json
{
  "success": true,
  "message": "Registro exitoso. Bienvenido al sistema.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "empleado": {
      "id_empleado": 5,
      "numero_empleado": "EMP005",
      "nombre": "Juan",
      "apellido_paterno": "Pérez",
      "usuario": "jperez_nuevo",
      "rol": "empleado",
      "puesto": "vendedor",
      "id_sucursal": 1,
      "email": "juan@farmacia.com"
    }
  }
}
```

### 4. Dashboard Personalizado

#### Información Mostrada al Iniciar Sesión:

**Header del Usuario (Card con degradado):**
```
Bienvenido, [Nombre] [Apellido Paterno]

No. Empleado: EMP001
Puesto: Vendedor
Rol: EMPLEADO
Sucursal Asignada: Sucursal #1
```

**Diferencias según el Rol:**

1. **Usuario Empleado/Gerente de Sucursal:**
   - Ve información de SU sucursal asignada
   - Vista Local por defecto
   - Puede ver estadísticas de su sucursal
   - Registra ventas y clientes a nombre de su usuario y sucursal

2. **Usuario Admin Central (con código SR123456789SR):**
   - Ve información de TODAS las sucursales
   - Vista Central por defecto
   - Puede cambiar entre vistas
   - Dropdown con todas las sucursales mostrando:
     * Nombre de la sucursal
     * Ubicación (ciudad, estado)
     * Empleados activos y jefes de turno
     * Productos en stock
     * Productos en almacén
     * Clientes registrados (número total)
     * Sesiones activas en tiempo real

## 🔒 Seguridad Implementada

### 1. Encriptación de Contraseñas
```javascript
// bcrypt con 10 salt rounds
const salt = await bcrypt.genSalt(10);
const password_hash = await bcrypt.hash(password, salt);
```

### 2. Tokens JWT
```javascript
// Token con expiración de 24 horas
const token = jwt.sign(
  {
    id_empleado: empleado.id_empleado,
    usuario: empleado.usuario,
    rol: empleado.rol,
    id_sucursal: empleado.id_sucursal
  },
  jwtSecret,
  { expiresIn: '24h' }
);
```

### 3. Validación de Código Admin
- El código `SR123456789SR` es validado en el backend
- Solo usuarios con código válido obtienen rol `admin`
- Código incorrecto = Error de registro

### 4. Middleware de Autenticación
- Todas las rutas protegidas requieren token válido
- El token se verifica en cada petición
- Token inválido o expirado = Error 401

## 📊 Sistema de Ventas (Próximo a Implementar)

### Características Planificadas:

**Registro de Venta Completa:**
```javascript
{
  // Información del vendedor (automático)
  vendedor: {
    id_empleado: user.id_empleado,
    numero_empleado: user.numero_empleado,
    nombre_completo: `${user.nombre} ${user.apellido_paterno}`
  },
  
  // Información de la sucursal (automático)
  sucursal: {
    id_sucursal: user.id_sucursal,
    nombre: sucursalSeleccionada.nombre,
    codigo: sucursalSeleccionada.codigo_sucursal
  },
  
  // Información del cliente
  cliente: {
    id_cliente: cliente.id_cliente,
    nombre: cliente.nombre,
    telefono: cliente.telefono
  },
  
  // Detalle de productos
  productos: [
    {
      id_producto: 1,
      nombre: "Paracetamol 500mg",
      cantidad: 2,
      precio_unitario: 45.00,
      subtotal: 90.00
    }
  ],
  
  // Totales
  subtotal: 90.00,
  iva: 14.40,
  total: 104.40,
  
  // Timestamp
  fecha_venta: "2026-04-06 23:30:00"
}
```

**Ticket de Venta Generado:**
```
========================================
    FARMACIA [NOMBRE SUCURSAL]
========================================
Dirección: [Dirección completa]
Tel: [Teléfono]
RFC: [RFC de la farmacia]

Ticket #: VTA-000123
Fecha: 06/04/2026 23:30:00
Sucursal: SUC001 - Centro

----------------------------------------
Atendido por:
Empleado: EMP001 - Juan Pérez
Puesto: Vendedor
----------------------------------------

Cliente:
Nombre: María González
Tel: 5551234567

----------------------------------------
PRODUCTOS
----------------------------------------
Cant  Descripción         P.Unit   Total
----------------------------------------
2     Paracetamol 500mg   $45.00  $90.00
1     Ibuprofeno 400mg    $65.00  $65.00

----------------------------------------
                  Subtotal:    $155.00
                       IVA:     $24.80
----------------------------------------
                     TOTAL:    $179.80
========================================
       ¡Gracias por su compra!
========================================
```

## 🚀 Próximos Pasos Pendientes

1. ✅ Sistema de registro con encriptación - **COMPLETADO**
2. ✅ Validación de código admin central - **COMPLETADO**
3. ✅ Dashboard personalizado con info del usuario - **COMPLETADO**
4. ⏳ Sistema de ventas con tickets completos - **PENDIENTE**
5. ⏳ Vista de admin central con dropdowns de sucursales - **PENDIENTE**
6. ⏳ Registro de sesiones activas en tiempo real - **PENDIENTE**
7. ⏳ Contador de ventas por empleado - **PENDIENTE**
8. ⏳ Reportes de ventas por sucursal - **PENDIENTE**

## 🔧 Cómo Probar el Sistema

### 1. Iniciar Servidores

**Terminal 1 - Backend:**
```bash
cd "PROYECTO FINAL BASE DE DATOS DISTRIBUIDA/backend"
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd "PROYECTO FINAL BASE DE DATOS DISTRIBUIDA/frontend"
npm run dev
```

### 2. Acceder al Sistema

1. **Abrir navegador:** http://localhost:5173/
2. **Registrar nuevo usuario:**
   - Click en "Registrarse aquí"
   - Completar los 3 pasos del formulario
   - **Para admin central:** Marcar checkbox y usar código `SR123456789SR`
   - Enviar formulario
3. **El sistema automáticamente:**
   - Encripta la contraseña con bcrypt
   - Crea el usuario en la base de datos
   - Genera y guarda el token JWT
   - Redirige al dashboard
   - Muestra información personalizada del usuario

### 3. Verificar en Base de Datos

```sql
-- Ver usuario recién creado
USE farmacia_central;
SELECT 
  numero_empleado,
  nombre,
  apellido_paterno,
  usuario,
  rol,
  puesto,
  id_sucursal,
  estado,
  fecha_registro
FROM empleados
WHERE usuario = 'tu_usuario';

-- Verificar que la contraseña está encriptada
SELECT password_hash FROM empleados WHERE usuario = 'tu_usuario';
-- Debe verse algo como: $2a$10$FQsluY6xeODvZxGwfCEVAOpG9F2.RM0i...
```

## ⚠️ IMPORTANTE

**NUNCA insertes usuarios directamente en la base de datos con contraseñas en texto plano.**

La contraseña DEBE pasar por el proceso de registro en la aplicación para ser encriptada correctamente con bcrypt.

Si necesitas crear usuarios de prueba, usa el endpoint de registro:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test",
    "apellido_paterno": "Usuario",
    "usuario": "testusuario",
    "password": "password123",
    "id_sucursal": 1,
    "puesto": "vendedor",
    "codigo_admin": "SR123456789SR"
  }'
```
