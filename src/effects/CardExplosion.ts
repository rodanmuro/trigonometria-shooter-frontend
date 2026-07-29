import Phaser from 'phaser';
import { CARD_CONFIG } from '../utils/constants';

/**
 * Efecto de explosión de tarjeta en 4 partes
 */
export class CardExplosion {
  /**
   * Crea una explosión de tarjeta en 4 fragmentos
   */
  static create(scene: Phaser.Scene, x: number, y: number, isCorrect: boolean): void {
    // Reproducir sonidos según tipo de acierto
    if (isCorrect) {
      // Sonido de power-up para respuesta correcta
      scene.sound.play('correct', { volume: 0.6 });
    } else {
      // Sonido de power-down para respuesta incorrecta
      scene.sound.play('wrong', { volume: 0.5 });
    }
    // Sonido de explosión siempre
    scene.sound.play('explosion', { volume: 0.3 });

    const halfWidth = CARD_CONFIG.CARD_WIDTH / 2;
    const halfHeight = CARD_CONFIG.CARD_HEIGHT / 2;
    const fragmentSize = Math.min(halfWidth, halfHeight);

    // Definir las 4 esquinas y sus direcciones de explosión
    const fragments = [
      // Top-left
      {
        offsetX: -halfWidth / 2,
        offsetY: -halfHeight / 2,
        velocityX: -400,
        velocityY: -400,
        rotation: -2
      },
      // Top-right
      {
        offsetX: halfWidth / 2,
        offsetY: -halfHeight / 2,
        velocityX: 400,
        velocityY: -400,
        rotation: 2
      },
      // Bottom-left
      {
        offsetX: -halfWidth / 2,
        offsetY: halfHeight / 2,
        velocityX: -400,
        velocityY: 400,
        rotation: 2
      },
      // Bottom-right
      {
        offsetX: halfWidth / 2,
        offsetY: halfHeight / 2,
        velocityX: 400,
        velocityY: 400,
        rotation: -2
      }
    ];

    // Color según si es correcta o incorrecta
    const fragmentColor = isCorrect ? 0x00ff00 : 0xff6666;

    // Crear los 4 fragmentos
    fragments.forEach((fragment) => {
      const piece = scene.add.graphics();
      piece.fillStyle(fragmentColor, 1);
      piece.fillRect(0, 0, fragmentSize, fragmentSize);
      piece.setPosition(x + fragment.offsetX, y + fragment.offsetY);
      piece.setDepth(999);

      // Animación de explosión
      scene.tweens.add({
        targets: piece,
        x: piece.x + fragment.velocityX * 0.3,
        y: piece.y + fragment.velocityY * 0.3,
        rotation: fragment.rotation,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
          piece.destroy();
        }
      });
    });

    // Efecto de flash central
    const flash = scene.add.graphics();
    flash.fillStyle(isCorrect ? 0xffffff : 0xff0000, 0.8);
    flash.fillCircle(x, y, 20);
    flash.setDepth(998);

    scene.tweens.add({
      targets: flash,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy();
      }
    });

    // Partículas adicionales para más impacto
    this.createParticles(scene, x, y, isCorrect);
  }

  /**
   * Crea partículas pequeñas adicionales para el efecto
   */
  private static createParticles(scene: Phaser.Scene, x: number, y: number, isCorrect: boolean): void {
    const particleColor = isCorrect ? 0x00ff00 : 0xff0000;
    const particleCount = 8;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 200 + Math.random() * 100;

      const particle = scene.add.graphics();
      particle.fillStyle(particleColor, 1);
      particle.fillCircle(0, 0, 3);
      particle.setPosition(x, y);
      particle.setDepth(997);

      const velocityX = Math.cos(angle) * speed;
      const velocityY = Math.sin(angle) * speed;

      scene.tweens.add({
        targets: particle,
        x: x + velocityX * 0.4,
        y: y + velocityY * 0.4,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 400 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }
}
