import Phaser from 'phaser';
import { COLOR } from '../theme';
import { createButton, type ButtonStyle } from './Button';

export interface PaginationOptions {
  centerX: number;
  y: number;
  currentPage: number;
  lastPage: number;
  onChange: (page: number) => void;
  /** Texto del indicador, p. ej. `1 / 5` */
  label: string;
  /** Distancia horizontal entre el centro y cada botón */
  buttonOffset: number;
  button: ButtonStyle;
  labelFontSize: string;
  /** Factor de tamaño del indicador (1 por defecto) */
  labelScale?: number;
}

/**
 * Controles "← Anterior  [indicador]  Siguiente →". Devuelve los objetos
 * creados para que la escena los registre donde corresponda.
 */
export function createPagination(
  scene: Phaser.Scene,
  opts: PaginationOptions
): Phaser.GameObjects.Text[] {
  const created: Phaser.GameObjects.Text[] = [];
  const { centerX, y, currentPage, lastPage, onChange } = opts;

  if (currentPage > 1) {
    created.push(
      createButton(scene, {
        ...opts.button,
        x: centerX - opts.buttonOffset,
        y,
        text: '← Anterior',
        onClick: () => onChange(currentPage - 1),
      })
    );
  }

  created.push(
    scene.add
      .text(centerX, y, opts.label, { fontSize: opts.labelFontSize, color: COLOR.white })
      .setOrigin(0.5)
      .setScale(opts.labelScale ?? 1)
      .setResolution(opts.labelScale ?? 1)
  );

  if (currentPage < lastPage) {
    created.push(
      createButton(scene, {
        ...opts.button,
        x: centerX + opts.buttonOffset,
        y,
        text: 'Siguiente →',
        onClick: () => onChange(currentPage + 1),
      })
    );
  }

  return created;
}
