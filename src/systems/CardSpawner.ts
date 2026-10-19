import Phaser from 'phaser';
import { Card } from '../entities/Card';
import { CARD_CONFIG } from '../utils/constants';
import { getLayout } from '../ui/layout';
import { getOtherLabels, randomInt } from '../utils/mathHelpers';

type SpawnEdge = 'top' | 'bottom' | 'left' | 'right';

/**
 * Sistema encargado de generar y gestionar las tarjetas de respuesta.
 * Genérico sobre el pool de etiquetas: sirve tanto para las fórmulas del
 * Juego 1 (CO/H, CA/H, CO/CA) como para los nombres de función del Juego 2
 * (seno, coseno, tangente).
 */
export class CardSpawner {
  private scene: Phaser.Scene;
  private cards: Card[] = [];
  private pool: string[] = [];
  private correctLabel: string | null = null;
  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private worldWidth: number;
  private worldHeight: number;
  private speedMultiplier: number = 1.0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.worldWidth = scene.cameras.main.width;
    this.worldHeight = scene.cameras.main.height;
  }

  /**
   * Ajusta la velocidad de las próximas tarjetas a generar (progresión de dificultad)
   */
  public setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = multiplier;
  }

  /**
   * Máximo de tarjetas simultáneas: el de CARD_CONFIG, reducido en pantallas pequeñas para que el
   * campo no se sature (20 en escritorio)
   */
  public getMaxCards(): number {
    return Math.round(CARD_CONFIG.MAX_CARDS_ON_SCREEN * getLayout(this.scene).maxCardsFactor);
  }

  /**
   * Inicia el spawn de tarjetas para una nueva pregunta
   * @param pool Las etiquetas posibles (siempre 3, una de ellas correcta)
   * @param correctLabel Cuál de las etiquetas del pool es la correcta
   */
  public startSpawning(pool: string[], correctLabel: string): void {
    this.pool = pool;
    this.correctLabel = correctLabel;

    this.clearAllCards();

    this.spawnTimer = this.scene.time.addEvent({
      delay: CARD_CONFIG.SPAWN_INTERVAL,
      callback: this.spawnCard,
      callbackScope: this,
      loop: true
    });

    this.spawnCard();
  }

  public stopSpawning(): void {
    if (this.spawnTimer) {
      this.spawnTimer.remove();
      this.spawnTimer = null;
    }
  }

  private spawnCard(): void {
    if (!this.correctLabel) return;

    if (this.cards.length >= this.getMaxCards()) {
      return;
    }

    const shouldBeCorrect = Math.random() < CARD_CONFIG.CORRECT_CARD_PROBABILITY;

    let value: string;
    let isCorrect: boolean;

    if (shouldBeCorrect) {
      value = this.correctLabel;
      isCorrect = true;
    } else {
      const wrongLabels = getOtherLabels(this.pool, this.correctLabel);
      value = wrongLabels[randomInt(0, wrongLabels.length - 1)];
      isCorrect = false;
    }

    const edge = this.getRandomEdge();
    const spawnData = this.getSpawnPosition(edge);

    const card = new Card(
      this.scene,
      spawnData.x,
      spawnData.y,
      value,
      isCorrect,
      spawnData.velocityX,
      spawnData.velocityY
    );

    this.cards.push(card);
  }

  private getRandomEdge(): SpawnEdge {
    const edges: SpawnEdge[] = ['top', 'bottom', 'left', 'right'];
    return edges[randomInt(0, edges.length - 1)];
  }

  private getSpawnPosition(edge: SpawnEdge): {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
  } {
    const speed = randomInt(CARD_CONFIG.MIN_SPEED, CARD_CONFIG.MAX_SPEED) * this.speedMultiplier;
    const margin = 50;

    switch (edge) {
      case 'top':
        return {
          x: randomInt(margin, this.worldWidth - margin),
          y: -margin,
          velocityX: randomInt(-50, 50),
          velocityY: speed
        };

      case 'bottom':
        return {
          x: randomInt(margin, this.worldWidth - margin),
          y: this.worldHeight + margin,
          velocityX: randomInt(-50, 50),
          velocityY: -speed
        };

      case 'left':
        return {
          x: -margin,
          y: randomInt(margin, this.worldHeight - margin),
          velocityX: speed,
          velocityY: randomInt(-50, 50)
        };

      case 'right':
        return {
          x: this.worldWidth + margin,
          y: randomInt(margin, this.worldHeight - margin),
          velocityX: -speed,
          velocityY: randomInt(-50, 50)
        };
    }
  }

  public update(delta: number): void {
    for (let i = this.cards.length - 1; i >= 0; i--) {
      const card = this.cards[i];

      card.updateMovement(delta);

      if (card.isOutOfBounds(this.worldWidth, this.worldHeight)) {
        card.destroy();
        this.cards.splice(i, 1);
      }
    }
  }

  public checkHit(x: number, y: number): Card | null {
    // Margen extra de impacto cuando el canvas se muestra reducido (0 en escritorio)
    const slop = getLayout(this.scene).hitSlop;

    for (const card of this.cards) {
      // Área de impacto según el tamaño (escalado) de la tarjeta
      const halfWidth = (CARD_CONFIG.CARD_WIDTH * card.scaleX) / 2 + slop;
      const halfHeight = (CARD_CONFIG.CARD_HEIGHT * card.scaleY) / 2 + slop;

      const left = card.x - halfWidth;
      const right = card.x + halfWidth;
      const top = card.y - halfHeight;
      const bottom = card.y + halfHeight;

      if (x >= left && x <= right && y >= top && y <= bottom) {
        return card;
      }
    }
    return null;
  }

  public removeCard(card: Card): void {
    const index = this.cards.indexOf(card);
    if (index > -1) {
      this.cards.splice(index, 1);
    }
  }

  public getCards(): Card[] {
    return this.cards;
  }

  public clearAllCards(): void {
    for (const card of this.cards) {
      card.destroy();
    }
    this.cards = [];
  }

  public destroy(): void {
    this.stopSpawning();
    this.clearAllCards();
  }
}
