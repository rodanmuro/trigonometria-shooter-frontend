import apiClient from './apiService';
import type { ApiResponse, UserData } from '../types/api';

/**
 * Servicio de autenticación con el backend
 */
export const authApiService = {
  /**
   * Verifica el token de Google con el backend
   * - Si es primer login: crea usuario en BD
   * - Si ya existe: no duplica
   * - SIEMPRE crea registro en user_logins
   */
  async verifyGoogleToken(token: string): Promise<UserData> {
    const response = await apiClient.post<ApiResponse<UserData>>(
      '/auth/verify',
      { token }
    );

    return response.data.data;
  }
};
