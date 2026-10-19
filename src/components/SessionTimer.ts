import Phaser from 'phaser';
import { COLOR, FONT_SIZE } from '../ui/theme';
import { formatClock } from '../utils/format';
import { getLayout } from '../ui/layout';
import { UI_CONFIG } from '../utils/constants';

/**
 * Temporizador de sesión que cuenta regresivamente desde 5 minutos
 */
export class SessionTimer {
  private scene: Phaser.Scene;
  private timerText: Phaser.GameObjects.Text;
  private remainingTime: number = 0;

  constructor(scene: Phaser.Scene, totalTime: number) {
    this.scene = scene;
    this.remainingTime = totalTime;

    // Crear texto del temporizador (debajo de la pregunta). La caja de la pregunta crece con
    // hudScale, así que el temporizador baja con ella (90 px a escala 1, como antes)
    const hudScale = getLayout(scene).hudScale;
    this.timerText = this.scene.add.text(
      this.scene.cameras.main.centerX,
      UI_CONFIG.QUESTION_DISPLAY_Y + 40 * hudScale,
      this.formatTime(this.remainingTime),
      {
        fontSize: FONT_SIZE.xxl,
        color: COLOR.white,
        fontStyle: 'bold',
        stroke: COLOR.black,
        strokeThickness: 3
      }
    );
    this.timerText.setOrigin(0.5);
    this.timerText.setDepth(1000);

    // Se agranda en pantallas pequeñas (1 en escritorio)
    this.timerText.setScale(hudScale);
    this.timerText.setResolution(hudScale);
  }

  /**
   * Actualiza el temporizador
   */
  public update(remainingTime: number): void {
    this.remainingTime = remainingTime;
    this.timerText.setText(this.formatTime(this.remainingTime));

    // Cambiar color según tiempo restante
    if (this.remainingTime <= 60000) {
      // Último minuto: rojo parpadeante
      this.timerText.setColor(COLOR.red);
      const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
      this.timerText.setAlpha(pulse);
    } else if (this.remainingTime <= 120000) {
      // Últimos 2 minutos: naranja
      this.timerText.setColor('#ff8800');
      this.timerText.setAlpha(1);
    } else {
      // Tiempo normal: blanco
      this.timerText.setColor(COLOR.white);
      this.timerText.setAlpha(1);
    }
  }

  /**
   * Formatea el tiempo en MM:SS
   */
  private formatTime(ms: number): string {
    return formatClock(Math.ceil(ms / 1000));
  }

  /**
   * Destruye el temporizador
   */
  public destroy(): void {
    this.timerText.destroy();
  }
}
