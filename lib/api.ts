import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://maamchan-back-production.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inyectar Bearer token automáticamente
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Redirigir si el token expira (401), excepto durante el registro
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Verificamos si la petición que falló es hacia la creación/registro de usuarios
    const isUserEndpoint = error.config?.url?.includes('/users/');

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Si NO es el endpoint de usuarios, redirigimos a login
      if (!isUserEndpoint) {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;