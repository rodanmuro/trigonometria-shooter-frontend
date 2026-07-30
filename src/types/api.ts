import type { TrigFunction } from './index';

/**
 * Tipos TypeScript para las respuestas de la API
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface UserData {
  id: number;
  google_id: string | null;
  email: string;
  name: string;
  lastname: string | null;
  picture: string | null;
  profile: 'student' | 'teacher' | 'admin';
  group: string | null;
  created_at: string;
  updated_at: string;
}

export type GameMode = 'ratio_identification' | 'triangle_application';

export interface GameSessionData {
  id: number;
  user_id: number;
  game_mode: GameMode;
  started_at: string;
  finished_at: string | null;
  final_score: number;
  duration_seconds: number;
  canvas_width: number;
  canvas_height: number;
  created_at: string;
  updated_at: string;
}

export interface FinishedSessionData extends GameSessionData {
  total_shots: number;
  correct_shots: number;
  wrong_shots: number;
  accuracy: number;
}

/** Valor de fórmula tal como lo espera el backend (co_h | ca_h | co_ca) */
export type BackendRatio = 'co_h' | 'ca_h' | 'co_ca';

export interface ShotData {
  id: number;
  trig_game_session_id: number;
  shot_at: string;
  coordinate_x: number;
  coordinate_y: number;
  trig_function: TrigFunction | null;
  expected_ratio: BackendRatio | null;
  selected_ratio: BackendRatio | null;
  expected_function: TrigFunction | null;
  selected_function: TrigFunction | null;
  is_correct: boolean;
  created_at: string;
  updated_at: string;
}

interface BaseShotPayload {
  shot_at: string;
  coordinate_x: number;
  coordinate_y: number;
  is_correct: boolean;
}

/** Disparo del Juego 1 (identificar razón): se dispara una fórmula (CO/H, CA/H, CO/CA) */
export interface RatioShotPayload extends BaseShotPayload {
  trig_function: TrigFunction;
  expected_ratio: BackendRatio;
  selected_ratio: BackendRatio;
}

/** Disparo del Juego 2 (aplicación en triángulo): se dispara un nombre de función */
export interface FunctionShotPayload extends BaseShotPayload {
  expected_function: TrigFunction;
  selected_function: TrigFunction;
}

export type RecordShotPayload = RatioShotPayload | FunctionShotPayload;

export interface FinishSessionPayload {
  finished_at: string;
  final_score: number;
  duration_seconds: number;
}
