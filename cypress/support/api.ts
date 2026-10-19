import {
  emptyPagination,
  emptySummary,
  finishedSessionData,
  sessionData,
  sessionSummary,
  shotData,
} from './fixtures';

export interface GameApiOptions {
  sessionId?: number;
  /** POST /sessions falla con 500 (el juego debe seguir sin sincronizar). */
  createFails?: boolean;
  /** PUT /sessions/{id}/finish falla con 500 (resumen local). */
  finishFails?: boolean;
  /** Estadísticas que devuelve el backend al finalizar. */
  finishStats?: Record<string, unknown>;
}

/**
 * Simula los endpoints que usa una partida. Alias: createSession, recordShot, finishSession.
 * Usa pathname + método para no confundir /sessions con /sessions?page=1.
 * El `game_mode` que devuelve POST /sessions es el que pidió el juego.
 */
export function stubGameApi(options: GameApiOptions = {}): void {
  const { sessionId = 7, createFails = false, finishFails = false, finishStats = {} } = options;

  cy.intercept({ method: 'POST', pathname: '/api/sessions' }, (req) => {
    if (createFails) {
      req.reply({ statusCode: 500, body: { success: false, error: 'Error simulado' } });
      return;
    }
    req.reply({
      statusCode: 201,
      body: { success: true, data: sessionData({ id: sessionId, game_mode: req.body.game_mode }) },
    });
  }).as('createSession');

  cy.intercept(
    { method: 'POST', pathname: `/api/sessions/${sessionId}/shots` },
    { statusCode: 201, body: { success: true, data: shotData({ trig_game_session_id: sessionId }) } }
  ).as('recordShot');

  cy.intercept({ method: 'PUT', pathname: `/api/sessions/${sessionId}/finish` }, (req) => {
    if (finishFails) {
      req.reply({ statusCode: 500, body: { success: false, error: 'Error simulado' } });
      return;
    }
    req.reply({
      statusCode: 200,
      body: {
        success: true,
        data: finishedSessionData({ id: sessionId, ...req.body, ...finishStats }),
      },
    });
  }).as('finishSession');
}

/** Historial vacío para cuando una prueba solo necesita que StatsScene no falle. */
export function stubEmptyHistory(): void {
  cy.intercept(
    { method: 'GET', pathname: '/api/sessions' },
    {
      statusCode: 200,
      body: { success: true, summary: emptySummary, data: [], pagination: emptyPagination },
    }
  ).as('getSessions');
}

/** Admin mínimo (sin grupos ni usuarios) para que AdminScene no falle al abrirse. */
export function stubEmptyAdmin(): void {
  cy.intercept(
    { method: 'GET', pathname: '/api/admin/groups' },
    { statusCode: 200, body: { success: true, data: [] } }
  ).as('getGroups');
  cy.intercept(
    { method: 'GET', pathname: '/api/admin/users' },
    {
      statusCode: 200,
      body: {
        success: true,
        data: [],
        pagination: { ...emptyPagination, per_page: 14 },
        filters_applied: { group: null, profile: null, search: null, date_from: '', date_to: null, min_score: 0 },
      },
    }
  ).as('getUsers');
}

/* ------------------------------------------------------------------ */
/* Estadísticas del estudiante                                          */
/* ------------------------------------------------------------------ */

export interface SessionsApiOptions {
  /** Todas las sesiones del usuario (el stub pagina según `perPage`). */
  sessions: Array<Record<string, any>>;
  /** Tamaño de página que devuelve el backend (por defecto 7, como lo dibuja la escena). */
  perPage?: number;
  /** Resumen que devuelve el backend; por defecto uno con 12 sesiones (7 de razones y 5 de triángulo). */
  summary?: Record<string, unknown>;
  /** GET /sessions responde 500. */
  listFails?: boolean;
}

/**
 * Simula GET /sessions (paginado, con el resumen por modo). Alias: getSessions.
 * El stub no aplica min_score ni date_from: solo los registra, para poder comprobar qué se pidió.
 */
export function stubSessionsApi(options: SessionsApiOptions): void {
  const { sessions, perPage = 7, summary = sessionSummary(), listFails = false } = options;

  cy.intercept({ method: 'GET', pathname: '/api/sessions' }, (req) => {
    if (listFails) {
      req.reply({ statusCode: 500, body: { success: false, error: 'Error simulado' } });
      return;
    }
    const page = Number(req.query.page ?? 1);
    const lastPage = Math.max(1, Math.ceil(sessions.length / perPage));
    const from = sessions.length === 0 ? null : (page - 1) * perPage + 1;
    const to = sessions.length === 0 ? null : Math.min(page * perPage, sessions.length);
    req.reply({
      statusCode: 200,
      body: {
        success: true,
        summary,
        data: sessions.slice((page - 1) * perPage, page * perPage),
        pagination: { current_page: page, last_page: lastPage, per_page: perPage, total: sessions.length, from, to },
      },
    });
  }).as('getSessions');
}

/* ------------------------------------------------------------------ */
/* Panel de administración                                              */
/* ------------------------------------------------------------------ */

export interface AdminApiOptions {
  users: Array<Record<string, any>>;
  groups?: string[];
  /** Sesiones por usuario (clave = id de usuario). Si falta, se usa `defaultSessions`. */
  sessionsByUser?: Record<number, Array<Record<string, any>>>;
  defaultSessions?: Array<Record<string, any>>;
  /** Tamaño de página de las sesiones de un usuario (el backend usa 10). */
  sessionsPerPage?: number;
  groupsFail?: boolean;
  usersFail?: { statusCode: number; body: Record<string, unknown> };
  sessionsFail?: boolean;
  /** Fuerza el tamaño de página de la lista de usuarios, ignorando el `per_page` que pide la escena. */
  usersPageSize?: number;
}

/**
 * Simula el backend de administración. Alias: getGroups, getUsers, getUserSessions,
 * exportUsers, exportUserSessions, uploadCsv.
 * El stub pagina pero no filtra ni ordena: solo registra qué parámetros se pidieron.
 */
export function stubAdminApi(options: AdminApiOptions): void {
  const {
    users,
    groups = ['10A2026', '10B2026', '11A2026'],
    sessionsByUser = {},
    defaultSessions = [],
    sessionsPerPage = 10,
    groupsFail = false,
    usersFail,
    sessionsFail = false,
    usersPageSize,
  } = options;

  cy.intercept(
    { method: 'GET', pathname: '/api/admin/groups' },
    groupsFail
      ? { statusCode: 500, body: { success: false, error: 'Error simulado' } }
      : { statusCode: 200, body: { success: true, data: groups } }
  ).as('getGroups');

  cy.intercept({ method: 'GET', pathname: '/api/admin/users' }, (req) => {
    if (usersFail) {
      req.reply({ statusCode: usersFail.statusCode, body: usersFail.body });
      return;
    }
    const page = Number(req.query.page ?? 1);
    const perPage = usersPageSize ?? Number(req.query.per_page ?? 40);
    const lastPage = Math.max(1, Math.ceil(users.length / perPage));
    const from = users.length === 0 ? null : (page - 1) * perPage + 1;
    const to = users.length === 0 ? null : Math.min(page * perPage, users.length);
    req.reply({
      statusCode: 200,
      body: {
        success: true,
        data: users.slice((page - 1) * perPage, page * perPage),
        pagination: { current_page: page, last_page: lastPage, per_page: perPage, total: users.length, from, to },
        filters_applied: {
          group: null, profile: null, search: null, date_from: '', date_to: null, min_score: 0,
        },
      },
    });
  }).as('getUsers');

  cy.intercept({ method: 'GET', pathname: '/api/admin/users/*/sessions' }, (req) => {
    if (sessionsFail) {
      req.reply({ statusCode: 500, body: { success: false, error: 'Error simulado' } });
      return;
    }
    const userId = Number(req.url.split('?')[0].split('/').slice(-2)[0]);
    const user = users.find((u) => u.id === userId) ?? users[0];
    const rows = sessionsByUser[userId] ?? defaultSessions;
    const page = Number(req.query.page ?? 1);
    const lastPage = Math.max(1, Math.ceil(rows.length / sessionsPerPage));
    const from = rows.length === 0 ? null : (page - 1) * sessionsPerPage + 1;
    const to = rows.length === 0 ? null : Math.min(page * sessionsPerPage, rows.length);
    req.reply({
      statusCode: 200,
      body: {
        success: true,
        user: {
          id: user.id, email: user.email, name: user.name, lastname: user.lastname,
          profile: user.profile, group: user.group,
        },
        summary: sessionSummary({ total_sessions: rows.length, total_sessions_ratio: 5, total_sessions_triangle: 4 }),
        data: rows.slice((page - 1) * sessionsPerPage, page * sessionsPerPage),
        pagination: { current_page: page, last_page: lastPage, per_page: sessionsPerPage, total: rows.length, from, to },
        filters_applied: { date_from: null, date_to: null },
      },
    });
  }).as('getUserSessions');

  cy.intercept(
    { method: 'GET', pathname: '/api/admin/export/users' },
    {
      statusCode: 200,
      headers: { 'content-type': 'text/csv', 'content-disposition': 'attachment; filename="usuarios_prueba.csv"' },
      body: 'email,group\nana@cevu.edu.co,10A2026\n',
    }
  ).as('exportUsers');

  cy.intercept(
    { method: 'GET', pathname: '/api/admin/export/users/*/sessions' },
    {
      statusCode: 200,
      headers: { 'content-type': 'text/csv', 'content-disposition': 'attachment; filename="sesiones_prueba.csv"' },
      body: 'fecha,puntaje\n2026-03-01,1250\n',
    }
  ).as('exportUserSessions');

  cy.intercept(
    { method: 'POST', pathname: '/api/admin/users/upload-csv' },
    {
      statusCode: 200,
      body: {
        success: true,
        message: 'Carga completada',
        stats: { created: 2, updated: 1, errors: 1 },
        error_details: ['Fila 5: Email inválido (invalid@)'],
      },
    }
  ).as('uploadCsv');
}
