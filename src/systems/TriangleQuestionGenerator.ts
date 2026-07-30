import type { TriangleQuestion, TriangleSide, ReferenceAngle, TrigFunction } from '../types';
import { randomInt } from '../utils/mathHelpers';

type SideRole = 'opposite' | 'adjacent' | 'hypotenuse';

const SIDE_PAIRS: [TriangleSide, TriangleSide][] = [
  ['a', 'b'],
  ['a', 'c'],
  ['b', 'c'],
];

const ROLE_PAIR_TO_FUNCTION: Record<string, TrigFunction> = {
  'opposite,hypotenuse': 'seno',
  'hypotenuse,opposite': 'seno',
  'adjacent,hypotenuse': 'coseno',
  'hypotenuse,adjacent': 'coseno',
  'opposite,adjacent': 'tangente',
  'adjacent,opposite': 'tangente',
};

/**
 * Rol de un lado físico (a=BC, b=AC, c=AB/hipotenusa) relativo al ángulo de
 * referencia elegido (A o B). El ángulo recto (C) nunca es de referencia.
 */
function roleOf(side: TriangleSide, referenceAngle: ReferenceAngle): SideRole {
  if (side === 'c') return 'hypotenuse';
  if (referenceAngle === 'A') {
    return side === 'a' ? 'opposite' : 'adjacent';
  }
  return side === 'b' ? 'opposite' : 'adjacent';
}

/**
 * Genera preguntas para el Juego 2 (aplicación en triángulo): elige un ángulo
 * de referencia (A o B) y dos de los tres lados a mostrar; la razón correcta
 * sale directo de qué roles (opuesto/adyacente/hipotenusa) tienen esos dos
 * lados respecto al ángulo elegido, nunca de cuál sea el lado físico.
 */
export class TriangleQuestionGenerator {
  private currentQuestion: TriangleQuestion | null = null;

  public generateQuestion(): TriangleQuestion {
    const referenceAngle: ReferenceAngle = randomInt(0, 1) === 0 ? 'A' : 'B';
    const [sideOne, sideTwo] = SIDE_PAIRS[randomInt(0, SIDE_PAIRS.length - 1)];

    const roleOne = roleOf(sideOne, referenceAngle);
    const roleTwo = roleOf(sideTwo, referenceAngle);
    const correctFunction = ROLE_PAIR_TO_FUNCTION[`${roleOne},${roleTwo}`];

    const unknownSide = Math.random() < 0.5 ? sideOne : sideTwo;
    const knownSide = unknownSide === sideOne ? sideTwo : sideOne;
    const knownValue = randomInt(4, 20);

    const sideLabels: Partial<Record<TriangleSide, string>> = {
      [knownSide]: String(knownValue),
      [unknownSide]: 'X',
    };

    // Valor decorativo del ángulo de referencia (no se usa para calcular
    // correctFunction, solo para que el estudiante identifique claramente
    // cuál es el ángulo dado, en vez de una letra resaltada por color).
    const angleDegrees = randomInt(20, 70);

    this.currentQuestion = {
      referenceAngle,
      shownSides: [sideOne, sideTwo],
      sideLabels,
      angleDegrees,
      correctFunction,
    };

    return this.currentQuestion;
  }

  public getCurrentQuestion(): TriangleQuestion | null {
    return this.currentQuestion;
  }
}
