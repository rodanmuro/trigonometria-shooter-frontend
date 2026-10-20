/**
 * Formatos de tiempo y fecha compartidos por todas las pantallas.
 * Las fechas usan siempre `es-ES` (dd/mm/aaaa, hh:mm), sin depender del
 * idioma del navegador.
 */

const LOCALE = 'es-ES';

/** Duración en segundos con minutos sin relleno: `5:07` */
export function formatClock(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** `20/03/2026` */
export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** `14:05` */
export function formatTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** `20/03 14:05` (sin año, para pantallas pequeñas) */
export function formatDateTimeShort(value: string | Date): string {
  // Se recorta formatDate (dd/mm/aaaa): pedirle al navegador solo día y mes da "28/3" en Chrome
  return `${formatDate(value).slice(0, 5)} ${formatTime(value)}`;
}
