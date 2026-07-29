import Phaser from 'phaser';
import type { Question } from '../types';
import { UI_CONFIG } from '../utils/constants';

/**
 * Componente UI para mostrar la razón trigonométrica a identificar
 */
export class QuestionDisplay extends Phaser.GameObjects.Container {
  private questionText: Phaser.GameObjects.Text;
  private background: Phaser.GameObjects.Graphics;
  private currentQuestion: Question | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, scene.cameras.main.centerX, UI_CONFIG.QUESTION_DISPLAY_Y);

    this.background = scene.add.graphics();
    this.background.fillStyle(0x000000, 0.7);
    this.background.fillRoundedRect(-150, -30, 300, 60, 10);

    this.questionText = scene.add.text(0, 0, '', {
      fontSize: UI_CONFIG.QUESTION_FONT_SIZE,
      color: UI_CONFIG.QUESTION_COLOR,
      fontStyle: 'bold',
      align: 'center'
    });
    this.questionText.setOrigin(0.5);

    this.add([this.background, this.questionText]);

    scene.add.existing(this);

    this.setDepth(100);
  }

  /**
   * Actualiza la razón trigonométrica mostrada
   */
  public setQuestion(question: Question): void {
    this.currentQuestion = question;
    this.questionText.setText(question.trigFunction.toUpperCase());

    this.animateIn();
  }

  public getCurrentQuestion(): Question | null {
    return this.currentQuestion;
  }

  private animateIn(): void {
    this.setScale(0);
    this.setAlpha(0);

    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  public showCorrectFeedback(): void {
    this.scene.tweens.add({
      targets: this.questionText,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 2,
      onStart: () => {
        this.questionText.setColor('#00ff00');
      },
      onComplete: () => {
        this.questionText.setColor(UI_CONFIG.QUESTION_COLOR);
      }
    });
  }

  public showWrongFeedback(): void {
    const originalX = this.x;

    this.scene.tweens.add({
      targets: this,
      x: originalX - 10,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onStart: () => {
        this.questionText.setColor('#ff0000');
      },
      onComplete: () => {
        this.x = originalX;
        this.questionText.setColor(UI_CONFIG.QUESTION_COLOR);
      }
    });
  }
}
