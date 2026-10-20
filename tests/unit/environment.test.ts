import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectInAppBrowser, isTouchDevice } from '../../src/utils/environment';

// User-Agents reales (resumidos)
const UA = {
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 14; SM-A556E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
  safariIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  chromeIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0.0.0 Mobile/15E148 Safari/604.1',
  firefoxIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/126.0 Mobile/15E148 Safari/605.1.15',
  desktopChrome:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  instagramAndroid:
    'Mozilla/5.0 (Linux; Android 14; SM-A556E Build/UP1A) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.0.0 Mobile Safari/537.36 Instagram 330.0.0.40.100 Android',
  instagramIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.1.19.100',
  facebookAndroid:
    'Mozilla/5.0 (Linux; Android 14; SM-A556E Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/460.0.0.0;]',
  facebookIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/460.0;FBBV/1;]',
  whatsappWebView:
    'Mozilla/5.0 (Linux; Android 14; SM-A556E Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.0.0 Mobile Safari/537.36',
  iosWebViewGenerico:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
};

describe('detectInAppBrowser', () => {
  it.each([
    ['Chrome en Android', UA.chromeAndroid],
    ['Safari en iPhone', UA.safariIos],
    ['Chrome en iPhone', UA.chromeIos],
    ['Firefox en iPhone', UA.firefoxIos],
    ['Chrome de escritorio', UA.desktopChrome],
  ])('%s es un navegador normal', (_name, ua) => {
    expect(detectInAppBrowser(ua)).toBeNull();
  });

  it.each([
    ['Instagram en Android', UA.instagramAndroid, 'Instagram'],
    ['Instagram en iPhone', UA.instagramIos, 'Instagram'],
    ['Facebook en Android', UA.facebookAndroid, 'Facebook'],
    ['Facebook en iPhone', UA.facebookIos, 'Facebook'],
  ])('reconoce %s', (_name, ua, app) => {
    expect(detectInAppBrowser(ua)).toBe(app);
  });

  it('un WebView de Android sin marca (como el de WhatsApp) se reconoce como otra app', () => {
    expect(detectInAppBrowser(UA.whatsappWebView)).toBe('otra app');
  });

  it('un WebView de iOS (sin "Safari") se reconoce como otra app', () => {
    expect(detectInAppBrowser(UA.iosWebViewGenerico)).toBe('otra app');
  });

  it('reconoce por nombre las apps frecuentes', () => {
    expect(detectInAppBrowser('... WhatsApp/2.24 ...')).toBe('WhatsApp');
    expect(detectInAppBrowser('... TikTok 33.0 ...')).toBe('TikTok');
    expect(detectInAppBrowser('... Snapchat/12.0 ...')).toBe('Snapchat');
    expect(detectInAppBrowser('... Line/14.0 ...')).toBe('Line');
    expect(detectInAppBrowser('... MicroMessenger/8.0 ...')).toBe('WeChat');
  });

  it('una cadena vacía no es un navegador incrustado', () => {
    expect(detectInAppBrowser('')).toBeNull();
  });
});

describe('isTouchDevice', () => {
  afterEach(() => vi.restoreAllMocks());

  it('es verdadero con puntero grueso (dedo)', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    expect(isTouchDevice()).toBe(true);
  });

  it('es falso con ratón', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
    expect(isTouchDevice()).toBe(false);
  });
});
