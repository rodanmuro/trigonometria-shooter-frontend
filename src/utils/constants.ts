import type { TrigFunction, RatioLabel } from '../types';
import type { BackendRatio } from '../types/api';

/**
 * Las 3 razones trigonométricas básicas y su fórmula correspondiente
 */
export const TRIG_FUNCTIONS: TrigFunction[] = ['seno', 'coseno', 'tangente'];

export const RATIO_LABELS: Record<TrigFunction, RatioLabel> = {
  seno: 'CO/H',
  coseno: 'CA/H',
  tangente: 'CO/CA',
};

export const ALL_RATIOS: RatioLabel[] = ['CO/H', 'CA/H', 'CO/CA'];

/** Traduce la etiqueta visual (CO/H) al valor esperado por el backend (co_h) */
export const RATIO_TO_BACKEND: Record<RatioLabel, BackendRatio> = {
  'CO/H': 'co_h',
  'CA/H': 'ca_h',
  'CO/CA': 'co_ca',
};

/**
 * Puntuación
 */
export const SCORE = {
  CORRECT_HIT: 10,
  WRONG_HIT: -5,
};

/**
 * Configuración de tarjetas
 */
export const CARD_CONFIG = {
  MAX_CARDS_ON_SCREEN: 5,
  SPAWN_INTERVAL: 900,
  MIN_SPEED: 50,
  MAX_SPEED: 120,
  CARD_WIDTH: 140,
  CARD_HEIGHT: 80,
  CORRECT_CARD_PROBABILITY: 0.4,
};

/**
 * Configuración de UI
 */
export const UI_CONFIG = {
  QUESTION_DISPLAY_Y: 50,
  QUESTION_FONT_SIZE: '38px',
  QUESTION_COLOR: '#ffffff',
  SCORE_DISPLAY_X: 100,
  SCORE_DISPLAY_Y: 50,
  SCORE_FONT_SIZE: '28px',
};

/**
 * Configuración del juego
 */
export const GAME_CONFIG = {
  SESSION_DURATION: 300000, // 5 minutos
};

/**
 * Progresión de dificultad: cada N puntos sube un nivel y las cartas
 * caen más rápido, hasta un tope.
 */
export const PROGRESSION_CONFIG = {
  POINTS_PER_LEVEL: 30, // 3 aciertos correctos por nivel
  SPEED_SCALE: {
    MIN_MULTIPLIER: 1.0,
    MAX_MULTIPLIER: 2.5,
    INCREMENT: 0.15,
    MAX_LEVEL_FOR_INCREMENT: 10,
  },
};
