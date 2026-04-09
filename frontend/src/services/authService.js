import api from './api';

const authService = {
  /**
   * Iniciar sesión
   */
  login: async (usuario, password) => {
    const response = await api.post('/auth/login', { usuario, password });
    
    if (response.data.success) {
      const { token, empleado } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(empleado));
    }
    
    return response.data;
  },

  /**
   * Cerrar sesión
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Obtener usuario actual
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Verificar si hay sesión activa
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Cambiar contraseña
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }
};

export default authService;
