import type { RatioLabel } from '../types';
import { ALL_RATIOS } from './constants';

/**
 * Genera un número aleatorio entre min y max (inclusivo)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Devuelve las fórmulas incorrectas para una razón dada (las otras 2 de las 3 posibles)
 */
export function getWrongRatios(correctRatio: RatioLabel): RatioLabel[] {
  return ALL_RATIOS.filter((ratio) => ratio !== correctRatio);
}

/**
 * Mezcla un array usando el algoritmo de Fisher-Yates
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
