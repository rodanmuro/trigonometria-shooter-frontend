import { BaseGameScene } from './BaseGameScene';
import { TrigQuestionGenerator } from '../systems/QuestionGenerator';
import { QuestionDisplay } from '../components/QuestionDisplay';
import { ALL_RATIOS, RATIO_TO_BACKEND } from '../utils/constants';
import type { Card } from '../entities/Card';
import type { RatioShotPayload, GameMode } from '../types/api';
import type { RatioLabel } from '../types';

/**
 * Juego 1: identificar qué fórmula (CO/H, CA/H, CO/CA) corresponde a la
 * razón trigonométrica pedida (seno, coseno, tangente).
 */
export class RatioIdentificationScene extends BaseGameScene {
  protected gameMode: GameMode = 'ratio_identification';

  private questionGenerator!: TrigQuestionGenerator;
  private questionDisplay!: QuestionDisplay;

  constructor() {
    super({ key: 'RatioIdentificationScene' });
  }

  protected initQuestion(): void {
    this.questionGenerator = new TrigQuestionGenerator();
    this.questionDisplay = new QuestionDisplay(this);
    this.generateNewQuestion();
  }

  protected generateNewQuestion(): void {
    const question = this.questionGenerator.generateQuestion();
    this.questionDisplay.setQuestion(question);
    this.cardSpawner.startSpawning(ALL_RATIOS, question.correctRatio);

    console.log(`Nueva pregunta: ${question.trigFunction} = ${question.correctRatio}`);
  }

  protected buildShotPayload(hitCard: Card, x: number, y: number): RatioShotPayload {
    const question = this.questionGenerator.getCurrentQuestion();

    return {
      shot_at: new Date().toISOString(),
      coordinate_x: x,
      coordinate_y: y,
      trig_function: question!.trigFunction,
      expected_ratio: RATIO_TO_BACKEND[question!.correctRatio],
      selected_ratio: RATIO_TO_BACKEND[hitCard.getValue() as RatioLabel],
      is_correct: hitCard.isCorrect()
    };
  }

  protected onCorrectFeedback(): void {
    this.questionDisplay.showCorrectFeedback();
  }

  protected onWrongFeedback(): void {
    this.questionDisplay.showWrongFeedback();
  }
}
