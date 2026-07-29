/**
 * Servicio para gestionar sesiones de juego con la API
 */

import apiClient from './apiService';
import type {
  ApiResponse,
  GameSessionData,
  FinishSessionPayload,
  FinishedSessionData
} from '../types/api';

export const sessionApiService = {
  /**
   * Crear una nueva sesión de juego
   */
  async createSession(startedAt: string, canvasWidth: number, canvasHeight: number): Promise<GameSessionData> {
    const response = await apiClient.post<ApiResponse<GameSessionData>>(
      '/sessions',
      { started_at: startedAt, canvas_width: Math.round(canvasWidth), canvas_height: Math.round(canvasHeight) }
    );

    return response.data.data;
  },

  /**
   * Finalizar una sesión de juego
   */
  async finishSession(sessionId: number, payload: FinishSessionPayload): Promise<FinishedSessionData> {
    const response = await apiClient.put<ApiResponse<FinishedSessionData>>(
      `/sessions/${sessionId}/finish`,
      payload
    );

    return response.data.data;
  }
};
