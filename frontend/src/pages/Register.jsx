import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Estados del formulario
  const [formData, setFormData] = useState({
    // Datos personales
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    curp: '',
    rfc: '',
    fecha_nacimiento: '',
    telefono: '',
    email: '',
    // Dirección
    direccion: '',
    ciudad: '',
    estado_geografico: '',
    codigo_postal: '',
    // Datos laborales
    id_sucursal: '',
    puesto: '',
    cedula_profesional: '',
    salario: '',
    // Credenciales
    usuario: '',
    password: '',
    confirmPassword: '',
    // Código admin (opcional)
    codigo_admin: ''
  });

  const [sucursales, setSucursales] = useState([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCodigoAdmin, setShowCodigoAdmin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Control de pasos del formulario

  // Cargar sucursales
  useEffect(() => {
    cargarSucursales();
  }, []);

  const cargarSucursales = async () => {
    try {
      setLoadingSucursales(true);
      const response = await api.get('/sucursales');
      const sucursalesData = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      setSucursales(sucursalesData);
    } catch (error) {
      console.error('Error cargando sucursales:', error);
      setError('No se pudieron cargar las sucursales desde la base central. Verifique backend/API.');
    } finally {
      setLoadingSucursales(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validarPaso1 = () => {
    if (!formData.nombre || !formData.apellido_paterno) {
      setError('Nombre y apellido paterno son obligatorios');
      return false;
    }
    return true;
  };

  const validarPaso2 = () => {
    if (!formData.id_sucursal || !formData.puesto) {
      setError('Sucursal y puesto son obligatorios');
      return false;
    }
    return true;
  };

  const validarPaso3 = () => {
    if (!formData.usuario || !formData.password) {
      setError('Usuario y contraseña son obligatorios');
      return false;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const siguientePaso = () => {
    setError('');
    if (step === 1 && validarPaso1()) setStep(2);
    else if (step === 2 && validarPaso2()) setStep(3);
  };

  const anteriorPaso = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validarPaso3()) return;

    setLoading(true);

    try {
      // Preparar datos para enviar (sin confirmPassword)
      const { confirmPassword, ...datosRegistro } = formData;

      const response = await api.post('/auth/register', datosRegistro);

      if (response.data.success) {
        // Guardar token y datos del usuario
        const { token, empleado } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(empleado));
        
        // Navegar al dashboard
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Error al registrar usuario');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <ShoppingBag className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Registro de Empleado
          </h1>
          <p className="text-slate-600">
            Complete el formulario para crear su cuenta
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {step > 1 ? <CheckCircle className="w-6 h-6" /> : '1'}
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary-600' : 'bg-slate-200'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {step > 2 ? <CheckCircle className="w-6 h-6" /> : '2'}
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-primary-600' : 'bg-slate-200'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              3
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PASO 1: Datos Personales */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Datos Personales</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="input"
                    placeholder="Juan"
                    required
                  />
                </div>

                <div>
                  <label className="label">Apellido Paterno *</label>
                  <input
                    type="text"
                    name="apellido_paterno"
                    value={formData.apellido_paterno}
                    onChange={handleChange}
                    className="input"
                    placeholder="Pérez"
                    required
                  />
                </div>

                <div>
                  <label className="label">Apellido Materno</label>
                  <input
                    type="text"
                    name="apellido_materno"
                    value={formData.apellido_materno}
                    onChange={handleChange}
                    className="input"
                    placeholder="García"
                  />
                </div>

                <div>
                  <label className="label">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    name="fecha_nacimiento"
                    value={formData.fecha_nacimiento}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">CURP</label>
                  <input
                    type="text"
                    name="curp"
                    value={formData.curp}
                    onChange={handleChange}
                    className="input"
                    placeholder="AABB990101HDFCCC09"
                    maxLength="18"
                  />
                </div>

                <div>
                  <label className="label">RFC</label>
                  <input
                    type="text"
                    name="rfc"
                    value={formData.rfc}
                    onChange={handleChange}
                    className="input"
                    placeholder="AABB990101XXX"
                    maxLength="13"
                  />
                </div>

                <div>
                  <label className="label">Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="input"
                    placeholder="5551234567"
                  />
                </div>

                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input"
                    placeholder="ejemplo@farmacia.com"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-medium text-slate-700 mt-4">Dirección</h4>
                
                <div>
                  <label className="label">Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className="input"
                    placeholder="Calle, número, colonia"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Ciudad</label>
                    <input
                      type="text"
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleChange}
                      className="input"
                      placeholder="Ciudad de México"
                    />
                  </div>

                  <div>
                    <label className="label">Estado</label>
                    <input
                      type="text"
                      name="estado_geografico"
                      value={formData.estado_geografico}
                      onChange={handleChange}
                      className="input"
                      placeholder="CDMX"
                    />
                  </div>

                  <div>
                    <label className="label">Código Postal</label>
                    <input
                      type="text"
                      name="codigo_postal"
                      value={formData.codigo_postal}
                      onChange={handleChange}
                      className="input"
                      placeholder="01000"
                      maxLength="5"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: Datos Laborales */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Datos Laborales</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Sucursal *</label>
                  <select
                    name="id_sucursal"
                    value={formData.id_sucursal}
                    onChange={handleChange}
                    className="input"
                    onFocus={() => {
                      if (!sucursales.length && !loadingSucursales) {
                        cargarSucursales();
                      }
                    }}
                    required
                  >
                    <option value="">
                      {loadingSucursales ? 'Cargando sucursales...' : 'Seleccione una sucursal'}
                    </option>
                    {sucursales.map(suc => (
                      <option key={suc.id_sucursal} value={suc.id_sucursal}>
                        {suc.codigo_sucursal || suc.codigo || `SUC${suc.id_sucursal}`} - {suc.nombre_sucursal || suc.nombre || suc.ciudad}
                      </option>
                    ))}
                  </select>
                  {!loadingSucursales && sucursales.length === 0 && (
                    <p className="mt-2 text-sm text-red-600">No se encontraron sucursales en la base central.</p>
                  )}
                </div>

                <div>
                  <label className="label">Puesto *</label>
                  <select
                    name="puesto"
                    value={formData.puesto}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    <option value="">Seleccione un puesto</option>
                    <option value="gerente">Gerente</option>
                    <option value="farmaceutico">Farmacéutico</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="cajero">Cajero</option>
                    <option value="almacenista">Almacenista</option>
                    <option value="auxiliar">Auxiliar</option>
                  </select>
                </div>

                <div>
                  <label className="label">Cédula Profesional</label>
                  <input
                    type="text"
                    name="cedula_profesional"
                    value={formData.cedula_profesional}
                    onChange={handleChange}
                    className="input"
                    placeholder="Solo para farmacéuticos"
                  />
                </div>

                <div>
                  <label className="label">Salario</label>
                  <input
                    type="number"
                    name="salario"
                    value={formData.salario}
                    onChange={handleChange}
                    className="input"
                    placeholder="15000.00"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: Credenciales */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Credenciales de Acceso</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="label">Usuario *</label>
                  <input
                    type="text"
                    name="usuario"
                    value={formData.usuario}
                    onChange={handleChange}
                    className="input"
                    placeholder="jperez"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Este será su nombre de usuario para iniciar sesión
                  </p>
                </div>

                <div>
                  <label className="label">Contraseña *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="input pr-10"
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Confirmar Contraseña *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input"
                    placeholder="Repita su contraseña"
                    required
                  />
                </div>

                {/* Código de Admin (opcional) */}
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="tieneCodigoAdmin"
                      checked={showCodigoAdmin}
                      onChange={(e) => setShowCodigoAdmin(e.target.checked)}
                      className="mt-1"
                    />
                    <label htmlFor="tieneCodigoAdmin" className="text-sm text-amber-800 cursor-pointer">
                      <strong>Tengo un código de Administrador Central</strong>
                      <p className="text-xs mt-1">
                        Si cuenta con un código especial para acceso de administrador central, márquelo aquí
                      </p>
                    </label>
                  </div>

                  {showCodigoAdmin && (
                    <div className="mt-4">
                      <label className="label">Código de Administrador</label>
                      <input
                        type="text"
                        name="codigo_admin"
                        value={formData.codigo_admin}
                        onChange={handleChange}
                        className="input"
                        placeholder="Ingrese el código de admin central"
                      />
                      <p className="text-xs text-amber-700 mt-1">
                        Ingrese el código proporcionado por la dirección general
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Botones de navegación */}
          <div className="flex justify-between pt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={anteriorPaso}
                className="btn btn-outline"
              >
                Anterior
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={siguientePaso}
                className="btn btn-primary ml-auto"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary ml-auto disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Completar Registro'}
              </button>
            )}
          </div>
        </form>

        {/* Link a Login */}
        <div className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tiene una cuenta?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
