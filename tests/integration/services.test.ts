import { describe, expect, it } from 'vitest';
import { authApiService } from '../../src/services/authApiService';
import { sessionApiService } from '../../src/services/sessionApiService';
import { shotApiService } from '../../src/services/shotApiService';
import type { FunctionShotPayload, RatioShotPayload } from '../../src/types/api';
import { mockApi } from '../helpers/mockAdapter';

describe('authApiService', () => {
  it('verifyGoogleToken hace POST /auth/verify con el token y devuelve el usuario', async () => {
    const user = { id: 1, email: 'a@b.co', profile: 'student' };
    const calls = mockApi({ data: { success: true, data: user } });

    const result = await authApiService.verifyGoogleToken('jwt-de-google');

    expect(calls[0].method).toBe('post');
    expect(calls[0].url).toBe('/auth/verify');
    expect(JSON.parse(calls[0].data)).toEqual({ token: 'jwt-de-google' });
    expect(result).toEqual(user);
  });
});

describe('sessionApiService', () => {
  describe('createSession', () => {
    it('hace POST /sessions con inicio, dimensiones del canvas y modo de juego', async () => {
      const session = { id: 7 };
      const calls = mockApi({ status: 201, data: { success: true, data: session } });

      const result = await sessionApiService.createSession(
        '2026-03-01T10:00:00.000Z',
        1200,
        800,
        'ratio_identification'
      );

      expect(calls[0].method).toBe('post');
      expect(calls[0].url).toBe('/sessions');
      expect(JSON.parse(calls[0].data)).toEqual({
        started_at: '2026-03-01T10:00:00.000Z',
        canvas_width: 1200,
        canvas_height: 800,
        game_mode: 'ratio_identification',
      });
      expect(result).toEqual(session);
    });

    it('envía el modo del Juego 2 tal cual', async () => {
      const calls = mockApi({ data: { data: {} } });

      await sessionApiService.createSession('2026-03-01T10:00:00.000Z', 1200, 800, 'triangle_application');

      expect(JSON.parse(calls[0].data).game_mode).toBe('triangle_application');
    });

    it('redondea las dimensiones del canvas', async () => {
      const calls = mockApi({ data: { data: {} } });

      await sessionApiService.createSession('2026-03-01T10:00:00.000Z', 1199.6, 800.4, 'ratio_identification');

      expect(JSON.parse(calls[0].data)).toMatchObject({ canvas_width: 1200, canvas_height: 800 });
    });
  });

  it('finishSession hace PUT /sessions/{id}/finish con el payload', async () => {
    const finished = { id: 7, total_shots: 10, accuracy: 70 };
    const calls = mockApi({ data: { success: true, data: finished } });
    const payload = {
      finished_at: '2026-03-01T10:05:00.000Z',
      final_score: 120,
      duration_seconds: 300,
    };

    const result = await sessionApiService.finishSession(7, payload);

    expect(calls[0].method).toBe('put');
    expect(calls[0].url).toBe('/sessions/7/finish');
    expect(JSON.parse(calls[0].data)).toEqual(payload);
    expect(result).toEqual(finished);
  });

  describe('getMySessions', () => {
    const response = {
      success: true,
      summary: { total_sessions: 3 },
      data: [{ id: 1 }],
      pagination: { current_page: 1, last_page: 1 },
    };

    it('hace GET /sessions y devuelve el cuerpo completo (resumen, datos y paginación)', async () => {
      const calls = mockApi({ data: response });

      const result = await sessionApiService.getMySessions();

      expect(calls[0].method).toBe('get');
      expect(calls[0].url).toBe('/sessions');
      expect(result).toEqual(response);
    });

    it('envía los filtros como parámetros de la consulta', async () => {
      const calls = mockApi({ data: response });

      await sessionApiService.getMySessions({
        page: 2,
        date_from: '2026-01-01',
        date_to: '2026-03-01',
        min_score: 100,
      });

      expect(calls[0].params).toEqual({
        page: 2,
        date_from: '2026-01-01',
        date_to: '2026-03-01',
        min_score: 100,
      });
    });

    it('sin filtros no envía parámetros', async () => {
      const calls = mockApi({ data: response });

      await sessionApiService.getMySessions();

      expect(calls[0].params).toEqual({});
    });
  });
});

describe('shotApiService', () => {
  const base = {
    shot_at: '2026-03-01T10:00:00.000Z',
    coordinate_x: 100,
    coordinate_y: 200,
    is_correct: true,
    current_score: 30,
    elapsed_seconds: 42,
  };

  it('Juego 1: hace POST /sessions/{id}/shots con razón y fórmulas', async () => {
    const shot = { id: 1, is_correct: true };
    const calls = mockApi({ status: 201, data: { success: true, data: shot } });
    const payload: RatioShotPayload = {
      ...base,
      trig_function: 'seno',
      expected_ratio: 'co_h',
      selected_ratio: 'co_h',
    };

    const result = await shotApiService.recordShot(7, payload);

    expect(calls[0].method).toBe('post');
    expect(calls[0].url).toBe('/sessions/7/shots');
    expect(JSON.parse(calls[0].data)).toEqual(payload);
    expect(result).toEqual(shot);
  });

  it('Juego 2: envía la función esperada y la elegida', async () => {
    const calls = mockApi({ data: { data: {} } });
    const payload: FunctionShotPayload = {
      ...base,
      is_correct: false,
      expected_function: 'coseno',
      selected_function: 'tangente',
    };

    await shotApiService.recordShot(9, payload);

    expect(calls[0].url).toBe('/sessions/9/shots');
    expect(JSON.parse(calls[0].data)).toEqual(payload);
  });

  it('el puntaje y el tiempo (checkpoint) viajan en el payload', async () => {
    const calls = mockApi({ data: { data: {} } });

    await shotApiService.recordShot(1, {
      ...base,
      trig_function: 'tangente',
      expected_ratio: 'co_ca',
      selected_ratio: 'ca_h',
    });

    expect(JSON.parse(calls[0].data)).toMatchObject({ current_score: 30, elapsed_seconds: 42 });
  });

  it('un error del servidor se propaga a quien llama', async () => {
    mockApi({ status: 422, data: { message: 'inválido' } });

    await expect(
      shotApiService.recordShot(1, { ...base, expected_function: 'seno', selected_function: 'seno' })
    ).rejects.toMatchObject({ response: { status: 422 } });
  });
});
