import Phaser from 'phaser';
import { adminApiService } from '../services/adminApiService';
import type { AdminUserListItem } from '../types/api';
import { COLOR, FONT_SIZE } from '../ui/theme';
import { createButton } from '../ui/widgets/Button';
import { createModalFrame } from '../ui/widgets/Modal';
import { LIST_BUTTON_STYLE } from '../ui/buttonStyles';
import type { AdminHost, AdminView } from './admin/AdminView';
import { UsersView } from './admin/UsersView';
import { UserSessionsView } from './admin/UserSessionsView';

/**
 * Escena de administración. Orquesta dos vistas:
 * - `UsersView`: lista de usuarios con filtros, CSV y exportación.
 * - `UserSessionsView`: sesiones de un usuario con filtro de fechas.
 */
export default class AdminScene extends Phaser.Scene implements AdminHost {
  private availableGroups: string[] = [];
  private usersView!: UsersView;
  private sessionsView!: UserSessionsView;
  private activeView: AdminView | null = null;
  private errorObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'AdminScene' });
  }

  get phaserScene(): Phaser.Scene {
    return this;
  }

  create(): void {
    this.activeView = null;
    this.errorObjects = [];
    this.usersView = new UsersView(this, () => this.availableGroups);
    this.sessionsView = new UserSessionsView(this);

    // Phaser no invoca por nombre un método `shutdown()`: hay que suscribirse al evento
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.usersView.destroy();
      this.sessionsView.destroy();
    });

    const { width, height } = this.cameras.main;
    const centerX = width / 2;

    this.input.setDefaultCursor('default');

    this.add.rectangle(centerX, height / 2, width, height, 0x0f0f1e, 1);

    this.add
      .text(centerX, 25, 'PANEL DE ADMINISTRACIÓN', {
        fontSize: FONT_SIZE.xxl,
        color: COLOR.yellow,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.initializeData();
  }

  private async initializeData(): Promise<void> {
    try {
      const response = await adminApiService.getGroups();
      this.availableGroups = response.data;
    } catch (error) {
      console.error('Error al cargar grupos:', error);
    }
    this.showUsers();
  }

  showUsers(): void {
    this.switchTo(this.usersView);
    this.usersView.load();
  }

  showUserSessions(user: AdminUserListItem): void {
    this.switchTo(this.sessionsView);
    this.sessionsView.open(user);
  }

  /** Cierra la vista anterior; la nueva se dibuja cuando terminan de llegar sus datos. */
  private switchTo(view: AdminView): void {
    if (this.activeView && this.activeView !== view) this.activeView.destroy();
    this.activeView = view;
  }

  goToMenu(): void {
    this.usersView.destroy();
    this.sessionsView.destroy();
    this.scene.start('MenuScene');
  }

  clearError(): void {
    this.errorObjects.forEach((obj) => obj.destroy());
    this.errorObjects = [];
  }

  showError(message: string): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    const keep = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
      this.errorObjects.push(obj);
      return obj;
    };

    keep(
      createModalFrame(this, {
        centerX,
        centerY,
        width: 500,
        height: 200,
        fill: 0x000000,
        fillAlpha: 0.95,
        strokeWidth: 3,
        strokeColor: 0xff0000,
      }).panel
    );

    keep(
      this.add
        .text(centerX, centerY - 40, 'ERROR', {
          fontSize: FONT_SIZE.xxl,
          color: COLOR.red,
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
    );

    keep(
      this.add
        .text(centerX, centerY + 10, message, {
          fontSize: FONT_SIZE.sm,
          color: COLOR.white,
          align: 'center',
          wordWrap: { width: 450 },
        })
        .setOrigin(0.5)
    );

    keep(
      createButton(this, {
        ...LIST_BUTTON_STYLE,
        bg: COLOR.grayDark,
        x: centerX - 40,
        y: centerY + 70,
        text: 'Cerrar',
        onClick: () => this.goToMenu(),
      })
    );
  }
}
