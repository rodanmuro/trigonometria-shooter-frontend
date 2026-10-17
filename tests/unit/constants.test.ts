import { describe, expect, it } from 'vitest';
import {
  ALL_RATIOS,
  CARD_CONFIG,
  GAME_CONFIG,
  PROGRESSION_CONFIG,
  RATIO_LABELS,
  RATIO_TO_BACKEND,
  SCORE,
  TRIG_FUNCTIONS,
} from '../../src/utils/constants';

// Solo invariantes: los valores de ajuste fino (velocidades, intervalos) no se fijan.
describe('constants', () => {
  it('hay tres razones y cada una tiene su fórmula', () => {
    expect(TRIG_FUNCTIONS).toEqual(['seno', 'coseno', 'tangente']);
    expect(RATIO_LABELS).toEqual({ seno: 'CO/H', coseno: 'CA/H', tangente: 'CO/CA' });
  });

  it('ALL_RATIOS contiene exactamente las fórmulas de RATIO_LABELS', () => {
    expect([...ALL_RATIOS].sort()).toEqual(Object.values(RATIO_LABELS).sort());
  });

  it('cada fórmula se traduce a un valor distinto para el backend', () => {
    expect(RATIO_TO_BACKEND).toEqual({ 'CO/H': 'co_h', 'CA/H': 'ca_h', 'CO/CA': 'co_ca' });
    expect(new Set(Object.values(RATIO_TO_BACKEND)).size).toBe(3);
  });

  it('acertar suma y fallar resta', () => {
    expect(SCORE.CORRECT_HIT).toBe(10);
    expect(SCORE.WRONG_HIT).toBe(-5);
  });

  it('la sesión dura 5 minutos', () => {
    expect(GAME_CONFIG.SESSION_DURATION).toBe(5 * 60 * 1000);
  });

  it('las tarjetas tienen un rango de velocidad válido y una probabilidad entre 0 y 1', () => {
    expect(CARD_CONFIG.MIN_SPEED).toBeLessThan(CARD_CONFIG.MAX_SPEED);
    expect(CARD_CONFIG.CORRECT_CARD_PROBABILITY).toBeGreaterThan(0);
    expect(CARD_CONFIG.CORRECT_CARD_PROBABILITY).toBeLessThan(1);
    expect(CARD_CONFIG.MAX_CARDS_ON_SCREEN).toBeGreaterThan(0);
  });

  it('la progresión sube cada 30 puntos con multiplicador creciente acotado', () => {
    expect(PROGRESSION_CONFIG.POINTS_PER_LEVEL).toBe(30);
    const { MIN_MULTIPLIER, MAX_MULTIPLIER, INCREMENT } = PROGRESSION_CONFIG.SPEED_SCALE;
    expect(MIN_MULTIPLIER).toBe(1);
    expect(INCREMENT).toBeGreaterThan(0);
    expect(MAX_MULTIPLIER).toBeGreaterThan(MIN_MULTIPLIER);
  });
});
