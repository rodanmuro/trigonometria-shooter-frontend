import { describe, expect, it, vi } from 'vitest';
import { TrigQuestionGenerator } from '../../src/systems/QuestionGenerator';

describe('TrigQuestionGenerator (Juego 1)', () => {
  it('sin pregunta generada, la actual es null', () => {
    expect(new TrigQuestionGenerator().getCurrentQuestion()).toBeNull();
  });

  it.each([
    [0, 'seno', 'CO/H'],
    [0.4, 'coseno', 'CA/H'],
    [0.9, 'tangente', 'CO/CA'],
  ] as const)('con random %s elige %s y su fórmula %s', (random, trigFunction, correctRatio) => {
    vi.spyOn(Math, 'random').mockReturnValue(random);
    const question = new TrigQuestionGenerator().generateQuestion();
    expect(question).toEqual({ trigFunction, correctRatio });
  });

  it('getCurrentQuestion devuelve la última pregunta generada', () => {
    const generator = new TrigQuestionGenerator();
    const question = generator.generateQuestion();
    expect(generator.getCurrentQuestion()).toBe(question);
  });

  it('en muchas preguntas aparecen las tres razones y siempre con su fórmula', () => {
    const generator = new TrigQuestionGenerator();
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const { trigFunction, correctRatio } = generator.generateQuestion();
      seen.add(trigFunction);
      const expected = { seno: 'CO/H', coseno: 'CA/H', tangente: 'CO/CA' }[trigFunction];
      expect(correctRatio).toBe(expected);
    }
    expect(seen).toEqual(new Set(['seno', 'coseno', 'tangente']));
  });
});
