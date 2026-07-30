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

/**
 * Juego 2: aplicación en un triángulo rectángulo fijo (ángulo recto en C).
 * Lado a = BC, lado b = AC, lado c = AB (hipotenusa).
 */
export type TriangleSide = 'a' | 'b' | 'c';
export type ReferenceAngle = 'A' | 'B';

export interface TriangleQuestion {
  referenceAngle: ReferenceAngle;
  shownSides: [TriangleSide, TriangleSide];
  /** Valor decorativo o "X" en cada uno de los 2 lados mostrados */
  sideLabels: Partial<Record<TriangleSide, string>>;
  correctFunction: TrigFunction;
}
