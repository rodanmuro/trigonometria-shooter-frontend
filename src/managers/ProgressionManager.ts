import { PROGRESSION_CONFIG } from '../utils/constants';

/**
 * Calcula el nivel de dificultad y el multiplicador de velocidad de las
 * cartas a partir del puntaje acumulado en la sesión.
 */
export class ProgressionManager {
  private level: number = 1;

  /**
   * Recalcula el nivel según el puntaje actual.
   * @returns true si el nivel subió respecto al anterior
   */
  public updateProgress(score: number): boolean {
    const newLevel = Math.floor(Math.max(score, 0) / PROGRESSION_CONFIG.POINTS_PER_LEVEL) + 1;
    const leveledUp = newLevel > this.level;
    this.level = newLevel;
    return leveledUp;
  }

  public getCurrentLevel(): number {
    return this.level;
  }

  /**
   * Multiplicador de velocidad para las cartas, escalando linealmente
   * hasta MAX_LEVEL_FOR_INCREMENT y luego manteniéndose constante.
   */
  public getSpeedMultiplier(): number {
    const { MIN_MULTIPLIER, MAX_MULTIPLIER, INCREMENT, MAX_LEVEL_FOR_INCREMENT } = PROGRESSION_CONFIG.SPEED_SCALE;
    const effectiveLevel = Math.min(this.level, MAX_LEVEL_FOR_INCREMENT);
    const multiplier = MIN_MULTIPLIER + (effectiveLevel - 1) * INCREMENT;
    return Math.min(multiplier, MAX_MULTIPLIER);
  }
}
