import Phaser from 'phaser';
import { adminApiService } from '../services/adminApiService';
import type {
  AdminUserListItem,
  SessionListItemWithRow,
  UserSessionSummary,
  AdminUsersFilterParams,
  AdminSessionsFilterParams,
  PaginationInfoExtended,
} from '../types/api';
import { COLOR, FONT_SIZE } from '../ui/theme';
import { formatDate, formatTime } from '../utils/format';
import { createButton } from '../ui/widgets/Button';
import { createPagination } from '../ui/widgets/Pagination';
import { createModalFrame } from '../ui/widgets/Modal';
import { LIST_BUTTON_STYLE } from '../ui/buttonStyles';
import { FilterBar } from '../ui/html/FilterBar';

/**
 * Escena de administración (paridad con multiplication-shooter)
 * Permite al administrador:
 * - Ver lista de usuarios con filtros (grupo, perfil, búsqueda)
 * - Ver sesiones de cada usuario con filtro de fechas
 * - Exportar datos a CSV
 * - Cargar usuarios masivamente desde CSV
 */
export default class AdminScene extends Phaser.Scene {
  // Estado de la vista de usuarios
  private users: AdminUserListItem[] = [];
  private usersPagination: PaginationInfoExtended | null = null;
  private usersFilters: AdminUsersFilterParams = {
    page: 1,
    per_page: 14,
    sort_by: 'created_at',
    order: 'desc',
    date_from: `${new Date().getFullYear()}-01-01`,
    min_score: 1000
  };
  private availableGroups: string[] = [];

  // Estado de la vista de sesiones
  private selectedUser: AdminUserListItem | null = null;
  private userSessions: SessionListItemWithRow[] = [];
  private sessionsSummary: UserSessionSummary | null = null;
  private sessionsPagination: PaginationInfoExtended | null = null;
  private sessionsFilters: AdminSessionsFilterParams = { page: 1 };

  // Elementos HTML para filtros
  private filterBar: FilterBar | null = null;

  constructor() {
    super({ key: 'AdminScene' });
  }

  create(): void {
    // Phaser no invoca por nombre un método `shutdown()`: hay que suscribirse al evento
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.removeFilterContainer());

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
    await this.loadGroups();
    this.loadUsers();
  }

  private async loadGroups(): Promise<void> {
    try {
      const response = await adminApiService.getGroups();
      this.availableGroups = response.data;
    } catch (error) {
      console.error('Error al cargar grupos:', error);
    }
  }

  private async loadUsers(): Promise<void> {
    try {
      const response = await adminApiService.listUsers(this.usersFilters);
      this.users = response.data;
      this.usersPagination = response.pagination;
      this.renderUsersView();
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      this.showError(
        error instanceof Error ? error.message : 'Error al cargar usuarios'
      );
    }
  }

  private renderUsersView(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;

    this.clearScene();
    this.removeFilterContainer();

    this.createButton(50, 25, '← Volver al Menú', () => {
      this.removeFilterContainer();
      this.scene.start('MenuScene');
    });

    this.createButton(width - 180, 25, '📄 Cargar CSV', () => this.openCsvUpload(), '#0066cc');
    this.createButton(width - 340, 25, '📥 Exportar', () => this.exportUsers(), COLOR.successDark);

    this.createUsersFilterBar();

    if (this.usersPagination) {
      const from = this.usersPagination.from || 0;
      const to = this.usersPagination.to || 0;
      const total = this.usersPagination.total;
      this.add
        .text(100, 155, `Mostrando ${from}-${to} de ${total} usuarios`, {
          fontSize: FONT_SIZE.sm,
          color: COLOR.grayLight,
        })
        .setData('clearable', true);
    }

    const tableY = 185;
    const headers = [
      { label: 'No', field: null },
      { label: 'Email', field: 'email' as const },
      { label: 'Nombre', field: 'name' as const },
      { label: 'Grupo', field: 'group' as const },
      { label: 'Sesiones', field: 'sessions_count' as const },
      { label: 'Promedio', field: 'avg_score' as const },
      { label: 'Mejor', field: null },
      { label: 'Última Sesión', field: null }
    ];
    const headerPositions = [centerX - 530, centerX - 480, centerX - 280, centerX - 100, centerX + 20, centerX + 120, centerX + 220, centerX + 340];

    this.createSortableTableHeader(centerX, tableY, headers, headerPositions);

    const maxVisible = 14;
    const itemHeight = 40;

    const pageOffset = ((this.usersPagination?.current_page || 1) - 1) * (this.usersFilters.per_page || 40);

    this.users.slice(0, maxVisible).forEach((user, index) => {
      const rowY = tableY + 45 + index * itemHeight;
      const rowNumber = pageOffset + index + 1;
      this.createUserRow(user, rowY, headerPositions, itemHeight, rowNumber);
    });

    this.createPagination(
      centerX,
      height - 60,
      this.usersPagination,
      (newPage) => {
        this.usersFilters.page = newPage;
        this.loadUsers();
      }
    );
  }

  private createUsersFilterBar(): void {
    this.filterBar = new FilterBar('users', 'admin-filters');
    const bar = this.filterBar;

    const dateLabel = bar.label('Desde:');

    const dateFromInput = bar.input('date', 'date');
    dateFromInput.value = this.usersFilters.date_from || `${new Date().getFullYear()}-01-01`;
    dateFromInput.onchange = () => {
      this.usersFilters.date_from = dateFromInput.value || undefined;
      this.usersFilters.page = 1;
      this.loadUsers();
    };

    const toLabel = bar.label('Hasta:');

    const dateToInput = bar.input('date', 'date');
    dateToInput.value = this.usersFilters.date_to || '';
    dateToInput.onchange = () => {
      this.usersFilters.date_to = dateToInput.value || undefined;
      this.usersFilters.page = 1;
      this.loadUsers();
    };

    const minScoreLabel = bar.label('Mín pts:');

    const minScoreInput = bar.input('number', 'short');
    minScoreInput.min = '0';
    minScoreInput.step = '10';
    minScoreInput.value = String(this.usersFilters.min_score ?? 1000);
    minScoreInput.onchange = () => {
      this.usersFilters.min_score = parseInt(minScoreInput.value) || 0;
      this.usersFilters.page = 1;
      this.loadUsers();
    };

    const groupSelect = bar.select();
    groupSelect.innerHTML = `<option value="">Todos los grupos</option>`;
    this.availableGroups.forEach((g) => {
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g;
      if (this.usersFilters.group === g) opt.selected = true;
      groupSelect.appendChild(opt);
    });
    groupSelect.onchange = () => {
      this.usersFilters.group = groupSelect.value || undefined;
      this.usersFilters.page = 1;
      this.loadUsers();
    };

    const profileSelect = bar.select();
    profileSelect.innerHTML = `
      <option value="">Todos los perfiles</option>
      <option value="student">Estudiante</option>
      <option value="teacher">Profesor</option>
      <option value="admin">Admin</option>
    `;
    profileSelect.value = this.usersFilters.profile || '';
    profileSelect.onchange = () => {
      this.usersFilters.profile = profileSelect.value || undefined;
      this.usersFilters.page = 1;
      this.loadUsers();
    };

    const searchInput = bar.input('text', 'wide');
    searchInput.placeholder = '🔍 Buscar...';
    searchInput.value = this.usersFilters.search || '';
    let searchTimeout: number;
    searchInput.oninput = () => {
      clearTimeout(searchTimeout);
      searchTimeout = window.setTimeout(() => {
        this.usersFilters.search = searchInput.value || undefined;
        this.usersFilters.page = 1;
        this.loadUsers();
      }, 400);
    };

    const clearBtn = bar.button('✕ Limpiar');
    clearBtn.onclick = () => {
      this.usersFilters = {
        page: 1,
        per_page: 14,
        sort_by: 'created_at',
        order: 'desc',
        date_from: `${new Date().getFullYear()}-01-01`,
        min_score: 1000
      };
      dateFromInput.value = this.usersFilters.date_from || '';
      dateToInput.value = '';
      minScoreInput.value = '1000';
      groupSelect.value = '';
      profileSelect.value = '';
      searchInput.value = '';
      this.loadUsers();
    };

    bar
      .append(dateLabel, dateFromInput, toLabel, dateToInput, minScoreLabel, minScoreInput, groupSelect, profileSelect, searchInput, clearBtn)
      .mount(this.getCanvasTopOffset() + 85);
  }

  private createUserRow(
    user: AdminUserListItem,
    rowY: number,
    positions: number[],
    itemHeight: number,
    rowNumber: number
  ): void {
    const centerX = this.cameras.main.width / 2;

    const rowBg = this.add
      .rectangle(centerX, rowY, 1100, itemHeight - 5, 0x16213e, 0.8)
      .setStrokeStyle(1, 0x0f3460)
      .setInteractive({ useHandCursor: true })
      .setData('clearable', true);

    rowBg.on('pointerdown', () => this.viewUserSessions(user));
    rowBg.on('pointerover', () => rowBg.setFillStyle(0x1a2744));
    rowBg.on('pointerout', () => rowBg.setFillStyle(0x16213e));

    this.createText(positions[0], rowY, rowNumber.toString(), COLOR.grayMid);

    const emailDisplay = user.email.length > 28 ? user.email.substring(0, 25) + '...' : user.email;
    this.createText(positions[1], rowY, emailDisplay, COLOR.white);

    const fullName = `${user.name || ''} ${user.lastname || ''}`.trim() || '-';
    const nameDisplay = fullName.length > 18 ? fullName.substring(0, 15) + '...' : fullName;
    this.createText(positions[2], rowY, nameDisplay, COLOR.white);

    this.createText(positions[3], rowY, user.group || '-', COLOR.grayLight);

    this.createText(positions[4], rowY, user.game_sessions_count.toString(), COLOR.mint);

    const avgScore = user.avg_score !== null && user.avg_score !== undefined ? Number(user.avg_score).toFixed(1) : '-';
    this.createText(positions[5], rowY, avgScore, COLOR.teal);

    const bestScore = user.best_score !== null ? user.best_score.toString() : '-';
    this.createText(positions[6], rowY, bestScore, COLOR.yellow);

    const lastPlayed = user.last_played_at
      ? formatDate(user.last_played_at)
      : '-';
    this.createText(positions[7], rowY, lastPlayed, COLOR.grayLight);
  }

  private async viewUserSessions(user: AdminUserListItem): Promise<void> {
    this.selectedUser = user;
    this.sessionsFilters = { page: 1 };

    try {
      const response = await adminApiService.getUserSessions(user.id, this.sessionsFilters);
      this.userSessions = response.data;
      this.sessionsSummary = response.summary;
      this.sessionsPagination = response.pagination;
      this.renderSessionsView();
    } catch (error) {
      console.error('Error al cargar sesiones:', error);
      this.showError(
        error instanceof Error ? error.message : 'Error al cargar sesiones'
      );
    }
  }

  private renderSessionsView(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;

    this.clearScene();
    this.removeFilterContainer();

    if (!this.selectedUser) return;

    this.createButton(50, 40, '← Volver a Usuarios', () => {
      this.selectedUser = null;
      this.loadUsers();
    });

    this.createButton(width - 180, 40, '📥 Exportar', () => this.exportUserSessions(), COLOR.successDark);

    const userName = `${this.selectedUser.name || ''} ${this.selectedUser.lastname || ''}`.trim();
    this.add
      .text(centerX, 80, userName || this.selectedUser.email, {
        fontSize: FONT_SIZE.xxl,
        color: COLOR.white,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setData('clearable', true);

    this.add
      .text(
        centerX,
        110,
        `${this.selectedUser.email} | Grupo: ${this.selectedUser.group || 'N/A'}`,
        { fontSize: FONT_SIZE.sm, color: COLOR.grayLight }
      )
      .setOrigin(0.5)
      .setData('clearable', true);

    if (this.sessionsSummary) {
      this.createSummaryBar(centerX, 145);
    }

    this.createSessionsFilterBar();

    if (this.sessionsPagination) {
      const from = this.sessionsPagination.from || 0;
      const to = this.sessionsPagination.to || 0;
      const total = this.sessionsPagination.total;
      this.add
        .text(100, 235, `Mostrando ${from}-${to} de ${total} sesiones`, {
          fontSize: FONT_SIZE.sm,
          color: COLOR.grayLight,
        })
        .setData('clearable', true);
    }

    const tableY = 265;
    const headers = ['#', 'Fecha', 'Hora', 'Puntuación', 'Modo', 'Disparos', 'Aciertos', 'Precisión'];
    const positions = [centerX - 500, centerX - 430, centerX - 300, centerX - 150, centerX - 20, centerX + 100, centerX + 220, centerX + 360];

    this.createTableHeader(centerX, tableY, headers, positions);

    const maxVisible = 7;
    const itemHeight = 50;

    this.userSessions.slice(0, maxVisible).forEach((session, index) => {
      const rowY = tableY + 45 + index * itemHeight;
      this.createSessionRow(session, rowY, positions, itemHeight);
    });

    this.createPagination(
      centerX,
      height - 60,
      this.sessionsPagination,
      (newPage) => {
        this.sessionsFilters.page = newPage;
        this.reloadUserSessions();
      }
    );
  }

  private createSummaryBar(centerX: number, y: number): void {
    if (!this.sessionsSummary) return;

    const s = this.sessionsSummary;
    const summaryText =
      `Total: ${s.total_sessions} sesiones válidas | Promedio: ${s.avg_score} pts | Mejor: ${s.best_score} pts | Tiempo jugado: ${s.total_playtime_minutes} min\n` +
      `Razones: ${s.total_sessions_ratio} válidos | Triángulo: ${s.total_sessions_triangle} válidos`;

    this.add
      .rectangle(centerX, y, 900, 48, 0x1a2744, 0.9)
      .setStrokeStyle(1, 0x4ecdc4)
      .setData('clearable', true);

    this.add
      .text(centerX, y, summaryText, {
        fontSize: FONT_SIZE.xs,
        color: COLOR.teal,
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5)
      .setData('clearable', true);
  }

  private createSessionsFilterBar(): void {
    this.filterBar = new FilterBar('sessions', 'admin-filters');
    const bar = this.filterBar;

    const label = bar.label('Filtrar por fecha:');

    const dateFrom = bar.input('date');
    dateFrom.value = this.sessionsFilters.date_from || '';

    const dateTo = bar.input('date');
    dateTo.value = this.sessionsFilters.date_to || '';

    const applyBtn = bar.button('Aplicar', true);
    applyBtn.onclick = () => {
      this.sessionsFilters.date_from = dateFrom.value || undefined;
      this.sessionsFilters.date_to = dateTo.value || undefined;
      this.sessionsFilters.page = 1;
      this.reloadUserSessions();
    };

    const clearBtn = bar.button('✕ Limpiar');
    clearBtn.onclick = () => {
      this.sessionsFilters = { page: 1 };
      dateFrom.value = '';
      dateTo.value = '';
      this.reloadUserSessions();
    };

    bar
      .append(label, dateFrom, document.createTextNode(' a '), dateTo, applyBtn, clearBtn)
      .mount(this.getCanvasTopOffset() + 190);
  }

  private async reloadUserSessions(): Promise<void> {
    if (!this.selectedUser) return;

    try {
      const response = await adminApiService.getUserSessions(
        this.selectedUser.id,
        this.sessionsFilters
      );
      this.userSessions = response.data;
      this.sessionsSummary = response.summary;
      this.sessionsPagination = response.pagination;
      this.renderSessionsView();
    } catch (error) {
      console.error('Error al recargar sesiones:', error);
    }
  }

  private createSessionRow(
    session: SessionListItemWithRow,
    rowY: number,
    positions: number[],
    itemHeight: number
  ): void {
    const centerX = this.cameras.main.width / 2;

    this.add
      .rectangle(centerX, rowY, 1050, itemHeight - 5, 0x16213e, 0.8)
      .setStrokeStyle(1, 0x0f3460)
      .setData('clearable', true);

    this.createText(positions[0], rowY, session.row_number.toString(), COLOR.grayMid);

    this.createText(positions[1], rowY, formatDate(session.started_at), COLOR.white);
    this.createText(positions[2], rowY, formatTime(session.started_at), COLOR.grayLight);
    this.createText(positions[3], rowY, session.final_score.toString(), COLOR.mint);

    const modeLabel = session.game_mode === 'triangle_application' ? 'Triángulo' : 'Razones';
    this.createText(positions[4], rowY, modeLabel, COLOR.white);

    this.createText(positions[5], rowY, session.total_shots.toString(), COLOR.white);
    this.createText(positions[6], rowY, session.correct_shots.toString(), COLOR.teal);

    const accuracyColor = session.accuracy >= 80 ? COLOR.green : session.accuracy >= 60 ? COLOR.amber : COLOR.salmon;
    this.createText(positions[7], rowY, `${session.accuracy}%`, accuracyColor);
  }

  // --- Métodos auxiliares ---

  private createSortableTableHeader(
    centerX: number,
    y: number,
    headers: Array<{ label: string; field: 'email' | 'name' | 'group' | 'sessions_count' | 'created_at' | 'avg_score' | null }>,
    positions: number[]
  ): void {
    this.add
      .rectangle(centerX, y, 1100, 35, 0x1a1a2e, 1)
      .setStrokeStyle(2, 0xffff00)
      .setDepth(100)
      .setData('clearable', true);

    headers.forEach((header, index) => {
      const sortIndicator = header.field === this.usersFilters.sort_by
        ? (this.usersFilters.order === 'asc' ? ' ▲' : ' ▼')
        : '';

      const headerText = this.add
        .text(positions[index], y, header.label + sortIndicator, {
          fontSize: FONT_SIZE.xsPlus,
          color: header.field ? COLOR.yellow : '#cccc00',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5)
        .setDepth(101)
        .setData('clearable', true);

      if (header.field) {
        headerText.setInteractive({ useHandCursor: true });

        headerText.on('pointerdown', () => {
          if (!header.field) return;

          if (this.usersFilters.sort_by === header.field) {
            this.usersFilters.order = this.usersFilters.order === 'asc' ? 'desc' : 'asc';
          } else {
            this.usersFilters.sort_by = header.field;
            this.usersFilters.order = 'desc';
          }
          this.usersFilters.page = 1;
          this.loadUsers();
        });

        headerText.on('pointerover', () => headerText.setColor(COLOR.white));
        headerText.on('pointerout', () => headerText.setColor(COLOR.yellow));
      }
    });
  }

  private createTableHeader(
    centerX: number,
    y: number,
    headers: string[],
    positions: number[]
  ): void {
    this.add
      .rectangle(centerX, y, 1100, 35, 0x1a1a2e, 1)
      .setStrokeStyle(2, 0xffff00)
      .setDepth(100)
      .setData('clearable', true);

    headers.forEach((header, index) => {
      this.add
        .text(positions[index], y, header, {
          fontSize: FONT_SIZE.xsPlus,
          color: COLOR.yellow,
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5)
        .setDepth(101)
        .setData('clearable', true);
    });
  }

  private createPagination(
    centerX: number,
    y: number,
    pagination: PaginationInfoExtended | null,
    onChange: (page: number) => void
  ): void {
    if (!pagination) return;

    createPagination(this, {
      centerX,
      y,
      currentPage: pagination.current_page,
      lastPage: pagination.last_page,
      onChange,
      label: `Página ${pagination.current_page} de ${pagination.last_page}`,
      buttonOffset: 150,
      button: LIST_BUTTON_STYLE,
      labelFontSize: FONT_SIZE.md,
    }).forEach((obj) => obj.setData('clearable', true));
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    bgColor: string = COLOR.grayDark
  ): Phaser.GameObjects.Text {
    return createButton(this, { ...LIST_BUTTON_STYLE, bg: bgColor, x, y, text, onClick }).setData('clearable', true);
  }

  private createText(x: number, y: number, text: string, color: string): void {
    this.add
      .text(x, y, text, { fontSize: FONT_SIZE.xs, color })
      .setOrigin(0, 0.5)
      .setData('clearable', true);
  }

  private clearScene(): void {
    this.children.list
      .filter((child) => child.getData('clearable'))
      .forEach((child) => child.destroy());
  }

  private removeFilterContainer(): void {
    if (this.filterBar) {
      this.filterBar.destroy();
      this.filterBar = null;
    }
  }

  /**
   * Las barras de filtro son overlays HTML posicionados con `position:
   * absolute` sobre toda la página (no sobre el canvas), así que necesitan
   * sumar el offset real del canvas en la página (por el padding de #app,
   * el centrado del body, etc.) para alinearse con las coordenadas
   * internas del canvas — de lo contrario tapan contenido del canvas.
   */
  private getCanvasTopOffset(): number {
    return this.game.canvas?.getBoundingClientRect().top ?? 0;
  }

  private openCsvUpload(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      try {
        const response = await adminApiService.uploadCsv(file);
        alert(
          `Carga completada:\n` +
            `- Creados: ${response.stats.created}\n` +
            `- Actualizados: ${response.stats.updated}\n` +
            `- Errores: ${response.stats.errors}\n\n` +
            (response.error_details.length > 0
              ? `Detalles:\n${response.error_details.join('\n')}`
              : '')
        );
        this.loadUsers();
      } catch (error) {
        alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    };

    input.click();
  }

  private async exportUsers(): Promise<void> {
    try {
      await adminApiService.exportUsers(this.usersFilters);
    } catch (error) {
      alert(`Error al exportar: ${error instanceof Error ? error.message : 'Error'}`);
    }
  }

  private async exportUserSessions(): Promise<void> {
    if (!this.selectedUser) return;

    try {
      await adminApiService.exportUserSessions(this.selectedUser.id, this.sessionsFilters);
    } catch (error) {
      alert(`Error al exportar: ${error instanceof Error ? error.message : 'Error'}`);
    }
  }

  private showError(message: string): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    createModalFrame(this, {
      centerX,
      centerY,
      width: 500,
      height: 200,
      fill: 0x000000,
      fillAlpha: 0.95,
      strokeWidth: 3,
      strokeColor: 0xff0000,
    }).panel.setData('clearable', true);

    this.add
      .text(centerX, centerY - 40, 'ERROR', {
        fontSize: FONT_SIZE.xxl,
        color: COLOR.red,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setData('clearable', true);

    this.add
      .text(centerX, centerY + 10, message, {
        fontSize: FONT_SIZE.sm,
        color: COLOR.white,
        align: 'center',
        wordWrap: { width: 450 },
      })
      .setOrigin(0.5)
      .setData('clearable', true);

    this.createButton(centerX - 40, centerY + 70, 'Cerrar', () => {
      this.removeFilterContainer();
      this.scene.start('MenuScene');
    });
  }
}
