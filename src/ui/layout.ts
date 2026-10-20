import type Phaser from 'phaser';

/**
 * Medidas que dependen de la escala a la que se muestra el canvas.
 *
 * El mundo del juego mide 800 de alto y entre 1200 y 1800 de ancho. En un celular el canvas se muestra reducido (≈ 0,5×) y
 * lo dibujado queda diminuto y difícil de tocar. Aquí vive la única fórmula que compensa esa
 * reducción; ningún otro código decide por tipo de dispositivo. Con escala 1 (escritorio) todos
 * los valores son neutros: cardScale = 1, hudScale = 1, hitSlop = 0.
 */
export interface Layout {
  /** Escala a la que se muestra el canvas (1 = tamaño natural) */
  displayScale: number;
  /** Factor de tamaño de las tarjetas */
  cardScale: number;
  /** Factor de tamaño del HUD (pregunta, puntaje, tiempo) */
  hudScale: number;
  /** Margen extra de impacto alrededor de cada tarjeta, en píxeles del mundo */
  hitSlop: number;
  /** Factor de tamaño de la mira */
  crosshairScale: number;
  /** Fracción de MAX_CARDS_ON_SCREEN permitida (menos tarjetas en pantallas pequeñas) */
  maxCardsFactor: number;
  /** El canvas se muestra tan reducido que las pantallas densas (tablas, panel admin) no son usables */
  compact: boolean;
}

/** Alto del mundo del juego: fijo. El ancho se adapta a la pantalla (ver computeWorldWidth). */
export const WORLD_HEIGHT = 800;
/** Ancho mínimo del mundo (proporción 3:2) y máximo (≈ 2,25:1, pantallas muy alargadas) */
export const MIN_WORLD_WIDTH = 1200;
export const MAX_WORLD_WIDTH = 1800;

/** Alto mínimo de una tarjeta en pantalla, en px (una tarjeta de escritorio mide 80) */
export const MIN_CARD_SCREEN_HEIGHT = 56;
/** El HUD no debe verse por debajo de esta fracción de su tamaño natural */
export const MIN_HUD_SCREEN_SCALE = 0.7;
/** Tolerancia de puntería con el dedo, en px de pantalla, cuando el canvas está reducido a 0 */
export const TOUCH_SLOP_SCREEN_PX = 24;

/** Por debajo de esta escala de visualización se usan las variantes compactas de las pantallas */
export const COMPACT_BELOW_SCALE = 0.75;

const CARD_SCALE_MAX = 1.35;
const MAX_CARDS_FACTOR_MIN = 0.6;
const HUD_SCALE_MAX = 1.6;
const CROSSHAIR_SCALE_MAX = 1.8;
const CARD_HEIGHT = 80;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Función pura: de la escala de visualización a las medidas del juego. */
export function computeLayout(displayScale: number): Layout {
  const s = clamp(displayScale, 0.1, 1);
  return {
    displayScale: s,
    cardScale: clamp(MIN_CARD_SCREEN_HEIGHT / (CARD_HEIGHT * s), 1, CARD_SCALE_MAX),
    hudScale: clamp(MIN_HUD_SCREEN_SCALE / s, 1, HUD_SCALE_MAX),
    // Continuo: 0 a escala 1 y crece al reducirse el canvas
    hitSlop: (TOUCH_SLOP_SCREEN_PX * (1 - s)) / s,
    crosshairScale: clamp(1 / (s * 1.2), 1, CROSSHAIR_SCALE_MAX),
    maxCardsFactor: clamp(1 - 0.8 * (1 - s), MAX_CARDS_FACTOR_MIN, 1),
    compact: s < COMPACT_BELOW_SCALE,
  };
}

/** Escala a la que se está mostrando el canvas del juego. */
export function getDisplayScale(scene: Phaser.Scene): number {
  const { displaySize, gameSize } = scene.scale;
  return gameSize.width > 0 ? displaySize.width / gameSize.width : 1;
}

export function getLayout(scene: Phaser.Scene): Layout {
  return computeLayout(getDisplayScale(scene));
}

/**
 * Ancho del mundo del juego para una pantalla: el alto es fijo (800) y el ancho sigue la proporción
 * de la pantalla, entre 1200 (3:2, como antes) y 1800, para que el juego llene el ancho de pantallas
 * alargadas (≈ 20:9) en vez de dejar franjas negras. Se calcula una sola vez al arrancar, con la
 * dimensión mayor como ancho: así da lo mismo si la página se abre con el celular en vertical.
 */
export function computeWorldWidth(viewportWidth: number, viewportHeight: number): number {
  const long = Math.max(viewportWidth, viewportHeight);
  const short = Math.max(1, Math.min(viewportWidth, viewportHeight));
  const width = clamp(Math.round((WORLD_HEIGHT * long) / short), MIN_WORLD_WIDTH, MAX_WORLD_WIDTH);
  return width - (width % 2);
}
