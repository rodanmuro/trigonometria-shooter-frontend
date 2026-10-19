/**
 * Detección del entorno en que corre el juego.
 * La adaptación del diseño a la pantalla vive en `ui/layout.ts`; aquí solo se reconoce el entorno.
 */

/** ¿El dispositivo se maneja con el dedo (pantalla táctil como puntero principal)? */
export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true;
}
