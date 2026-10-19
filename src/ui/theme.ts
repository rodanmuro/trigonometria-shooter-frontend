/**
 * Tokens visuales de los objetos de texto de Phaser.
 *
 * Los valores se conservan exactamente como estaban repartidos por las
 * escenas (incluidos los tamaños "raros" como 15, 26, 30, 42, 52, 56 y 72 px).
 * Unificarlos es una decisión de diseño que se toma al hacerlo responsivo.
 */

export const FONT_SIZE = {
  xs: '14px',
  xsPlus: '15px',
  sm: '16px',
  md: '18px',
  lg: '20px',
  xl: '24px',
  xlPlus: '26px',
  xxl: '28px',
  xxlPlus: '30px',
  title: '32px',
  h1: '42px',
  display: '48px',
  displayPlus: '52px',
  splash: '56px',
  hero: '64px',
  logo: '72px',
} as const;

export const COLOR = {
  white: '#ffffff',
  black: '#000000',
  yellow: '#ffff00',
  red: '#ff0000',
  green: '#00ff00',
  grayLight: '#aaaaaa',
  grayMid: '#888888',
  grayDark: '#333333',
  grayPale: '#cccccc',
  teal: '#4ecdc4',
  mint: '#95e1d3',
  amber: '#ffaa00',
  salmon: '#ff6666',
  navy: '#1a1a2e',
  successDark: '#006633',
} as const;
