import { isTouchDevice } from '../utils/environment';

/**
 * Pantalla completa para celular: el juego gana el espacio de la barra de direcciones.
 *
 * Los navegadores solo la permiten como respuesta a un gesto del usuario, así que se ofrecen dos
 * vías: un botón ⛶ visible (la más fiable) y el primer toque en cualquier parte de la página.
 * Se pide para `documentElement` (no para el canvas) para que los elementos HTML superpuestos
 * (menú de usuario, botón de Google, filtros) sigan visibles. Si el navegador lo permite, se
 * bloquea además la orientación en horizontal.
 *
 * iPhone/iPad no tienen esta API (`fullscreenEnabled` es falso): allí no hace nada y no hay botón.
 */

/** Pide pantalla completa y orientación horizontal. Nunca lanza: si se rechaza, el juego sigue. */
export async function requestGameFullscreen(): Promise<void> {
  try {
    await document.documentElement.requestFullscreen();
    // `lock` no está en los tipos de DOM de TypeScript y solo existe en algunos navegadores
    const orientation = screen.orientation as { lock?: (o: string) => Promise<void> } | undefined;
    await orientation?.lock?.('landscape');
  } catch {
    // Rechazado o sin bloqueo de orientación: el juego sigue igual
  }
}

/**
 * Activa la pantalla completa en dispositivos táctiles: botón ⛶ (si existe `#fullscreen-btn`, se
 * oculta mientras ya está en pantalla completa) y primer toque en la página (solo una vez; si la
 * persona sale de la pantalla completa no se vuelve a imponer). Devuelve una función que lo desactiva.
 */
export function enableFullscreenOnFirstTouch(): () => void {
  if (!isTouchDevice() || !document.fullscreenEnabled) {
    return () => {};
  }

  const onPointerUp = (): void => {
    document.removeEventListener('pointerup', onPointerUp);
    void requestGameFullscreen();
  };
  document.addEventListener('pointerup', onPointerUp);

  const button = document.getElementById('fullscreen-btn');
  const syncButton = (): void => {
    if (button) button.hidden = document.fullscreenElement != null;
  };
  const onButtonClick = (): void => {
    void requestGameFullscreen();
  };
  if (button) {
    syncButton();
    button.addEventListener('click', onButtonClick);
    document.addEventListener('fullscreenchange', syncButton);
  }

  return () => {
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('fullscreenchange', syncButton);
    button?.removeEventListener('click', onButtonClick);
    if (button) button.hidden = true;
  };
}
