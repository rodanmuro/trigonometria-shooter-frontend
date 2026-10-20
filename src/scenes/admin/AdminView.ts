import Phaser from 'phaser';
import type { AdminUserListItem, PaginationInfoExtended } from '../../types/api';
import { COLOR, FONT_SIZE } from '../../ui/theme';
import { createButton } from '../../ui/widgets/Button';
import { createPagination } from '../../ui/widgets/Pagination';
import { LIST_BUTTON_STYLE } from '../../ui/buttonStyles';
import type { FilterBar } from '../../ui/html/FilterBar';

/** Lo que una vista necesita de la escena que la contiene. */
export interface AdminHost {
  readonly phaserScene: Phaser.Scene;
  /** Muestra (recargando) la lista de usuarios. */
  showUsers(): void;
  showUserSessions(user: AdminUserListItem): void;
  showError(message: string): void;
  /** Retira el aviso de error, si hay uno. */
  clearError(): void;
  goToMenu(): void;
}

/**
 * Una pantalla del panel. Todo lo que crea (objetos de Phaser y barra de filtros HTML) queda
 * registrado en la vista, de modo que `destroy()` lo retira sin recorrer la escena.
 */
export abstract class AdminView {
  protected filterBar: FilterBar | null = null;
  private objects: Phaser.GameObjects.GameObject[] = [];

  protected readonly host: AdminHost;

  constructor(host: AdminHost) {
    this.host = host;
  }

  protected get scene(): Phaser.Scene {
    return this.host.phaserScene;
  }

  destroy(): void {
    this.objects.forEach((obj) => obj.destroy());
    this.objects = [];
    this.filterBar?.destroy();
    this.filterBar = null;
  }

  protected track<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.objects.push(obj);
    return obj;
  }

  protected button(
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    bgColor: string = COLOR.grayDark
  ): Phaser.GameObjects.Text {
    return this.track(createButton(this.scene, { ...LIST_BUTTON_STYLE, bg: bgColor, x, y, text, onClick }));
  }

  protected addPagination(
    centerX: number,
    y: number,
    pagination: PaginationInfoExtended | null,
    onChange: (page: number) => void
  ): void {
    if (!pagination) return;

    createPagination(this.scene, {
      centerX,
      y,
      currentPage: pagination.current_page,
      lastPage: pagination.last_page,
      onChange,
      label: `Página ${pagination.current_page} de ${pagination.last_page}`,
      buttonOffset: 150,
      button: LIST_BUTTON_STYLE,
      labelFontSize: FONT_SIZE.md,
    }).forEach((obj) => this.track(obj));
  }
}
