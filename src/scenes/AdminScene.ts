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
import { formatDate } from '../utils/format';
import { createButton } from '../ui/widgets/Button';
import { createPagination } from '../ui/widgets/Pagination';
import { createModalFrame } from '../ui/widgets/Modal';
import { LIST_BUTTON_STYLE } from '../ui/buttonStyles';
import { FilterBar } from '../ui/html/FilterBar';
import { createDataTable } from '../ui/widgets/DataTable';
import type { TableColumn } from '../ui/widgets/DataTable';
import { SESSION_COLUMNS, SESSION_ROW_BACKGROUND, SESSION_TABLE } from '../ui/sessionTable';

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
    const pageOffset = ((this.usersPagination?.current_page || 1) - 1) * (this.usersFilters.per_page || 40);

    createDataTable(this, {
      centerX,
      columns: this.userColumns(pageOffset),
      rows: this.users,
      maxRows: 14,
      header: { y: tableY, width: 1100, fontSize: FONT_SIZE.xsPlus, inactiveColor: '#cccc00' },
      sort: {
        by: this.usersFilters.sort_by,
        order: this.usersFilters.order,
        onSort: (field) => this.sortUsersBy(field as NonNullable<AdminUsersFilterParams['sort_by']>),
      },
      firstRowY: tableY + 45,
      rowSpacing: 40,
      rowBackground: {
        width: 1100,
        height: 35,
        fill: 0x16213e,
        alpha: 0.8,
        stroke: { width: 1, color: 0x0f3460 },
        hover: { over: [0x1a2744], out: [0x16213e] },
        onClick: (index) => this.viewUserSessions(this.users[index]),
      },
      onCreate: (obj) => obj.setData('clearable', true),
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

  /** Columnas de la tabla de usuarios; `pageOffset` numera las filas a partir de la página actual. */
  private userColumns(pageOffset: number): TableColumn<AdminUserListItem>[] {
    return [
      {
        header: 'No',
        headerX: -530,
        x: -530,
        cell: (_u, i) => ({ text: (pageOffset + i + 1).toString(), color: COLOR.grayMid }),
      },
      {
        header: 'Email',
        headerX: -480,
        x: -480,
        sortField: 'email',
        cell: (u) => ({
          text: u.email.length > 28 ? u.email.substring(0, 25) + '...' : u.email,
          color: COLOR.white,
        }),
      },
      {
        header: 'Nombre',
        headerX: -280,
        x: -280,
        sortField: 'name',
        cell: (u) => {
          const fullName = `${u.name || ''} ${u.lastname || ''}`.trim() || '-';
          return {
            text: fullName.length > 18 ? fullName.substring(0, 15) + '...' : fullName,
            color: COLOR.white,
          };
        },
      },
      {
        header: 'Grupo',
        headerX: -100,
        x: -100,
        sortField: 'group',
        cell: (u) => ({ text: u.group || '-', color: COLOR.grayLight }),
      },
      {
        header: 'Sesiones',
        headerX: 20,
        x: 20,
        sortField: 'sessions_count',
        cell: (u) => ({ text: u.game_sessions_count.toString(), color: COLOR.mint }),
      },
      {
        header: 'Promedio',
        headerX: 120,
        x: 120,
        sortField: 'avg_score',
        cell: (u) => ({
          text: u.avg_score !== null && u.avg_score !== undefined ? Number(u.avg_score).toFixed(1) : '-',
          color: COLOR.teal,
        }),
      },
      {
        header: 'Mejor',
        headerX: 220,
        x: 220,
        cell: (u) => ({ text: u.best_score !== null ? u.best_score.toString() : '-', color: COLOR.yellow }),
      },
      {
        header: 'Última Sesión',
        headerX: 340,
        x: 340,
        cell: (u) => ({
          text: u.last_played_at ? formatDate(u.last_played_at) : '-',
          color: COLOR.grayLight,
        }),
      },
    ];
  }

  /** Ordena la lista por un campo: el mismo campo alterna el sentido; otro campo empieza descendente. */
  private sortUsersBy(field: NonNullable<AdminUsersFilterParams['sort_by']>): void {
    if (this.usersFilters.sort_by === field) {
      this.usersFilters.order = this.usersFilters.order === 'asc' ? 'desc' : 'asc';
    } else {
      this.usersFilters.sort_by = field;
      this.usersFilters.order = 'desc';
    }
    this.usersFilters.page = 1;
    this.loadUsers();
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

    createDataTable(this, {
      centerX,
      columns: SESSION_COLUMNS,
      rows: this.userSessions,
      maxRows: SESSION_TABLE.maxRows,
      header: { y: tableY, width: SESSION_TABLE.headerWidth, fontSize: FONT_SIZE.xsPlus },
      firstRowY: tableY + 45,
      rowSpacing: SESSION_TABLE.rowSpacing,
      rowBackground: SESSION_ROW_BACKGROUND,
      onCreate: (obj) => obj.setData('clearable', true),
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

  // --- Métodos auxiliares ---

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
