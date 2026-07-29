import Phaser from 'phaser';

export class Crosshair extends Phaser.GameObjects.Container {
  private outerCircle: Phaser.GameObjects.Graphics;
  private innerCircle: Phaser.GameObjects.Graphics;
  private centerDot: Phaser.GameObjects.Graphics;

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
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }
}
