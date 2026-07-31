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
  /** Snapshot del puntaje/tiempo transcurrido al momento del disparo (ver ShotController::checkpointSession) */
  current_score?: number;
  elapsed_seconds?: number;
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

/**
 * Tipos del panel de administración
 */

export interface PaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginationInfoExtended extends PaginationInfo {
  from: number | null;
  to: number | null;
}

export interface AdminUserListItem extends UserData {
  game_sessions_count: number;
  avg_score: number | null;
  best_score: number | null;
  last_played_at: string | null;
}

export interface AdminFiltersApplied {
  group: string | null;
  profile: string | null;
  search: string | null;
  date_from: string;
  date_to: string | null;
  min_score: number;
}

export interface AdminUsersResponse {
  success: boolean;
  data: AdminUserListItem[];
  pagination: PaginationInfoExtended;
  filters_applied: AdminFiltersApplied;
}

export interface AdminGroupsResponse {
  success: boolean;
  data: string[];
}

export interface UserSessionSummary {
  total_sessions: number;
  avg_score: number;
  best_score: number;
  total_playtime_minutes: number;
  first_session: string | null;
  last_session: string | null;
}

export interface SessionListItemWithRow {
  row_number: number;
  id: number;
  user_id: number;
  game_mode: GameMode;
  group_snapshot: string | null;
  started_at: string;
  finished_at: string | null;
  final_score: number;
  duration_seconds: number;
  canvas_width: number;
  canvas_height: number;
  total_shots: number;
  correct_shots: number;
  wrong_shots: number;
  accuracy: number;
  created_at: string;
  updated_at: string;
}

export interface DateFiltersApplied {
  date_from: string | null;
  date_to: string | null;
}

export interface AdminUserSessionsResponse {
  success: boolean;
  user: {
    id: number;
    email: string;
    name: string;
    lastname: string | null;
    profile: string;
    group: string | null;
  };
  summary: UserSessionSummary;
  data: SessionListItemWithRow[];
  pagination: PaginationInfoExtended;
  filters_applied: DateFiltersApplied;
}

export interface CsvUploadResponse {
  success: boolean;
  message: string;
  stats: {
    created: number;
    updated: number;
    errors: number;
  };
  error_details: string[];
}

export interface AdminUsersFilterParams {
  page?: number;
  group?: string;
  profile?: string;
  search?: string;
  per_page?: number;
  sort_by?: 'email' | 'name' | 'group' | 'sessions_count' | 'created_at' | 'avg_score';
  order?: 'asc' | 'desc';
  date_from?: string;
  date_to?: string;
  min_score?: number;
}

export interface AdminSessionsFilterParams {
  page?: number;
  date_from?: string;
  date_to?: string;
  per_page?: number;
}
