import Phaser from 'phaser';
import { CARD_CONFIG } from '../utils/constants';
import { CardExplosion } from '../effects/CardExplosion';
import { COLOR, FONT_SIZE } from '../ui/theme';
import { getLayout } from '../ui/layout';

/**
 * Tarjeta con una etiqueta (fórmula CO/H, CA/H, CO/CA, o nombre de función
 * seno/coseno/tangente, según el juego) que se mueve por la pantalla
 */
export class Card extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private labelText: Phaser.GameObjects.Text;
  private value: string;
  private isCorrectAnswer: boolean;
  private velocityX: number;
  private velocityY: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    value: string,
    isCorrect: boolean,
    velocityX: number,
    velocityY: number
  ) {
    super(scene, x, y);

    this.value = value;
    this.isCorrectAnswer = isCorrect;
    this.velocityX = velocityX;
    this.velocityY = velocityY;

    this.background = scene.add.graphics();
    this.drawCardBackground();

    this.labelText = scene.add.text(0, 0, value.toUpperCase(), {
      fontSize: FONT_SIZE.xxlPlus,
      color: COLOR.white,
      fontStyle: 'bold',
      align: 'center'
    });
    this.labelText.setOrigin(0.5);

    this.add([this.background, this.labelText]);

    scene.add.existing(this);

    this.setDepth(50);

    // En pantallas pequeñas la tarjeta se agranda para seguir siendo tocable (1 en escritorio).
    // El texto se dibuja a mayor resolución para que no se vea borroso al agrandarse.
    const cardScale = getLayout(scene).cardScale;
    this.setScale(cardScale);
    this.labelText.setResolution(cardScale);

    this.setSize(CARD_CONFIG.CARD_WIDTH, CARD_CONFIG.CARD_HEIGHT);
    this.setInteractive(
      new Phaser.Geom.Rectangle(
        -CARD_CONFIG.CARD_WIDTH / 2,
        -CARD_CONFIG.CARD_HEIGHT / 2,
        CARD_CONFIG.CARD_WIDTH,
        CARD_CONFIG.CARD_HEIGHT
      ),
      Phaser.Geom.Rectangle.Contains
    );
  }

  private drawCardBackground(): void {
    const halfWidth = CARD_CONFIG.CARD_WIDTH / 2;
    const halfHeight = CARD_CONFIG.CARD_HEIGHT / 2;

    this.background.fillStyle(0x2c3e50, 1);
    this.background.fillRoundedRect(
      -halfWidth,
      -halfHeight,
      CARD_CONFIG.CARD_WIDTH,
      CARD_CONFIG.CARD_HEIGHT,
      10
    );

    this.background.lineStyle(3, 0x3498db, 1);
    this.background.strokeRoundedRect(
      -halfWidth,
      -halfHeight,
      CARD_CONFIG.CARD_WIDTH,
      CARD_CONFIG.CARD_HEIGHT,
      10
    );
  }

  public updateMovement(delta: number): void {
    const deltaSeconds = delta / 1000;

    this.x += this.velocityX * deltaSeconds;
    this.y += this.velocityY * deltaSeconds;
  }

  public isOutOfBounds(worldWidth: number, worldHeight: number): boolean {
    const margin = 100;
    return (
      this.x < -margin ||
      this.x > worldWidth + margin ||
      this.y < -margin ||
      this.y > worldHeight + margin
    );
  }

  public getValue(): string {
    return this.value;
  }

  public isCorrect(): boolean {
    return this.isCorrectAnswer;
  }

  public showHitCorrectEffect(): void {
    CardExplosion.create(this.scene, this.x, this.y, true);
    this.destroy();
  }

  public showHitWrongEffect(): void {
    CardExplosion.create(this.scene, this.x, this.y, false);
    this.destroy();
  }
}
