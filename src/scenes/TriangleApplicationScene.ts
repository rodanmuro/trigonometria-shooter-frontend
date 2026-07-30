import { BaseGameScene } from './BaseGameScene';
import { TriangleQuestionGenerator } from '../systems/TriangleQuestionGenerator';
import { TriangleDisplay } from '../components/TriangleDisplay';
import { TRIG_FUNCTIONS } from '../utils/constants';
import type { Card } from '../entities/Card';
import type { FunctionShotPayload, GameMode } from '../types/api';
import type { TrigFunction } from '../types';

/**
 * Juego 2: aplicar las razones en un triángulo rectángulo fijo. Se muestran
 * dos lados (uno con valor, otro como "X") y el ángulo de referencia (A o B);
 * el estudiante dispara el nombre de la función que resuelve X.
 */
export class TriangleApplicationScene extends BaseGameScene {
  protected gameMode: GameMode = 'triangle_application';

  private questionGenerator!: TriangleQuestionGenerator;
  private triangleDisplay!: TriangleDisplay;

  constructor() {
    super({ key: 'TriangleApplicationScene' });
  }

  protected initQuestion(): void {
    this.questionGenerator = new TriangleQuestionGenerator();
    this.triangleDisplay = new TriangleDisplay(this);
    this.generateNewQuestion();
  }

  protected generateNewQuestion(): void {
    const question = this.questionGenerator.generateQuestion();
    this.triangleDisplay.setQuestion(question);
    this.cardSpawner.startSpawning(TRIG_FUNCTIONS, question.correctFunction);

    console.log(
      `Nueva pregunta: ángulo ${question.referenceAngle}, lados ${question.shownSides.join(',')} = ${question.correctFunction}`
    );
  }

  protected buildShotPayload(hitCard: Card, x: number, y: number): FunctionShotPayload {
    const question = this.questionGenerator.getCurrentQuestion();

    return {
      shot_at: new Date().toISOString(),
      coordinate_x: x,
      coordinate_y: y,
      expected_function: question!.correctFunction,
      selected_function: hitCard.getValue() as TrigFunction,
      is_correct: hitCard.isCorrect()
    };
  }

  protected onCorrectFeedback(): void {
    this.triangleDisplay.showCorrectFeedback();
  }

  protected onWrongFeedback(): void {
    this.triangleDisplay.showWrongFeedback();
  }
}
