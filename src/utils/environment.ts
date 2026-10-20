/**
 * Detección del entorno en que corre el juego.
 * La adaptación del diseño a la pantalla vive en `ui/layout.ts`; aquí solo se reconoce el entorno.
 */

/** ¿El dispositivo se maneja con el dedo (pantalla táctil como puntero principal)? */
export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true;
}

/** Aplicaciones cuyo navegador incrustado se reconoce por su User-Agent, en orden de prioridad */
const IN_APP_BROWSERS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Instagram', pattern: /Instagram/i },
  { name: 'Facebook', pattern: /FBAN|FBAV|FB_IAB|FBIOS/i },
  { name: 'WhatsApp', pattern: /WhatsApp/i },
  { name: 'TikTok', pattern: /TikTok|musical_ly|BytedanceWebview/i },
  { name: 'Snapchat', pattern: /Snapchat/i },
  { name: 'LinkedIn', pattern: /LinkedInApp/i },
  { name: 'Line', pattern: /\bLine\//i },
  { name: 'WeChat', pattern: /MicroMessenger/i },
  { name: 'Twitter', pattern: /Twitter/i },
  { name: 'Telegram', pattern: /Telegram/i },
];

/**
 * Si el User-Agent corresponde al navegador incrustado de una app (donde Google bloquea el inicio
 * de sesión con `disallowed_useragent`), devuelve el nombre de la app, o "otra app" si solo se
 * reconoce que es un WebView genérico. Devuelve `null` en un navegador normal.
 */
export function detectInAppBrowser(userAgent: string): string | null {
  for (const { name, pattern } of IN_APP_BROWSERS) {
    if (pattern.test(userAgent)) return name;
  }
  // WebView de Android: "...; wv) ..."
  if (/; wv\)/.test(userAgent)) return 'otra app';
  // WebView de iOS: dispositivo Apple sin la marca "Safari" (Safari, Chrome, Firefox… la incluyen)
  if (/(iPhone|iPad|iPod)/.test(userAgent) && !/Safari\//.test(userAgent)) return 'otra app';
  return null;
}
