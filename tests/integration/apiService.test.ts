import { describe, expect, it, vi } from 'vitest';
import apiClient from '../../src/services/apiService';
import { mockApi, mockApiNetworkError } from '../helpers/mockAdapter';

describe('apiService (cliente axios)', () => {
  describe('interceptor de petición', () => {
    it('agrega Authorization: Bearer con el token de localStorage', async () => {
      localStorage.setItem('google_auth_token', 'token-123');
      const calls = mockApi();

      await apiClient.get('/ping');

      expect(calls[0].headers.Authorization).toBe('Bearer token-123');
    });

    it('no agrega Authorization si no hay token', async () => {
      const calls = mockApi();

      await apiClient.get('/ping');

      expect(calls[0].headers.Authorization).toBeUndefined();
    });

    it('envía y espera JSON', async () => {
      const calls = mockApi();

      await apiClient.get('/ping');

      expect(calls[0].headers.Accept).toBe('application/json');
      expect(calls[0].headers['Content-Type']).toBe('application/json');
    });

    it('usa credenciales (CORS) y un timeout de 10 s', async () => {
      const calls = mockApi();

      await apiClient.get('/ping');

      expect(calls[0].withCredentials).toBe(true);
      expect(calls[0].timeout).toBe(10000);
    });
  });

  describe('interceptor de respuesta', () => {
    it('deja pasar las respuestas 2xx', async () => {
      mockApi({ status: 201, data: { success: true } });

      const res = await apiClient.post('/x', {});

      expect(res.status).toBe(201);
      expect(res.data).toEqual({ success: true });
    });

    it.each([
      [401, 'Token inválido o expirado.', 'warn'],
      [403, 'Acceso prohibido. Permisos insuficientes.', 'warn'],
      [404, 'Recurso no encontrado.', 'warn'],
      [500, 'Error interno del servidor.', 'error'],
      [422, 'Error desconocido del servidor.', 'error'],
    ] as const)('un %i se rechaza y registra "%s"', async (status, message, level) => {
      mockApi({ status, data: { error: 'x' } });

      await expect(apiClient.get('/x')).rejects.toMatchObject({ response: { status } });

      expect(console[level]).toHaveBeenCalledWith(message);
    });

    it('(comportamiento actual) un 401 NO borra el token ni redirige', async () => {
      localStorage.setItem('google_auth_token', 'token-123');
      mockApi({ status: 401 });

      await expect(apiClient.get('/x')).rejects.toBeDefined();

      expect(localStorage.getItem('google_auth_token')).toBe('token-123');
    });

    it('una caída de red se rechaza y avisa que el servidor no respondió', async () => {
      mockApiNetworkError();

      await expect(apiClient.get('/x')).rejects.toMatchObject({ code: 'ERR_NETWORK' });

      expect(console.error).toHaveBeenCalledWith('El servidor no respondió. Verifica tu conexión.');
    });

    it('el mensaje del error pasa a ser el del servidor (error: message)', async () => {
      mockApi({ status: 422, data: { error: 'CSV inválido', message: 'Falta la columna group' } });
      const caught = vi.fn();

      await apiClient.get('/x').catch(caught);

      expect(caught.mock.calls[0][0].message).toBe('CSV inválido: Falta la columna group');
    });

    it('sin mensaje en el cuerpo conserva el de axios', async () => {
      mockApi({ status: 500, data: {} });
      const caught = vi.fn();

      await apiClient.get('/x').catch(caught);

      expect(caught.mock.calls[0][0].message).toBe('Request failed');
    });

    it('el error original llega intacto a quien llama', async () => {
      mockApi({ status: 500, data: { message: 'boom' } });
      const caught = vi.fn();

      await apiClient.get('/x').catch(caught);

      expect(caught.mock.calls[0][0].response.data).toEqual({ message: 'boom' });
    });
  });
});
