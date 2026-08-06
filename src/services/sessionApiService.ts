/**
 * Servicio para gestionar sesiones de juego con la API
 */

import apiClient from './apiService';
import type {
  ApiResponse,
  GameSessionData,
  FinishSessionPayload,
  FinishedSessionData,
  GameMode,
  MySessionsResponse,
  MySessionsFilterParams
} from '../types/api';

export const sessionApiService = {
  /**
   * Listar las propias sesiones del usuario autenticado (su historial, con
   * resumen igual al del panel admin pero limitado a sus propios datos)
   */
  async getMySessions(filters: MySessionsFilterParams = {}): Promise<MySessionsResponse> {
    const response = await apiClient.get<MySessionsResponse>('/sessions', {
      params: filters
    });

    return response.data;
  },

  /**
   * Crear una nueva sesión de juego
   */
  async createSession(
    startedAt: string,
    canvasWidth: number,
    canvasHeight: number,
    gameMode: GameMode
  ): Promise<GameSessionData> {
    const response = await apiClient.post<ApiResponse<GameSessionData>>(
      '/sessions',
      {
        started_at: startedAt,
        canvas_width: Math.round(canvasWidth),
        canvas_height: Math.round(canvasHeight),
        game_mode: gameMode
      }
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
