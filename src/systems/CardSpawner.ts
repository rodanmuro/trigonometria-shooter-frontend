import Phaser from 'phaser';
import { Card } from '../entities/Card';
import type { Question, RatioLabel } from '../types';
import { CARD_CONFIG } from '../utils/constants';
import { getWrongRatios, randomInt } from '../utils/mathHelpers';

type SpawnEdge = 'top' | 'bottom' | 'left' | 'right';

/**
 * Sistema encargado de generar y gestionar las tarjetas de fórmula
 */
export class CardSpawner {
  private scene: Phaser.Scene;
  private cards: Card[] = [];
  private currentQuestion: Question | null = null;
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
   * Inicia el spawn de tarjetas para una nueva pregunta
   */
  public startSpawning(question: Question): void {
    this.currentQuestion = question;

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
    if (!this.currentQuestion) return;

    if (this.cards.length >= CARD_CONFIG.MAX_CARDS_ON_SCREEN) {
      return;
    }

    const shouldBeCorrect = Math.random() < CARD_CONFIG.CORRECT_CARD_PROBABILITY;

    let value: RatioLabel;
    let isCorrect: boolean;

    if (shouldBeCorrect) {
      value = this.currentQuestion.correctRatio;
      isCorrect = true;
    } else {
      const wrongRatios = getWrongRatios(this.currentQuestion.correctRatio);
      value = wrongRatios[randomInt(0, wrongRatios.length - 1)];
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
    for (const card of this.cards) {
      const halfWidth = CARD_CONFIG.CARD_WIDTH / 2;
      const halfHeight = CARD_CONFIG.CARD_HEIGHT / 2;

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
