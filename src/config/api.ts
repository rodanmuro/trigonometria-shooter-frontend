/**
 * Configuración de la API REST del backend
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api',
  TIMEOUT: 10000, // 10 segundos
};
