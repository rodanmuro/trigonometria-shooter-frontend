import Phaser from 'phaser';
import { UI_CONFIG } from '../utils/constants';

/**
 * Componente UI para mostrar la puntuación del jugador
 */
export class ScoreDisplay extends Phaser.GameObjects.Container {
  private scoreText: Phaser.GameObjects.Text;
  private currentScore: number = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, UI_CONFIG.SCORE_DISPLAY_X, UI_CONFIG.SCORE_DISPLAY_Y);

    // Texto de la puntuación
    this.scoreText = scene.add.text(0, 0, 'Score: 0', {
      fontSize: UI_CONFIG.SCORE_FONT_SIZE,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.scoreText.setOrigin(0, 0.5);

    // Añadir al contenedor
    this.add(this.scoreText);

    // Añadir a la escena
    scene.add.existing(this);

    // Profundidad alta
    this.setDepth(100);
  }

  /**
   * Actualiza la puntuación mostrada
   */
  public updateScore(score: number, delta: number): void {
    this.currentScore = score;
    this.scoreText.setText(`Score: ${score}`);

    // Animación según si ganó o perdió puntos
    if (delta > 0) {
      this.showPositiveFeedback(delta);
    } else if (delta < 0) {
      this.showNegativeFeedback(delta);
    }
  }

  /**
   * Feedback visual para puntos positivos
   */
  private showPositiveFeedback(delta: number): void {
    // Flash verde y escala
    const originalColor = this.scoreText.style.color;

    this.scoreText.setColor('#00ff00');

    this.scene.tweens.add({
      targets: this.scoreText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 150,
      yoyo: true,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scoreText.setColor(originalColor);
      }
    });

    // Texto flotante con el puntaje ganado
    this.showFloatingText(`+${delta}`, '#00ff00');
  }

  /**
   * Feedback visual para puntos negativos
   */
  private showNegativeFeedback(delta: number): void {
    // Shake rojo
    const originalColor = this.scoreText.style.color;
    const originalX = this.scoreText.x;

    this.scoreText.setColor('#ff0000');

    this.scene.tweens.add({
      targets: this.scoreText,
      x: originalX - 5,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.scoreText.x = originalX;
        this.scoreText.setColor(originalColor);
      }
    });

    // Texto flotante con el puntaje perdido
    this.showFloatingText(`${delta}`, '#ff0000');
  }

  /**
   * Muestra un texto flotante con el cambio de puntuación
   */
  private showFloatingText(text: string, color: string): void {
    const floatingText = this.scene.add.text(
      this.scoreText.x + this.scoreText.width + 20,
      this.scoreText.y,
      text,
      {
        fontSize: '24px',
        color: color,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    floatingText.setOrigin(0, 0.5);
    floatingText.setDepth(101);

    // Animación de subida y desvanecimiento
    this.scene.tweens.add({
      targets: floatingText,
      y: floatingText.y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        floatingText.destroy();
      }
    });
  }

  /**
   * Obtiene la puntuación actual
   */
  public getScore(): number {
    return this.currentScore;
  }
}
