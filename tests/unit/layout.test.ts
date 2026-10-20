import { describe, expect, it } from 'vitest';
import {
  computeLayout,
  computeWorldWidth,
  MAX_WORLD_WIDTH,
  MIN_CARD_SCREEN_HEIGHT,
  MIN_WORLD_WIDTH,
} from '../../src/ui/layout';

describe('computeLayout', () => {
  it('a escala 1 (escritorio) no cambia nada', () => {
    expect(computeLayout(1)).toEqual({
      displayScale: 1,
      cardScale: 1,
      hudScale: 1,
      hitSlop: 0,
      crosshairScale: 1,
      maxCardsFactor: 1,
      compact: false,
    });
  });

  it('nunca agranda por encima de escala 1', () => {
    expect(computeLayout(2)).toEqual(computeLayout(1));
  });

  it('con el canvas reducido, la tarjeta no baja del alto mínimo en pantalla', () => {
    for (const s of [0.9, 0.7, 0.55, 0.49, 0.4]) {
      const { cardScale } = computeLayout(s);
      const screenHeight = 80 * cardScale * s;
      // Si no se alcanza es porque se topó con el máximo permitido
      if (cardScale < 1.35) expect(screenHeight).toBeGreaterThanOrEqual(MIN_CARD_SCREEN_HEIGHT - 0.001);
    }
  });

  it('a escala de celular (≈ 0,49) las tarjetas, el HUD y la tolerancia crecen', () => {
    const l = computeLayout(0.49);
    expect(l.cardScale).toBeGreaterThan(1.3);
    expect(l.maxCardsFactor).toBeLessThan(0.7);
    expect(l.hudScale).toBeGreaterThan(1.3);
    expect(l.hitSlop).toBeGreaterThan(20);
    expect(l.crosshairScale).toBeGreaterThan(1.5);
  });

  it('es monótona: a menor escala de pantalla, mayor compensación', () => {
    const a = computeLayout(0.8);
    const b = computeLayout(0.6);
    const c = computeLayout(0.45);
    expect(b.cardScale).toBeGreaterThanOrEqual(a.cardScale);
    expect(c.cardScale).toBeGreaterThanOrEqual(b.cardScale);
    expect(b.hitSlop).toBeGreaterThan(a.hitSlop);
    expect(c.hitSlop).toBeGreaterThan(b.hitSlop);
  });

  it('es compacto por debajo de 0,75 y no por encima', () => {
    expect(computeLayout(0.74).compact).toBe(true);
    expect(computeLayout(0.49).compact).toBe(true);
    expect(computeLayout(0.75).compact).toBe(false);
    expect(computeLayout(1).compact).toBe(false);
  });

  it('respeta los topes aunque la pantalla sea diminuta', () => {
    const l = computeLayout(0.05);
    expect(l.cardScale).toBeLessThanOrEqual(1.35);
    expect(l.maxCardsFactor).toBeGreaterThanOrEqual(0.6);
    expect(l.hudScale).toBeLessThanOrEqual(1.6);
    expect(l.crosshairScale).toBeLessThanOrEqual(1.8);
    expect(Number.isFinite(l.hitSlop)).toBe(true);
  });
});

describe('computeWorldWidth', () => {
  it('una pantalla 3:2 o más cuadrada mantiene el ancho de siempre (1200)', () => {
    expect(computeWorldWidth(1200, 800)).toBe(1200);
    expect(computeWorldWidth(1280, 900)).toBe(1200);
    expect(computeWorldWidth(1024, 768)).toBe(1200);
  });

  it('una pantalla alargada ensancha el mundo según su proporción', () => {
    expect(computeWorldWidth(1600, 800)).toBe(1600);
    expect(computeWorldWidth(1920, 1080)).toBe(1422);
    expect(computeWorldWidth(844, 390)).toBeGreaterThan(1700);
  });

  it('tiene un máximo para pantallas extremas', () => {
    expect(computeWorldWidth(3440, 1000)).toBe(MAX_WORLD_WIDTH);
    expect(computeWorldWidth(2400, 360)).toBe(MAX_WORLD_WIDTH);
  });

  it('da lo mismo abrir la página en vertical que en horizontal', () => {
    expect(computeWorldWidth(390, 844)).toBe(computeWorldWidth(844, 390));
    expect(computeWorldWidth(412, 915)).toBe(computeWorldWidth(915, 412));
  });

  it('siempre es un entero par dentro de los límites', () => {
    for (const [w, h] of [[1, 1], [800, 600], [915, 412], [2340, 1080], [0, 0], [5000, 100]]) {
      const width = computeWorldWidth(w, h);
      expect(Number.isInteger(width)).toBe(true);
      expect(width % 2).toBe(0);
      expect(width).toBeGreaterThanOrEqual(MIN_WORLD_WIDTH);
      expect(width).toBeLessThanOrEqual(MAX_WORLD_WIDTH);
    }
  });
});
