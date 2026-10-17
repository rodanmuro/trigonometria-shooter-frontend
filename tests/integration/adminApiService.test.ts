import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adminApiService } from '../../src/services/adminApiService';
import { mockApi } from '../helpers/mockAdapter';

// A diferencia de multiplicación (fetch), aquí el servicio usa el cliente axios.
describe('adminApiService (axios)', () => {
  beforeEach(() => {
    localStorage.setItem('google_auth_token', 'admin-token');
  });

  describe('listados', () => {
    it('getGroups hace GET /admin/groups y devuelve el cuerpo', async () => {
      const calls = mockApi({ data: { success: true, data: ['10A', '11A'] } });

      const result = await adminApiService.getGroups();

      expect(calls[0].method).toBe('get');
      expect(calls[0].url).toBe('/admin/groups');
      expect(calls[0].headers.Authorization).toBe('Bearer admin-token');
      expect(result).toEqual({ success: true, data: ['10A', '11A'] });
    });

    it('listUsers hace GET /admin/users con los filtros como parámetros', async () => {
      const calls = mockApi({ data: { data: [] } });
      const params = {
        page: 2,
        per_page: 14,
        group: '10A',
        profile: 'student',
        search: 'ana',
        sort_by: 'avg_score' as const,
        order: 'desc' as const,
        date_from: '2026-01-01',
        min_score: 0,
      };

      await adminApiService.listUsers(params);

      expect(calls[0].url).toBe('/admin/users');
      expect(calls[0].params).toEqual(params);
    });

    it('listUsers sin filtros no envía parámetros', async () => {
      const calls = mockApi({ data: { data: [] } });

      await adminApiService.listUsers();

      expect(calls[0].params).toEqual({});
    });

    it('getUserSessions hace GET /admin/users/{id}/sessions con los filtros', async () => {
      const calls = mockApi({ data: { data: [] } });

      await adminApiService.getUserSessions(5, { page: 3, date_from: '2026-01-01', date_to: '2026-02-01' });

      expect(calls[0].url).toBe('/admin/users/5/sessions');
      expect(calls[0].params).toEqual({ page: 3, date_from: '2026-01-01', date_to: '2026-02-01' });
    });
  });

  describe('errores', () => {
    it.each([
      ['getGroups', () => adminApiService.getGroups()],
      ['listUsers', () => adminApiService.listUsers()],
      ['getUserSessions', () => adminApiService.getUserSessions(1)],
    ])('%s propaga el error del servidor (axios)', async (_name, call) => {
      mockApi({ status: 403, data: { error: 'Sin permisos' } });

      await expect(call()).rejects.toMatchObject({ response: { status: 403, data: { error: 'Sin permisos' } } });
    });

    it('(comportamiento actual) sin token la petición sale igualmente, sin Authorization', async () => {
      localStorage.clear();
      const calls = mockApi({ status: 401, data: {} });

      await expect(adminApiService.getGroups()).rejects.toBeDefined();

      expect(calls[0].headers.Authorization).toBeUndefined();
    });
  });

  describe('uploadCsv', () => {
    it('hace POST /admin/users/upload-csv con el archivo en un FormData multipart', async () => {
      const response = { success: true, message: 'ok', stats: { created: 2, updated: 1, errors: 0 }, error_details: [] };
      const calls = mockApi({ data: response });
      const file = new File(['email\na@b.co'], 'usuarios.csv', { type: 'text/csv' });

      const result = await adminApiService.uploadCsv(file);

      expect(calls[0].method).toBe('post');
      expect(calls[0].url).toBe('/admin/users/upload-csv');
      expect(calls[0].data).toBeInstanceOf(FormData);
      expect((calls[0].data as FormData).get('file')).toBeInstanceOf(File);
      expect(((calls[0].data as FormData).get('file') as File).name).toBe('usuarios.csv');
      expect(result).toEqual(response);
    });
  });

  describe('exportaciones', () => {
    let clicked: HTMLAnchorElement[];

    beforeEach(() => {
      clicked = [];
      window.URL.createObjectURL = vi.fn(() => 'blob:fake');
      window.URL.revokeObjectURL = vi.fn();
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
        clicked.push(this);
      });
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('exportUsers pide el blob a /admin/export/users con los filtros', async () => {
      const calls = mockApi({ data: new Blob(['csv']) });

      await adminApiService.exportUsers({ group: '10A', min_score: 50 });

      expect(calls[0].url).toBe('/admin/export/users');
      expect(calls[0].params).toEqual({ group: '10A', min_score: 50 });
      expect(calls[0].responseType).toBe('blob');
    });

    it('descarga con el nombre que da el servidor en Content-Disposition', async () => {
      mockApi({
        data: new Blob(['csv']),
        headers: { 'content-disposition': 'attachment; filename="usuarios_2026-03-01.csv"' },
      });

      await adminApiService.exportUsers();

      expect(clicked).toHaveLength(1);
      expect(clicked[0].download).toBe('usuarios_2026-03-01.csv');
      expect(clicked[0].href).toBe('blob:fake');
    });

    it('exportUsers sin cabecera usa usuarios.csv', async () => {
      mockApi({ data: new Blob(['csv']) });

      await adminApiService.exportUsers();

      expect(clicked[0].download).toBe('usuarios.csv');
    });

    it('exportUserSessions pide /admin/export/users/{id}/sessions y usa sesiones.csv por defecto', async () => {
      const calls = mockApi({ data: new Blob(['csv']) });

      await adminApiService.exportUserSessions(8, { date_from: '2026-01-01' });

      expect(calls[0].url).toBe('/admin/export/users/8/sessions');
      expect(calls[0].params).toEqual({ date_from: '2026-01-01' });
      expect(clicked[0].download).toBe('sesiones.csv');
    });

    it('libera la URL temporal y deja el DOM limpio', async () => {
      mockApi({ data: new Blob(['csv']) });

      await adminApiService.exportUsers();

      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
      expect(document.querySelectorAll('a')).toHaveLength(0);
    });

    it('un error del servidor no descarga nada', async () => {
      mockApi({ status: 500, data: {} });

      await expect(adminApiService.exportUsers()).rejects.toBeDefined();

      expect(clicked).toHaveLength(0);
    });
  });
});
