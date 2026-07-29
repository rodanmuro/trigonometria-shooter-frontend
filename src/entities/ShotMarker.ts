import Phaser from 'phaser';

export class ShotMarker extends Phaser.GameObjects.Graphics {
  private fadeOutDuration: number = 500;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene);

    // Dibujar punto rojo
    this.fillStyle(0xff0000, 1);
    this.fillCircle(0, 0, 4);

    // Posicionar en las coordenadas del disparo
    this.setPosition(x, y);

    // Profundidad alta para estar visible sobre otros elementos
    this.setDepth(999);

    // Añadir a la escena
    scene.add.existing(this);

    // Animación de aparición y desvanecimiento
    this.animateShot();
  }

  private animateShot(): void {
    // Escala desde pequeño a normal
    this.setScale(0);

    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 100,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Después de aparecer, desvanecer
        this.fadeOut();
      }
    });
  }

  private fadeOut(): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: this.fadeOutDuration,
      ease: 'Sine.easeIn',
      onComplete: () => {
        // Destruir el marcador cuando termine la animación
        this.destroy();
      }
    });
  }
}
