import Phaser from 'phaser';

export interface ModalOptions {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  fill: number;
  fillAlpha: number;
  strokeWidth: number;
  strokeColor: number;
  /** Capa oscura que cubre toda la pantalla y bloquea los clics de abajo */
  backdrop?: { width: number; height: number; alpha: number };
}

export interface ModalFrame {
  backdrop?: Phaser.GameObjects.Rectangle;
  panel: Phaser.GameObjects.Rectangle;
}

/**
 * Marco de un modal: capa oscura opcional (interactiva, para tragarse los
 * clics) y panel con borde. El contenido lo añade quien lo llama.
 */
export function createModalFrame(scene: Phaser.Scene, opts: ModalOptions): ModalFrame {
  let backdrop: Phaser.GameObjects.Rectangle | undefined;
  if (opts.backdrop) {
    backdrop = scene.add.rectangle(
      opts.centerX,
      opts.centerY,
      opts.backdrop.width,
      opts.backdrop.height,
      0x000000,
      opts.backdrop.alpha
    );
    backdrop.setInteractive();
  }

  const panel = scene.add.rectangle(
    opts.centerX,
    opts.centerY,
    opts.width,
    opts.height,
    opts.fill,
    opts.fillAlpha
  );
  panel.setStrokeStyle(opts.strokeWidth, opts.strokeColor);

  return { backdrop, panel };
}
