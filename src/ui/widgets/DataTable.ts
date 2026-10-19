import Phaser from 'phaser';
import { COLOR, FONT_SIZE } from '../theme';

/** Contenido de una celda de texto */
export interface TableCell {
  text: string;
  color: string;
  fontSize?: string;
  fontStyle?: string;
}

export interface TableColumn<T> {
  header: string;
  /** Desplazamiento horizontal del encabezado respecto al centro de la tabla */
  headerX: number;
  /** Desplazamiento horizontal de las celdas respecto al centro de la tabla */
  x: number;
  /** Texto de la celda */
  cell?: (row: T, index: number) => TableCell;
  /** Celda personalizada (un botón, por ejemplo); recibe coordenadas absolutas */
  render?: (row: T, x: number, y: number) => Phaser.GameObjects.GameObject;
  /** Si existe, el encabezado ordena por este campo al hacer clic */
  sortField?: string;
}

export interface RowBackground {
  width: number;
  height: number;
  fill: number;
  alpha: number;
  stroke?: { width: number; color: number };
  /** Colores de relleno al pasar el puntero: [color, alpha?] */
  hover?: { over: [number, number?]; out: [number, number?] };
  onClick?: (index: number) => void;
}

export interface DataTableOptions<T> {
  centerX: number;
  columns: TableColumn<T>[];
  rows: T[];
  maxRows: number;
  header: {
    y: number;
    width: number;
    fontSize: string;
    /** Color de los encabezados que no ordenan (por defecto, el mismo que los que sí) */
    inactiveColor?: string;
  };
  /** Ordenamiento actual y manejador, si la tabla es ordenable */
  sort?: { by?: string; order?: string; onSort: (field: string) => void };
  /** Factor de tamaño del texto de encabezados y celdas (1 por defecto) */
  textScale?: number;
  firstRowY: number;
  rowSpacing: number;
  rowBackground: RowBackground;
  /** Si es true, cada fila es un contenedor (que recibe `onCreate`) en vez de objetos sueltos */
  rowContainers?: boolean;
  /** Se invoca por cada objeto (o contenedor de fila) creado, para que la escena lo registre */
  onCreate: (obj: Phaser.GameObjects.GameObject) => void;
}

/**
 * Tabla con columnas declarativas: encabezado (con ordenamiento opcional) y filas
 * con fondo, celdas de texto o personalizadas. No sabe de qué datos se trata.
 */
export function createDataTable<T>(scene: Phaser.Scene, opts: DataTableOptions<T>): void {
  createHeader(scene, opts);

  opts.rows.slice(0, opts.maxRows).forEach((row, index) => {
    const y = opts.firstRowY + index * opts.rowSpacing;
    createRow(scene, opts, row, index, y);
  });
}

function createHeader<T>(scene: Phaser.Scene, opts: DataTableOptions<T>): void {
  const { centerX, header } = opts;

  const bg = scene.add
    .rectangle(centerX, header.y, header.width, 35, 0x1a1a2e, 1)
    .setStrokeStyle(2, 0xffff00)
    .setDepth(100);
  opts.onCreate(bg);

  opts.columns.forEach((column) => {
    const sortable = opts.sort !== undefined && column.sortField !== undefined;
    const indicator =
      sortable && opts.sort!.by === column.sortField ? (opts.sort!.order === 'asc' ? ' ▲' : ' ▼') : '';
    const color =
      opts.sort && !sortable && header.inactiveColor ? header.inactiveColor : COLOR.yellow;

    const text = scene.add
      .text(centerX + column.headerX, header.y, column.header + indicator, {
        fontSize: header.fontSize,
        color,
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setDepth(101);
    applyTextScale(text, opts.textScale);
    opts.onCreate(text);

    if (sortable) {
      text.setInteractive({ useHandCursor: true });
      text.on('pointerdown', () => opts.sort!.onSort(column.sortField!));
      text.on('pointerover', () => text.setColor(COLOR.white));
      text.on('pointerout', () => text.setColor(COLOR.yellow));
    }
  });
}

function createRow<T>(
  scene: Phaser.Scene,
  opts: DataTableOptions<T>,
  row: T,
  index: number,
  y: number
): void {
  const { centerX, rowBackground: rb } = opts;
  const container = opts.rowContainers ? scene.add.container(0, 0) : null;
  const register = (obj: Phaser.GameObjects.GameObject) => {
    if (container) container.add(obj);
    else opts.onCreate(obj);
  };

  const bg = scene.add.rectangle(centerX, y, rb.width, rb.height, rb.fill, rb.alpha);
  if (rb.stroke) bg.setStrokeStyle(rb.stroke.width, rb.stroke.color);
  if (rb.onClick || rb.hover) bg.setInteractive({ useHandCursor: true });
  register(bg);

  opts.columns.forEach((column) => {
    if (column.render) {
      register(column.render(row, centerX + column.x, y));
    } else if (column.cell) {
      const cell = column.cell(row, index);
      const text = scene.add
        .text(centerX + column.x, y, cell.text, {
          fontSize: cell.fontSize ?? FONT_SIZE.xs,
          color: cell.color,
          ...(cell.fontStyle ? { fontStyle: cell.fontStyle } : {}),
        })
        .setOrigin(0, 0.5);
      applyTextScale(text, opts.textScale);
      register(text);
    }
  });

  if (rb.onClick) bg.on('pointerdown', () => rb.onClick!(index));
  if (rb.hover) {
    const { over, out } = rb.hover;
    bg.on('pointerover', () => bg.setFillStyle(...over));
    bg.on('pointerout', () => bg.setFillStyle(...out));
  }

  if (container) opts.onCreate(container);
}

/** Agranda el texto y lo dibuja a mayor resolución para que no se vea borroso. */
function applyTextScale(text: Phaser.GameObjects.Text, scale = 1): void {
  if (scale === 1) return;
  text.setScale(scale);
  text.setResolution(scale);
}
