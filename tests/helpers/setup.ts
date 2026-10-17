import { afterEach, beforeEach, vi } from 'vitest';

// El código de producción registra mucho en consola; se silencia para que
// la salida de los tests sea legible. Cada test puede espiar lo que necesite.
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});
