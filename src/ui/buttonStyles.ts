import { COLOR, FONT_SIZE } from './theme';
import type { ButtonStyle } from './widgets/Button';

/**
 * Estilo de los botones pequeños de las pantallas de lista (Estadísticas y
 * Admin): texto de 16 px con fondo gris oscuro, anclado a la izquierda, que
 * se atenúa al pasar el puntero.
 */
export const LIST_BUTTON_STYLE: ButtonStyle = {
  fontSize: FONT_SIZE.sm,
  bg: COLOR.grayDark,
  padding: { x: 12, y: 8 },
  origin: { x: 0, y: 0.5 },
  hover: { alpha: 0.8 },
};
