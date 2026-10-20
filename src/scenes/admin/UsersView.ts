import { adminApiService } from '../../services/adminApiService';
import type {
  AdminUserListItem,
  AdminUsersFilterParams,
  PaginationInfoExtended,
} from '../../types/api';
import { COLOR, FONT_SIZE } from '../../ui/theme';
import { formatDate } from '../../utils/format';
import { FilterBar } from '../../ui/html/FilterBar';
import { createDataTable } from '../../ui/widgets/DataTable';
import type { TableColumn } from '../../ui/widgets/DataTable';
import { AdminView } from './AdminView';
import type { AdminHost } from './AdminView';

const defaultFilters = (): AdminUsersFilterParams => ({
  page: 1,
  per_page: 14,
  sort_by: 'created_at',
  order: 'desc',
  date_from: `${new Date().getFullYear()}-01-01`,
  min_score: 1000,
});

/** Lista de usuarios con filtros, orden, paginación, carga masiva por CSV y exportación. */
export class UsersView extends AdminView {
  private users: AdminUserListItem[] = [];
  private pagination: PaginationInfoExtended | null = null;
  private filters: AdminUsersFilterParams = defaultFilters();

  private readonly groups: () => string[];

  constructor(host: AdminHost, groups: () => string[]) {
    super(host);
    this.groups = groups;
  }

  async load(): Promise<void> {
    try {
      const response = await adminApiService.listUsers(this.filters);
      this.users = response.data;
      this.pagination = response.pagination;
      this.render();
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      this.host.showError(error instanceof Error ? error.message : 'Error al cargar usuarios');
    }
  }

  private render(): void {
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;

    this.destroy();
    this.host.clearError();

    this.button(50, 25, '← Volver al Menú', () => this.host.goToMenu());
    this.button(width - 180, 25, '📄 Cargar CSV', () => this.openCsvUpload(), '#0066cc');
    this.button(width - 340, 25, '📥 Exportar', () => this.exportUsers(), COLOR.successDark);

    this.createFilterBar();

    if (this.pagination) {
      const { from, to, total } = this.pagination;
      this.track(
        this.scene.add.text(100, 155, `Mostrando ${from || 0}-${to || 0} de ${total} usuarios`, {
          fontSize: FONT_SIZE.sm,
          color: COLOR.grayLight,
        })
      );
    }

    const tableY = 185;
    const pageOffset = ((this.pagination?.current_page || 1) - 1) * (this.filters.per_page || 40);

    createDataTable(this.scene, {
      centerX,
      columns: this.columns(pageOffset),
      rows: this.users,
      maxRows: 14,
      header: { y: tableY, width: 1100, fontSize: FONT_SIZE.xsPlus, inactiveColor: '#cccc00' },
      sort: {
        by: this.filters.sort_by,
        order: this.filters.order,
        onSort: (field) => this.sortBy(field as NonNullable<AdminUsersFilterParams['sort_by']>),
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
        onClick: (index) => this.host.showUserSessions(this.users[index]),
      },
      onCreate: (obj) => this.track(obj),
    });

    this.addPagination(centerX, height - 60, this.pagination, (newPage) => {
      this.filters.page = newPage;
      this.load();
    });
  }

  private createFilterBar(): void {
    this.filterBar = new FilterBar('users', 'admin-filters');
    const bar = this.filterBar;
    const refilter = () => {
      this.filters.page = 1;
      this.load();
    };

    const dateLabel = bar.label('Desde:');

    const dateFromInput = bar.input('date', 'date');
    dateFromInput.value = this.filters.date_from || `${new Date().getFullYear()}-01-01`;
    dateFromInput.onchange = () => {
      this.filters.date_from = dateFromInput.value || undefined;
      refilter();
    };

    const toLabel = bar.label('Hasta:');

    const dateToInput = bar.input('date', 'date');
    dateToInput.value = this.filters.date_to || '';
    dateToInput.onchange = () => {
      this.filters.date_to = dateToInput.value || undefined;
      refilter();
    };

    const minScoreLabel = bar.label('Mín pts:');

    const minScoreInput = bar.input('number', 'short');
    minScoreInput.min = '0';
    minScoreInput.step = '10';
    minScoreInput.value = String(this.filters.min_score ?? 1000);
    minScoreInput.onchange = () => {
      this.filters.min_score = parseInt(minScoreInput.value) || 0;
      refilter();
    };

    const groupSelect = bar.select();
    groupSelect.innerHTML = `<option value="">Todos los grupos</option>`;
    this.groups().forEach((g) => {
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g;
      if (this.filters.group === g) opt.selected = true;
      groupSelect.appendChild(opt);
    });
    groupSelect.onchange = () => {
      this.filters.group = groupSelect.value || undefined;
      refilter();
    };

    const profileSelect = bar.select();
    profileSelect.innerHTML = `
      <option value="">Todos los perfiles</option>
      <option value="student">Estudiante</option>
      <option value="teacher">Profesor</option>
      <option value="admin">Admin</option>
    `;
    profileSelect.value = this.filters.profile || '';
    profileSelect.onchange = () => {
      this.filters.profile = profileSelect.value || undefined;
      refilter();
    };

    const searchInput = bar.input('text', 'wide');
    searchInput.placeholder = '🔍 Buscar...';
    searchInput.value = this.filters.search || '';
    let searchTimeout: number;
    searchInput.oninput = () => {
      clearTimeout(searchTimeout);
      searchTimeout = window.setTimeout(() => {
        this.filters.search = searchInput.value || undefined;
        refilter();
      }, 400);
    };

    const clearBtn = bar.button('✕ Limpiar');
    clearBtn.onclick = () => {
      this.filters = defaultFilters();
      dateFromInput.value = this.filters.date_from || '';
      dateToInput.value = '';
      minScoreInput.value = '1000';
      groupSelect.value = '';
      profileSelect.value = '';
      searchInput.value = '';
      this.load();
    };

    bar
      .append(dateLabel, dateFromInput, toLabel, dateToInput, minScoreLabel, minScoreInput, groupSelect, profileSelect, searchInput, clearBtn)
      .anchorToCanvas(this.scene, 85)
      .mount();
  }

  /** Columnas de la tabla de usuarios; `pageOffset` numera las filas a partir de la página actual. */
  private columns(pageOffset: number): TableColumn<AdminUserListItem>[] {
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
  private sortBy(field: NonNullable<AdminUsersFilterParams['sort_by']>): void {
    if (this.filters.sort_by === field) {
      this.filters.order = this.filters.order === 'asc' ? 'desc' : 'asc';
    } else {
      this.filters.sort_by = field;
      this.filters.order = 'desc';
    }
    this.filters.page = 1;
    this.load();
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
        this.load();
      } catch (error) {
        alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    };

    input.click();
  }

  private async exportUsers(): Promise<void> {
    try {
      await adminApiService.exportUsers(this.filters);
    } catch (error) {
      alert(`Error al exportar: ${error instanceof Error ? error.message : 'Error'}`);
    }
  }
}
