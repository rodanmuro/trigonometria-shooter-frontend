import { SCORE } from '../utils/constants';

/**
 * Sistema encargado de gestionar la puntuación del jugador
 */
export class ScoreManager {
  private score: number = 0;
  private onScoreChange: ((score: number, delta: number) => void) | null = null;

  constructor() {
    this.score = 0;
  }

  /**
   * Añade puntos por un acierto correcto
   */
  public addCorrectHit(): void {
    const delta = SCORE.CORRECT_HIT;
    this.score += delta;
    this.notifyScoreChange(delta);
  }

  /**
   * Resta puntos por un acierto incorrecto
   */
  public addWrongHit(): void {
    const delta = SCORE.WRONG_HIT;
    this.score += delta;
    // No permitir puntuación negativa
    if (this.score < 0) {
      this.score = 0;
    }
    this.notifyScoreChange(delta);
  }

  /**
   * Obtiene la puntuación actual
   */
  public getScore(): number {
    return this.score;
  }

  /**
   * Reinicia la puntuación
   */
  public reset(): void {
    this.score = 0;
    this.notifyScoreChange(0);
  }

  /**
   * Establece un callback para cuando cambie la puntuación
   */
  public setOnScoreChange(callback: (score: number, delta: number) => void): void {
    this.onScoreChange = callback;
  }

  /**
   * Notifica cambios en la puntuación
   */
  private notifyScoreChange(delta: number): void {
    if (this.onScoreChange) {
      this.onScoreChange(this.score, delta);
    }
  }
}
