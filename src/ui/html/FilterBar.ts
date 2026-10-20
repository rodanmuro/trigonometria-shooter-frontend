import type Phaser from 'phaser';

/**
 * Barra de filtros HTML superpuesta al canvas. Los estilos viven en
 * `style.css` (clases `.filter-*`); aquí solo se crean y retiran los nodos.
 * `anchorToCanvas` la coloca respecto al canvas (no a la página).
 */

export type FilterBarVariant = 'stats' | 'users' | 'sessions';
export type FilterInputSize = 'short' | 'date' | 'wide';

export class FilterBar {
  readonly element: HTMLDivElement;
  private detachAnchor: (() => void) | null = null;

  constructor(variant: FilterBarVariant, id?: string) {
    this.element = document.createElement('div');
    this.element.className = `filter-bar filter-bar--${variant}`;
    if (id) this.element.id = id;
  }

  label(text: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = 'filter-label';
    span.textContent = text;
    return span;
  }

  input(type: string, size?: FilterInputSize): HTMLInputElement {
    const input = document.createElement('input');
    input.type = type;
    input.className = size ? `filter-input filter-input--${size}` : 'filter-input';
    return input;
  }

  select(): HTMLSelectElement {
    const select = document.createElement('select');
    select.className = 'filter-select';
    return select;
  }

  button(text: string, primary = false): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = primary ? 'filter-btn filter-btn--primary' : 'filter-btn';
    button.textContent = text;
    return button;
  }

  /** Variante pequeña para pantallas reducidas (letra y relleno menores) */
  compact(isCompact: boolean): this {
    this.element.classList.toggle('filter-bar--compact', isCompact);
    return this;
  }

  /**
   * Ancla la barra al canvas: su borde superior queda a `worldTop` (unidades del mundo del juego)
   * del borde superior del canvas y centrada en él, sea cual sea la escala o la posición del canvas
   * en la página. Se recalcula cuando cambia el tamaño.
   */
  anchorToCanvas(scene: Phaser.Scene, worldTop: number): this {
    const place = (): void => {
      const rect = scene.game.canvas.getBoundingClientRect();
      const scale = rect.width / scene.scale.gameSize.width;
      this.element.style.top = `${rect.top + worldTop * scale}px`;
      this.element.style.left = `${rect.left + rect.width / 2}px`;
      this.element.style.maxWidth = `${rect.width * 0.98}px`;
    };
    place();
    scene.scale.on('resize', place);
    // El centrado del canvas (márgenes que pone el Scale Manager) puede cambiar sin disparar `resize`
    scene.events.on('postupdate', place);
    this.detachAnchor = () => {
      scene.scale.off('resize', place);
      scene.events.off('postupdate', place);
    };
    return this;
  }

  /** Oculta o muestra la barra sin quitarla (los elementos HTML quedan por encima del canvas) */
  setVisible(visible: boolean): this {
    this.element.style.visibility = visible ? '' : 'hidden';
    return this;
  }

  append(...nodes: Node[]): this {
    nodes.forEach((node) => this.element.appendChild(node));
    return this;
  }

  mount(): this {
    document.body.appendChild(this.element);
    return this;
  }

  destroy(): void {
    this.detachAnchor?.();
    this.element.remove();
  }
}
