import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enableFullscreenOnFirstTouch } from '../../src/ui/fullscreen';

function setTouch(coarse: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: coarse }) as unknown as typeof window.matchMedia;
}

function setFullscreenSupport(enabled: boolean) {
  Object.defineProperty(document, 'fullscreenEnabled', { value: enabled, configurable: true });
}

const tap = () => document.dispatchEvent(new Event('pointerup'));
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('enableFullscreenOnFirstTouch', () => {
  let request: ReturnType<typeof vi.fn>;
  let lock: ReturnType<typeof vi.fn>;
  let off: () => void;

  beforeEach(() => {
    request = vi.fn().mockResolvedValue(undefined);
    lock = vi.fn().mockResolvedValue(undefined);
    document.documentElement.requestFullscreen = request as unknown as typeof document.documentElement.requestFullscreen;
    Object.defineProperty(screen, 'orientation', { value: { lock }, configurable: true });
    setFullscreenSupport(true);
  });

  afterEach(() => off?.());

  it('en un dispositivo táctil, el primer toque pide pantalla completa y bloquea en horizontal', async () => {
    setTouch(true);
    off = enableFullscreenOnFirstTouch();

    tap();
    await flush();

    expect(request).toHaveBeenCalledTimes(1);
    expect(lock).toHaveBeenCalledWith('landscape');
  });

  it('solo lo intenta una vez', async () => {
    setTouch(true);
    off = enableFullscreenOnFirstTouch();

    tap();
    await flush();
    tap();
    tap();
    await flush();

    expect(request).toHaveBeenCalledTimes(1);
  });

  it('con ratón no hace nada', async () => {
    setTouch(false);
    off = enableFullscreenOnFirstTouch();

    tap();
    await flush();

    expect(request).not.toHaveBeenCalled();
  });

  it('si el navegador no ofrece pantalla completa (iPhone) no hace nada', async () => {
    setTouch(true);
    setFullscreenSupport(false);
    off = enableFullscreenOnFirstTouch();

    tap();
    await flush();

    expect(request).not.toHaveBeenCalled();
  });

  it('si el navegador rechaza la pantalla completa, no lanza errores ni bloquea la orientación', async () => {
    setTouch(true);
    request.mockRejectedValue(new Error('denegado'));
    off = enableFullscreenOnFirstTouch();

    tap();
    await flush();

    expect(lock).not.toHaveBeenCalled();
  });

  it('si el bloqueo de orientación falla, el juego sigue', async () => {
    setTouch(true);
    lock.mockRejectedValue(new Error('no soportado'));
    off = enableFullscreenOnFirstTouch();

    tap();
    await flush();

    expect(request).toHaveBeenCalledTimes(1);
  });

  it('la función devuelta quita el escuchador', async () => {
    setTouch(true);
    off = enableFullscreenOnFirstTouch();
    off();

    tap();
    await flush();

    expect(request).not.toHaveBeenCalled();
  });

  describe('botón ⛶', () => {
    let button: HTMLButtonElement;

    beforeEach(() => {
      button = document.createElement('button');
      button.id = 'fullscreen-btn';
      button.hidden = true;
      document.body.appendChild(button);
      Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
    });

    afterEach(() => {
      button.remove();
      Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
    });

    it('se muestra en un táctil que admite pantalla completa y al pulsarlo la pide', async () => {
      setTouch(true);
      off = enableFullscreenOnFirstTouch();

      expect(button.hidden).toBe(false);
      button.click();
      await flush();

      expect(request).toHaveBeenCalledTimes(1);
      expect(lock).toHaveBeenCalledWith('landscape');
    });

    it('se oculta al entrar en pantalla completa y reaparece al salir', () => {
      setTouch(true);
      off = enableFullscreenOnFirstTouch();

      Object.defineProperty(document, 'fullscreenElement', { value: document.documentElement, configurable: true });
      document.dispatchEvent(new Event('fullscreenchange'));
      expect(button.hidden).toBe(true);

      Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
      document.dispatchEvent(new Event('fullscreenchange'));
      expect(button.hidden).toBe(false);
    });

    it('con ratón o sin soporte, sigue oculto', () => {
      setTouch(false);
      off = enableFullscreenOnFirstTouch();
      expect(button.hidden).toBe(true);

      setTouch(true);
      setFullscreenSupport(false);
      off = enableFullscreenOnFirstTouch();
      expect(button.hidden).toBe(true);
    });

    it('al desactivar vuelve a quedar oculto y sin escuchador', async () => {
      setTouch(true);
      off = enableFullscreenOnFirstTouch();
      off();

      expect(button.hidden).toBe(true);
      button.click();
      await flush();
      expect(request).not.toHaveBeenCalled();
    });
  });
});
