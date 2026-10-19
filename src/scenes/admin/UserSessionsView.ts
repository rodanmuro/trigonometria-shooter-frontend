import { adminApiService } from '../../services/adminApiService';
import type {
  AdminSessionsFilterParams,
  AdminUserListItem,
  PaginationInfoExtended,
  SessionListItemWithRow,
  UserSessionSummary,
} from '../../types/api';
import { COLOR, FONT_SIZE } from '../../ui/theme';
import { FilterBar } from '../../ui/html/FilterBar';
import { createDataTable } from '../../ui/widgets/DataTable';
import { SESSION_COLUMNS, SESSION_ROW_BACKGROUND, SESSION_TABLE } from '../../ui/sessionTable';
import { AdminView } from './AdminView';

/** Sesiones de un usuario: resumen, filtro por fechas, tabla paginada y exportación. */
export class UserSessionsView extends AdminView {
  private user: AdminUserListItem | null = null;
  private sessions: SessionListItemWithRow[] = [];
  private summary: UserSessionSummary | null = null;
  private pagination: PaginationInfoExtended | null = null;
  private filters: AdminSessionsFilterParams = { page: 1 };

  /** Abre las sesiones de un usuario con los filtros reiniciados. */
  async open(user: AdminUserListItem): Promise<void> {
    this.user = user;
    this.filters = { page: 1 };

    try {
      await this.fetch();
      this.render();
    } catch (error) {
      console.error('Error al cargar sesiones:', error);
      this.host.showError(error instanceof Error ? error.message : 'Error al cargar sesiones');
    }
  }

  private async reload(): Promise<void> {
    if (!this.user) return;

    try {
      await this.fetch();
      this.render();
    } catch (error) {
      console.error('Error al recargar sesiones:', error);
    }
  }

  private async fetch(): Promise<void> {
    const response = await adminApiService.getUserSessions(this.user!.id, this.filters);
    this.sessions = response.data;
    this.summary = response.summary;
    this.pagination = response.pagination;
  }

  private render(): void {
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;

    this.destroy();
    this.host.clearError();

    const user = this.user;
    if (!user) return;

    this.button(50, 40, '← Volver a Usuarios', () => {
      this.user = null;
      this.host.showUsers();
    });

    this.button(width - 180, 40, '📥 Exportar', () => this.exportSessions(), COLOR.successDark);

    const userName = `${user.name || ''} ${user.lastname || ''}`.trim();
    this.track(
      this.scene.add
        .text(centerX, 80, userName || user.email, {
          fontSize: FONT_SIZE.xxl,
          color: COLOR.white,
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
    );

    this.track(
      this.scene.add
        .text(centerX, 110, `${user.email} | Grupo: ${user.group || 'N/A'}`, {
          fontSize: FONT_SIZE.sm,
          color: COLOR.grayLight,
        })
        .setOrigin(0.5)
    );

    if (this.summary) {
      this.createSummaryBar(centerX, 145, this.summary);
    }

    this.createFilterBar();

    if (this.pagination) {
      const { from, to, total } = this.pagination;
      this.track(
        this.scene.add.text(100, 235, `Mostrando ${from || 0}-${to || 0} de ${total} sesiones`, {
          fontSize: FONT_SIZE.sm,
          color: COLOR.grayLight,
        })
      );
    }

    const tableY = 265;

    createDataTable(this.scene, {
      centerX,
      columns: SESSION_COLUMNS,
      rows: this.sessions,
      maxRows: SESSION_TABLE.maxRows,
      header: { y: tableY, width: SESSION_TABLE.headerWidth, fontSize: FONT_SIZE.xsPlus },
      firstRowY: tableY + 45,
      rowSpacing: SESSION_TABLE.rowSpacing,
      rowBackground: SESSION_ROW_BACKGROUND,
      onCreate: (obj) => this.track(obj),
    });

    this.addPagination(centerX, height - 60, this.pagination, (newPage) => {
      this.filters.page = newPage;
      this.reload();
    });
  }

  private createSummaryBar(centerX: number, y: number, s: UserSessionSummary): void {
    const summaryText =
      `Total: ${s.total_sessions} sesiones válidas | Promedio: ${s.avg_score} pts | Mejor: ${s.best_score} pts | Tiempo jugado: ${s.total_playtime_minutes} min\n` +
      `Razones: ${s.total_sessions_ratio} válidos | Triángulo: ${s.total_sessions_triangle} válidos`;

    this.track(this.scene.add.rectangle(centerX, y, 900, 48, 0x1a2744, 0.9).setStrokeStyle(1, 0x4ecdc4));

    this.track(
      this.scene.add
        .text(centerX, y, summaryText, {
          fontSize: FONT_SIZE.xs,
          color: COLOR.teal,
          align: 'center',
          lineSpacing: 8,
        })
        .setOrigin(0.5)
    );
  }

  private createFilterBar(): void {
    this.filterBar = new FilterBar('sessions', 'admin-filters');
    const bar = this.filterBar;

    const label = bar.label('Filtrar por fecha:');

    const dateFrom = bar.input('date');
    dateFrom.value = this.filters.date_from || '';

    const dateTo = bar.input('date');
    dateTo.value = this.filters.date_to || '';

    const applyBtn = bar.button('Aplicar', true);
    applyBtn.onclick = () => {
      this.filters.date_from = dateFrom.value || undefined;
      this.filters.date_to = dateTo.value || undefined;
      this.filters.page = 1;
      this.reload();
    };

    const clearBtn = bar.button('✕ Limpiar');
    clearBtn.onclick = () => {
      this.filters = { page: 1 };
      dateFrom.value = '';
      dateTo.value = '';
      this.reload();
    };

    bar
      .append(label, dateFrom, document.createTextNode(' a '), dateTo, applyBtn, clearBtn)
      .mount(this.getCanvasTopOffset() + 190);
  }

  private async exportSessions(): Promise<void> {
    if (!this.user) return;

    try {
      await adminApiService.exportUserSessions(this.user.id, this.filters);
    } catch (error) {
      alert(`Error al exportar: ${error instanceof Error ? error.message : 'Error'}`);
    }
  }
}
