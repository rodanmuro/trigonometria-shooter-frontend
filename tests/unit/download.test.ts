import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadBlob, filenameFromContentDisposition } from '../../src/utils/download';

describe('download', () => {
  describe('filenameFromContentDisposition', () => {
    it('extrae el nombre entre comillas', () => {
      expect(
        filenameFromContentDisposition('attachment; filename="usuarios_2026.csv"', 'x.csv')
      ).toBe('usuarios_2026.csv');
    });

    it.each([[null], [''], ['attachment'], ['attachment; filename=sin_comillas.csv']])(
      'sin nombre utilizable (%s) devuelve el de respaldo',
      (header) => {
        expect(filenameFromContentDisposition(header, 'respaldo.csv')).toBe('respaldo.csv');
      }
    );
  });

  describe('downloadBlob', () => {
    afterEach(() => vi.restoreAllMocks());

    it('hace clic en un enlace temporal con el nombre dado y limpia el DOM', () => {
      window.URL.createObjectURL = vi.fn(() => 'blob:fake');
      window.URL.revokeObjectURL = vi.fn();
      let clicked: HTMLAnchorElement | null = null;
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
        this: HTMLAnchorElement
      ) {
        clicked = this;
        expect(document.body.contains(this)).toBe(true);
      });

      downloadBlob(new Blob(['a,b']), 'datos.csv');

      expect(clicked).not.toBeNull();
      expect((clicked as unknown as HTMLAnchorElement).download).toBe('datos.csv');
      expect((clicked as unknown as HTMLAnchorElement).getAttribute('href')).toBe('blob:fake');
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
      expect(document.querySelector('a[download]')).toBeNull();
    });
  });
});
