import { describe, expect, it } from 'vitest';
import { ProgressionManager } from '../../src/managers/ProgressionManager';

describe('ProgressionManager', () => {
  it('empieza en el nivel 1 con velocidad normal', () => {
    const pm = new ProgressionManager();
    expect(pm.getCurrentLevel()).toBe(1);
    expect(pm.getSpeedMultiplier()).toBe(1);
  });

  describe('nivel según el puntaje (30 puntos por nivel)', () => {
    it.each([
      [0, 1],
      [10, 1],
      [20, 1],
      [29, 1],
      [30, 2],
      [59, 2],
      [60, 3],
      [300, 11],
    ])('con %i puntos el nivel es %i', (score, level) => {
      const pm = new ProgressionManager();
      pm.updateProgress(score);
      expect(pm.getCurrentLevel()).toBe(level);
    });

    it('un puntaje negativo se trata como 0', () => {
      const pm = new ProgressionManager();
      pm.updateProgress(-40);
      expect(pm.getCurrentLevel()).toBe(1);
    });
  });

  describe('updateProgress devuelve si el nivel subió', () => {
    it('true solo al cruzar el umbral', () => {
      const pm = new ProgressionManager();
      expect(pm.updateProgress(20)).toBe(false);
      expect(pm.updateProgress(30)).toBe(true);
      expect(pm.updateProgress(40)).toBe(false);
      expect(pm.updateProgress(60)).toBe(true);
    });

    it('saltar varios niveles de golpe cuenta como una sola subida', () => {
      const pm = new ProgressionManager();
      expect(pm.updateProgress(120)).toBe(true);
      expect(pm.getCurrentLevel()).toBe(5);
    });

    it('(comportamiento actual) el nivel puede bajar si baja el puntaje, y eso no es una subida', () => {
      const pm = new ProgressionManager();
      pm.updateProgress(60);
      expect(pm.updateProgress(25)).toBe(false);
      expect(pm.getCurrentLevel()).toBe(1);
    });
  });

  describe('multiplicador de velocidad', () => {
    it('crece 0,15 por nivel', () => {
      const pm = new ProgressionManager();
      pm.updateProgress(30);
      expect(pm.getSpeedMultiplier()).toBeCloseTo(1.15);
      pm.updateProgress(90);
      expect(pm.getSpeedMultiplier()).toBeCloseTo(1.45);
    });

    it('deja de crecer a partir del nivel 10', () => {
      const pm = new ProgressionManager();
      pm.updateProgress(270); // nivel 10
      const atTen = pm.getSpeedMultiplier();
      expect(atTen).toBeCloseTo(2.35);

      pm.updateProgress(3000); // nivel 101
      expect(pm.getSpeedMultiplier()).toBe(atTen);
    });

    it('nunca pasa del máximo de 2,5', () => {
      const pm = new ProgressionManager();
      pm.updateProgress(100000);
      expect(pm.getSpeedMultiplier()).toBeLessThanOrEqual(2.5);
    });
  });
});
