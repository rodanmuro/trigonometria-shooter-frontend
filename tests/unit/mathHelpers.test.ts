import { describe, expect, it, vi } from 'vitest';
import { getOtherLabels, randomInt, shuffleArray } from '../../src/utils/mathHelpers';

describe('randomInt', () => {
  it('incluye ambos extremos', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.999999);
    expect(randomInt(4, 20)).toBe(4);
    expect(randomInt(4, 20)).toBe(20);
  });

  it('siempre devuelve enteros dentro del rango', () => {
    for (let i = 0; i < 500; i++) {
      const n = randomInt(20, 70);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(20);
      expect(n).toBeLessThanOrEqual(70);
    }
  });

  it('con min = max devuelve ese valor', () => {
    expect(randomInt(5, 5)).toBe(5);
  });
});

describe('getOtherLabels', () => {
  it('devuelve las otras dos etiquetas, sin la correcta y en el mismo orden', () => {
    expect(getOtherLabels(['CO/H', 'CA/H', 'CO/CA'], 'CA/H')).toEqual(['CO/H', 'CO/CA']);
    expect(getOtherLabels(['seno', 'coseno', 'tangente'], 'seno')).toEqual(['coseno', 'tangente']);
  });

  it('si la correcta no está en el pool, devuelve todo el pool', () => {
    expect(getOtherLabels(['a', 'b'], 'z')).toEqual(['a', 'b']);
  });

  it('no modifica el arreglo original', () => {
    const pool = ['seno', 'coseno', 'tangente'];
    getOtherLabels(pool, 'coseno');
    expect(pool).toEqual(['seno', 'coseno', 'tangente']);
  });
});

describe('shuffleArray', () => {
  it('conserva los elementos y no muta el original', () => {
    const original = [1, 2, 3, 4, 5, 6];
    const shuffled = shuffleArray(original);
    expect(original).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...shuffled].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('con Math.random fijo en 0 el resultado es determinista', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(shuffleArray([1, 2, 3])).toEqual([2, 3, 1]);
  });
});
