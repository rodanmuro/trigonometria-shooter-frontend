import Phaser from 'phaser';
import { getLayout } from '../ui/layout';

export class Crosshair extends Phaser.GameObjects.Container {
  private outerCircle: Phaser.GameObjects.Graphics;
  private innerCircle: Phaser.GameObjects.Graphics;
  private centerDot: Phaser.GameObjects.Graphics;
  private baseScale = 1;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // Círculo exterior
    this.outerCircle = scene.add.graphics();
    this.outerCircle.lineStyle(2, 0xffffff, 0.8);
    this.outerCircle.strokeCircle(0, 0, 30);

    // Círculo interior
    this.innerCircle = scene.add.graphics();
    this.innerCircle.lineStyle(2, 0xffffff, 0.6);
    this.innerCircle.strokeCircle(0, 0, 15);

    // Punto central pequeño
    this.centerDot = scene.add.graphics();
    this.centerDot.fillStyle(0xffffff, 0.5);
    this.centerDot.fillCircle(0, 0, 2);

    // Añadir elementos al contenedor
    this.add([this.outerCircle, this.innerCircle, this.centerDot]);

    // Añadir el contenedor a la escena
    scene.add.existing(this);

    // Establecer profundidad alta para que esté siempre visible
    this.setDepth(1000);

    // Visible aunque el canvas se muestre reducido (1 en escritorio)
    this.baseScale = getLayout(scene).crosshairScale;
    this.setScale(this.baseScale);
  }

  /**
   * Actualiza la posición de la mira siguiendo el mouse
   */
  public updatePosition(x: number, y: number): void {
    this.setPosition(x, y);
  }

  /**
   * Animación sutil de pulsación para feedback visual
   */
  public pulse(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: this.baseScale * 1.2,
      scaleY: this.baseScale * 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }
}
