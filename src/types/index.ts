/**
 * Tipos centrales del juego
 */

export type TrigFunction = 'seno' | 'coseno' | 'tangente';
export type RatioLabel = 'CO/H' | 'CA/H' | 'CO/CA';

/**
 * Pregunta activa: qué razón trigonométrica hay que identificar
 * y cuál es la fórmula (RatioLabel) correcta para esa razón.
 */
export interface Question {
  trigFunction: TrigFunction;
  correctRatio: RatioLabel;
}
