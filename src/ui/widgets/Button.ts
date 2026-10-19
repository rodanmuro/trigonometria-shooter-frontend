import Phaser from 'phaser';
import { COLOR } from '../theme';

export interface ButtonHover {
  /** Color de fondo mientras el puntero está encima */
  bg?: string;
  /** Transparencia mientras el puntero está encima */
  alpha?: number;
  /** Escala mientras el puntero está encima */
  scale?: number;
}

export interface ButtonStyle {
  fontSize: string;
  bg: string;
  padding: { x: number; y: number };
  /** Color del texto (por defecto blanco) */
  color?: string;
  /** Origen del texto (por defecto 0.5, 0.5) */
  origin?: { x: number; y: number };
  hover?: ButtonHover;
  /** Escala base del botón (1 por defecto); la escala del hover se aplica sobre ella */
  scale?: number;
  /** Estilo de texto adicional (fontStyle, stroke, strokeThickness…) */
  extra?: Phaser.Types.GameObjects.Text.TextStyle;
  depth?: number;
}

export interface ButtonOptions extends ButtonStyle {
  x: number;
  y: number;
  text: string;
  onClick?: () => void;
}

/**
 * Botón de texto de Phaser: texto con fondo, cursor de mano y efecto hover.
 */
export function createButton(scene: Phaser.Scene, opts: ButtonOptions): Phaser.GameObjects.Text {
  const btn = scene.add.text(opts.x, opts.y, opts.text, {
    ...opts.extra,
    fontSize: opts.fontSize,
    color: opts.color ?? COLOR.white,
    backgroundColor: opts.bg,
    padding: opts.padding,
  });
  const origin = opts.origin ?? { x: 0.5, y: 0.5 };
  btn.setOrigin(origin.x, origin.y);
  const baseScale = opts.scale ?? 1;
  btn.setScale(baseScale);
  if (baseScale !== 1) btn.setResolution(baseScale);
  if (opts.depth !== undefined) btn.setDepth(opts.depth);
  btn.setInteractive({ useHandCursor: true });

  if (opts.onClick) btn.on('pointerdown', opts.onClick);

  const hover = opts.hover;
  if (hover) {
    btn.on('pointerover', () => {
      if (hover.bg !== undefined) btn.setStyle({ backgroundColor: hover.bg });
      if (hover.alpha !== undefined) btn.setAlpha(hover.alpha);
      if (hover.scale !== undefined) btn.setScale(baseScale * hover.scale);
    });
    btn.on('pointerout', () => {
      if (hover.bg !== undefined) btn.setStyle({ backgroundColor: opts.bg });
      if (hover.alpha !== undefined) btn.setAlpha(1);
      if (hover.scale !== undefined) btn.setScale(baseScale);
    });
  }

  return btn;
}
