/**
 * Genera un número aleatorio entre min y max (inclusivo)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Devuelve las etiquetas incorrectas de un pool de 3 posibles (las otras 2, sin la correcta).
 * Genérico: sirve tanto para fórmulas (CO/H, CA/H, CO/CA) como para nombres de función
 * (seno, coseno, tangente).
 */
export function getOtherLabels<T>(pool: T[], correct: T): T[] {
  return pool.filter((label) => label !== correct);
}

/**
 * Mezcla un array usando el algoritmo de Fisher-Yates
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
