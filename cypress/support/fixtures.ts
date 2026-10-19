// Respuestas de ejemplo con la misma forma que devuelve el backend (ver bitácoras 011 y 012).

export function sessionData(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    user_id: 1,
    game_mode: 'ratio_identification',
    started_at: '2026-03-01T10:00:00.000000Z',
    finished_at: null,
    final_score: 0,
    duration_seconds: 0,
    canvas_width: 1200,
    canvas_height: 800,
    created_at: '2026-03-01T10:00:00.000000Z',
    updated_at: '2026-03-01T10:00:00.000000Z',
    ...overrides,
  };
}

export function finishedSessionData(overrides: Record<string, unknown> = {}) {
  return sessionData({
    finished_at: '2026-03-01T10:05:00.000000Z',
    final_score: 120,
    duration_seconds: 300,
    total_shots: 37,
    correct_shots: 25,
    wrong_shots: 12,
    accuracy: 67.57,
    ...overrides,
  });
}

export function shotData(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    trig_game_session_id: 7,
    shot_at: '2026-03-01T10:00:15.123Z',
    coordinate_x: 450.5,
    coordinate_y: 320.25,
    trig_function: 'seno',
    expected_ratio: 'co_h',
    selected_ratio: 'co_h',
    expected_function: null,
    selected_function: null,
    is_correct: true,
    created_at: '2026-03-01T10:00:15.000000Z',
    updated_at: '2026-03-01T10:00:15.000000Z',
    ...overrides,
  };
}

export function userData(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    google_id: '106839451234567890123',
    email: 'estudiante@cevu.edu.co',
    name: 'Ana',
    lastname: 'Pérez',
    picture: null,
    profile: 'student',
    group: '10A2026',
    created_at: '2026-03-01T10:00:00.000000Z',
    updated_at: '2026-03-01T10:00:00.000000Z',
    ...overrides,
  };
}

export const emptyPagination = { current_page: 1, last_page: 1, per_page: 7, total: 0, from: null, to: null };

export const emptySummary = {
  total_sessions: 0,
  total_sessions_ratio: 0,
  total_sessions_triangle: 0,
  avg_score: 0,
  best_score: 0,
  total_playtime_minutes: 0,
  first_session: null,
  last_session: null,
};

/* ------------------------------------------------------------------ */
/* Estadísticas del estudiante y panel de administración                */
/* ------------------------------------------------------------------ */

/** Resumen por modo que el backend envía con GET /sessions y con las sesiones de un usuario. */
export function sessionSummary(overrides: Record<string, unknown> = {}) {
  return {
    total_sessions: 12,
    total_sessions_ratio: 7,
    total_sessions_triangle: 5,
    avg_score: 1100,
    best_score: 1850,
    total_playtime_minutes: 45,
    first_session: '2026-01-10T15:30:00.000000Z',
    last_session: '2026-03-20T15:30:00.000000Z',
    ...overrides,
  };
}

/** Fila del historial del estudiante (GET /sessions). */
export function mySession(overrides: Record<string, unknown> = {}) {
  return {
    row_number: 1,
    id: 1,
    game_mode: 'ratio_identification',
    started_at: '2026-03-01T15:30:00.000000Z',
    finished_at: '2026-03-01T15:35:00.000000Z',
    final_score: 1250,
    duration_seconds: 300,
    total_shots: 40,
    correct_shots: 29,
    wrong_shots: 11,
    accuracy: 72.5,
    ...overrides,
  };
}

/** `count` sesiones, de la más reciente a la más antigua, alternando de modo y con precisiones distintas. */
export function mySessions(count: number) {
  return Array.from({ length: count }, (_, i) =>
    mySession({
      row_number: i + 1,
      id: count - i,
      game_mode: i % 2 === 0 ? 'ratio_identification' : 'triangle_application',
      started_at: `2026-03-${String(28 - i).padStart(2, '0')}T15:30:00.000000Z`,
      final_score: 2000 - i * 100,
      total_shots: 40 + i,
      correct_shots: 30 + i,
      wrong_shots: 10,
      accuracy: [72.5, 91.2, 55.0, 70.0, 69.9][i % 5],
    })
  );
}

/** Usuario de la lista de administración (GET /admin/users). */
export function adminUser(overrides: Record<string, unknown> = {}) {
  return userData({
    id: 1,
    email: 'ana.perez@cevu.edu.co',
    name: 'Ana',
    lastname: 'Pérez',
    group: '10A2026',
    game_sessions_count: 12,
    avg_score: 1432.5,
    best_score: 2100,
    last_played_at: '2026-03-20T15:30:00.000000Z',
    ...overrides,
  });
}

/** `count` usuarios con ids 1..count. */
export function adminUsers(count: number) {
  return Array.from({ length: count }, (_, i) =>
    adminUser({
      id: i + 1,
      email: `estudiante${i + 1}@cevu.edu.co`,
      name: `Nombre${i + 1}`,
      lastname: `Apellido${i + 1}`,
      group: ['10A2026', '10B2026', '11A2026'][i % 3],
      game_sessions_count: i + 1,
      avg_score: 1000 + i * 25.5,
      best_score: 1500 + i * 10,
    })
  );
}

/** Sesión en la vista de administración (GET /admin/users/{id}/sessions). */
export function adminSessionRow(row: number, overrides: Record<string, unknown> = {}) {
  return {
    ...sessionData({ id: 100 + row }),
    row_number: row,
    game_mode: row % 2 === 1 ? 'ratio_identification' : 'triangle_application',
    group_snapshot: '10A2026',
    started_at: `2026-03-${String(30 - row).padStart(2, '0')}T15:30:00.000000Z`,
    finished_at: '2026-03-01T15:35:00.000000Z',
    final_score: 2000 - row * 150,
    duration_seconds: 300,
    total_shots: 50,
    correct_shots: 40,
    wrong_shots: 10,
    accuracy: [95, 82, 80, 79.99, 61, 60, 41.5, 90][row % 8],
    ...overrides,
  };
}
