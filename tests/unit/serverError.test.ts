import { describe, expect, it } from 'vitest';
import { serverErrorMessage, serverErrorMessageFrom } from '../../src/utils/serverError';

describe('serverErrorMessage', () => {
  it('usa `error` del cuerpo', () => {
    expect(serverErrorMessage({ success: false, error: 'Sesión no encontrada' })).toBe('Sesión no encontrada');
  });

  it('usa `message` si no hay `error`', () => {
    expect(serverErrorMessage({ message: 'Unauthenticated.' })).toBe('Unauthenticated.');
  });

  it('une `error` y `message` cuando vienen los dos', () => {
    expect(serverErrorMessage({ error: 'CSV inválido', message: 'Falta la columna group' })).toBe(
      'CSV inválido: Falta la columna group'
    );
  });

  it.each([
    ['cuerpo vacío', {}],
    ['cadenas vacías', { error: '  ', message: '' }],
    ['tipos que no son texto', { error: 500, message: { x: 1 } }],
    ['null', null],
    ['texto plano', 'Internal Server Error'],
    ['undefined', undefined],
  ])('sin mensaje utilizable (%s) devuelve undefined', (_name, body) => {
    expect(serverErrorMessage(body)).toBeUndefined();
  });
});

describe('serverErrorMessageFrom', () => {
  it('lee el mensaje de un cuerpo JSON recibido como Blob', async () => {
    const blob = new Blob([JSON.stringify({ error: 'No se pudo generar el archivo' })], { type: 'application/json' });
    await expect(serverErrorMessageFrom(blob)).resolves.toBe('No se pudo generar el archivo');
  });

  it('un Blob que no es JSON devuelve undefined', async () => {
    await expect(serverErrorMessageFrom(new Blob(['<html>502</html>']))).resolves.toBeUndefined();
  });

  it('un cuerpo normal se trata como serverErrorMessage', async () => {
    await expect(serverErrorMessageFrom({ error: 'x' })).resolves.toBe('x');
  });
});
