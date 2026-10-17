import { describe, expect, it, vi } from 'vitest';
import { TriangleQuestionGenerator } from '../../src/systems/TriangleQuestionGenerator';
import type { ReferenceAngle, TriangleSide, TrigFunction } from '../../src/types';

/**
 * Orden de las llamadas a Math.random en generateQuestion():
 * ángulo de referencia, par de lados, cuál es la incógnita, valor conocido, grados.
 */
function generate(angle: number, pair: number, unknown: number, known = 0, degrees = 0) {
  vi.spyOn(Math, 'random')
    .mockReturnValueOnce(angle)
    .mockReturnValueOnce(pair)
    .mockReturnValueOnce(unknown)
    .mockReturnValueOnce(known)
    .mockReturnValueOnce(degrees);
  return new TriangleQuestionGenerator().generateQuestion();
}

const ANGLE_RANDOM: Record<ReferenceAngle, number> = { A: 0.1, B: 0.9 };
const PAIR_RANDOM: Record<string, number> = { ab: 0.1, ac: 0.4, bc: 0.9 };

// Regla (lado a = BC, b = AC, c = AB hipotenusa; ángulo recto en C):
//   ángulo A: a opuesto, b adyacente · ángulo B: b opuesto, a adyacente
describe('TriangleQuestionGenerator (Juego 2)', () => {
  it('sin pregunta generada, la actual es null', () => {
    expect(new TriangleQuestionGenerator().getCurrentQuestion()).toBeNull();
  });

  describe('función correcta según ángulo de referencia y par de lados', () => {
    it.each([
      ['A', 'ab', ['a', 'b'], 'tangente'],
      ['B', 'ab', ['a', 'b'], 'tangente'],
      ['A', 'ac', ['a', 'c'], 'seno'],
      ['B', 'ac', ['a', 'c'], 'coseno'],
      ['A', 'bc', ['b', 'c'], 'coseno'],
      ['B', 'bc', ['b', 'c'], 'seno'],
    ] as [ReferenceAngle, string, [TriangleSide, TriangleSide], TrigFunction][])(
      'ángulo %s con los lados %s → %s',
      (angle, pair, sides, expected) => {
        const question = generate(ANGLE_RANDOM[angle], PAIR_RANDOM[pair], 0);
        expect(question.referenceAngle).toBe(angle);
        expect(question.shownSides).toEqual(sides);
        expect(question.correctFunction).toBe(expected);
      }
    );

    it('el mismo par de lados {a, c} da funciones distintas según el ángulo', () => {
      const withA = generate(ANGLE_RANDOM.A, PAIR_RANDOM.ac, 0).correctFunction;
      const withB = generate(ANGLE_RANDOM.B, PAIR_RANDOM.ac, 0).correctFunction;
      expect(withA).toBe('seno');
      expect(withB).toBe('coseno');
    });
  });

  describe('etiquetas de los lados', () => {
    it('un lado muestra el valor conocido y el otro la incógnita X', () => {
      const question = generate(0.1, PAIR_RANDOM.ac, 0.1, 0);
      // unknown < 0.5 → la incógnita es el primer lado del par (a); el conocido es c
      expect(question.sideLabels).toEqual({ a: 'X', c: '4' });
    });

    it('con la otra mitad del azar la incógnita pasa al segundo lado', () => {
      const question = generate(0.1, PAIR_RANDOM.ac, 0.9, 0);
      expect(question.sideLabels).toEqual({ a: '4', c: 'X' });
    });

    it('el valor conocido va de 4 a 20 (ambos inclusive)', () => {
      expect(generate(0.1, PAIR_RANDOM.ab, 0.1, 0).sideLabels.b).toBe('4');
      expect(generate(0.1, PAIR_RANDOM.ab, 0.1, 0.999999).sideLabels.b).toBe('20');
    });

    it('el lado no mostrado no tiene etiqueta', () => {
      const question = generate(0.1, PAIR_RANDOM.ab, 0.1);
      expect(question.sideLabels.c).toBeUndefined();
    });
  });

  describe('valor decorativo en grados', () => {
    it('va de 20 a 70', () => {
      expect(generate(0.1, 0.1, 0.1, 0, 0).angleDegrees).toBe(20);
      expect(generate(0.1, 0.1, 0.1, 0, 0.999999).angleDegrees).toBe(70);
    });

    it('no interviene en la función correcta', () => {
      const small = generate(0.1, PAIR_RANDOM.ac, 0.1, 0.5, 0).correctFunction;
      const large = generate(0.1, PAIR_RANDOM.ac, 0.1, 0.5, 0.999999).correctFunction;
      expect(small).toBe(large);
    });
  });

  it('getCurrentQuestion devuelve la última pregunta generada', () => {
    const generator = new TriangleQuestionGenerator();
    const question = generator.generateQuestion();
    expect(generator.getCurrentQuestion()).toBe(question);
  });

  it('en muchas preguntas se cumplen las invariantes y aparecen las 3 funciones', () => {
    const generator = new TriangleQuestionGenerator();
    const seenFunctions = new Set<string>();
    const seenAngles = new Set<string>();

    for (let i = 0; i < 400; i++) {
      const q = generator.generateQuestion();
      seenFunctions.add(q.correctFunction);
      seenAngles.add(q.referenceAngle);

      expect(['A', 'B']).toContain(q.referenceAngle);
      expect(q.shownSides[0]).not.toBe(q.shownSides[1]);
      expect(Object.keys(q.sideLabels).sort()).toEqual([...q.shownSides].sort());

      const labels = Object.values(q.sideLabels);
      expect(labels.filter((l) => l === 'X')).toHaveLength(1);
      const known = Number(labels.find((l) => l !== 'X'));
      expect(known).toBeGreaterThanOrEqual(4);
      expect(known).toBeLessThanOrEqual(20);

      expect(q.angleDegrees).toBeGreaterThanOrEqual(20);
      expect(q.angleDegrees).toBeLessThanOrEqual(70);
    }

    expect(seenFunctions).toEqual(new Set(['seno', 'coseno', 'tangente']));
    expect(seenAngles).toEqual(new Set(['A', 'B']));
  });
});
