import Phaser from 'phaser';

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

    // Crear texto del temporizador (debajo de la pregunta)
    this.timerText = this.scene.add.text(
      this.scene.cameras.main.centerX,
      90,
      this.formatTime(this.remainingTime),
      {
        fontSize: '28px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    this.timerText.setOrigin(0.5);
    this.timerText.setDepth(1000);
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
      this.timerText.setColor('#ff0000');
      const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
      this.timerText.setAlpha(pulse);
    } else if (this.remainingTime <= 120000) {
      // Últimos 2 minutos: naranja
      this.timerText.setColor('#ff8800');
      this.timerText.setAlpha(1);
    } else {
      // Tiempo normal: blanco
      this.timerText.setColor('#ffffff');
      this.timerText.setAlpha(1);
    }
  }

  /**
   * Formatea el tiempo en MM:SS
   */
  private formatTime(ms: number): string {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Destruye el temporizador
   */
  public destroy(): void {
    this.timerText.destroy();
  }
}
