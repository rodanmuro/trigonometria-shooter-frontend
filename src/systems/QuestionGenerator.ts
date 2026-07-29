import type { Question } from '../types';
import { TRIG_FUNCTIONS, RATIO_LABELS } from '../utils/constants';
import { randomInt } from '../utils/mathHelpers';

/**
 * Sistema encargado de generar preguntas: elige al azar una razón trigonométrica
 * (seno, coseno o tangente) y determina cuál es su fórmula correcta.
 */
export class TrigQuestionGenerator {
  private currentQuestion: Question | null = null;

  /**
   * Genera una nueva pregunta eligiendo una razón trigonométrica al azar
   */
  public generateQuestion(): Question {
    const trigFunction = TRIG_FUNCTIONS[randomInt(0, TRIG_FUNCTIONS.length - 1)];
    const correctRatio = RATIO_LABELS[trigFunction];

    this.currentQuestion = { trigFunction, correctRatio };

    return this.currentQuestion;
  }

  /**
   * Obtiene la pregunta actual generada
   */
  public getCurrentQuestion(): Question | null {
    return this.currentQuestion;
  }
}
