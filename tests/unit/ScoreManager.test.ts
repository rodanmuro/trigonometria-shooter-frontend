import { describe, expect, it, vi } from 'vitest';
import { ScoreManager } from '../../src/systems/ScoreManager';

describe('ScoreManager', () => {
  it('empieza en 0', () => {
    expect(new ScoreManager().getScore()).toBe(0);
  });

  it('un acierto correcto suma 10', () => {
    const sm = new ScoreManager();
    sm.addCorrectHit();
    sm.addCorrectHit();
    expect(sm.getScore()).toBe(20);
  });

  it('un acierto incorrecto resta 5', () => {
    const sm = new ScoreManager();
    sm.addCorrectHit();
    sm.addCorrectHit();
    sm.addWrongHit();
    expect(sm.getScore()).toBe(15);
  });

  it('el puntaje nunca baja de 0', () => {
    const sm = new ScoreManager();
    sm.addWrongHit();
    expect(sm.getScore()).toBe(0);
    sm.addCorrectHit();
    sm.addWrongHit();
    sm.addWrongHit();
    expect(sm.getScore()).toBe(0);
  });

  it('el callback recibe el puntaje nuevo y el delta', () => {
    const sm = new ScoreManager();
    const cb = vi.fn();
    sm.setOnScoreChange(cb);
    sm.addCorrectHit();
    sm.addWrongHit();
    expect(cb).toHaveBeenNthCalledWith(1, 10, 10);
    expect(cb).toHaveBeenNthCalledWith(2, 5, -5);
  });

  it('(comportamiento actual) al recortar en 0 el delta notificado sigue siendo -5', () => {
    const sm = new ScoreManager();
    const cb = vi.fn();
    sm.setOnScoreChange(cb);
    sm.addWrongHit();
    expect(cb).toHaveBeenCalledWith(0, -5);
  });

  it('reset vuelve a 0 y notifica con delta 0', () => {
    const sm = new ScoreManager();
    sm.addCorrectHit();
    const cb = vi.fn();
    sm.setOnScoreChange(cb);
    sm.reset();
    expect(sm.getScore()).toBe(0);
    expect(cb).toHaveBeenCalledWith(0, 0);
  });

  it('funciona sin callback registrado', () => {
    const sm = new ScoreManager();
    expect(() => {
      sm.addCorrectHit();
      sm.addWrongHit();
      sm.reset();
    }).not.toThrow();
  });
});
