import { afterEach, describe, expect, it, vi } from 'vitest';
import { isTouchDevice } from '../../src/utils/environment';

describe('isTouchDevice', () => {
  afterEach(() => vi.restoreAllMocks());

  it('es verdadero con puntero grueso (dedo)', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    expect(isTouchDevice()).toBe(true);
  });

  it('es falso con ratón', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
    expect(isTouchDevice()).toBe(false);
  });
});
