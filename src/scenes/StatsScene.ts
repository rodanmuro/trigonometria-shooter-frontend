import Phaser from 'phaser';
import { sessionApiService } from '../services/sessionApiService';
import { AuthManager } from '../managers/AuthManager';
import type {
  MySessionListItem,
  UserSessionSummary,
  MySessionsFilterParams,
  PaginationInfoExtended,
} from '../types/api';
import { COLOR, FONT_SIZE } from '../ui/theme';
import { createButton } from '../ui/widgets/Button';
import { createPagination } from '../ui/widgets/Pagination';
import { createModalFrame } from '../ui/widgets/Modal';
import { LIST_BUTTON_STYLE } from '../ui/buttonStyles';
import { FilterBar } from '../ui/html/FilterBar';
import { createDataTable } from '../ui/widgets/DataTable';
import { SESSION_COLUMNS, SESSION_ROW_BACKGROUND, SESSION_TABLE } from '../ui/sessionTable';

/**
 * Reporte propio del estudiante: su historial de sesiones (ambos juegos) con
 * el mismo resumen y formato de tabla que ve un admin, pero limitado
 * exclusivamente a sus propios datos (GET /sessions, sin userId).
 */
export default class StatsScene extends Phaser.Scene {
  private sessions: MySessionListItem[] = [];
  private summary: UserSessionSummary | null = null;
  private pagination: PaginationInfoExtended | null = null;
  private filters: MySessionsFilterParams = { page: 1 };

  private filterBar: FilterBar | null = null;

  constructor() {
    super({ key: 'StatsScene' });
  }

  create(): void {
    // Phaser no invoca por nombre un método `shutdown()`: hay que suscribirse al evento
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.removeFilterContainer());

    const { width, height } = this.cameras.main;
    const centerX = width / 2;

    this.input.setDefaultCursor('default');

    this.add.rectangle(centerX, height / 2, width, height, 0x0f0f1e, 1);

    this.add
      .text(centerX, 25, 'MIS ESTADÍSTICAS', {
        fontSize: FONT_SIZE.xxl,
        color: COLOR.yellow,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.loadSessions();
  }

  private async loadSessions(): Promise<void> {
    try {
      const response = await sessionApiService.getMySessions(this.filters);
      this.sessions = response.data;
      this.summary = response.summary;
      this.pagination = response.pagination;
      this.renderView();
    } catch (error) {
      console.error('Error al cargar mis sesiones:', error);
      this.showError(
        error instanceof Error ? error.message : 'Error al cargar tus estadísticas'
      );
    }
  }

  private renderView(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;

    this.clearScene();
    this.removeFilterContainer();

    this.createButton(50, 25, '← Volver al Menú', () => {
      this.removeFilterContainer();
      this.scene.start('MenuScene');
    });

    const user = AuthManager.getInstance().getUser();
    this.add
      .text(centerX, 60, user?.name || user?.email || '', {
        fontSize: FONT_SIZE.sm,
        color: COLOR.grayLight,
      })
      .setOrigin(0.5)
      .setData('clearable', true);

    if (this.summary) {
      this.createSummaryBar(centerX, 100);
    }

    this.createFilterBar();

    if (this.pagination) {
      const from = this.pagination.from || 0;
      const to = this.pagination.to || 0;
      const total = this.pagination.total;
      this.add
        .text(100, 200, `Mostrando ${from}-${to} de ${total} sesiones`, {
          fontSize: FONT_SIZE.sm,
          color: COLOR.grayLight,
        })
        .setData('clearable', true);
    }

    const tableY = 230;

    createDataTable(this, {
      centerX,
      columns: SESSION_COLUMNS,
      rows: this.sessions,
      maxRows: SESSION_TABLE.maxRows,
      header: { y: tableY, width: SESSION_TABLE.headerWidth, fontSize: FONT_SIZE.xsPlus },
      firstRowY: tableY + 45,
      rowSpacing: SESSION_TABLE.rowSpacing,
      rowBackground: SESSION_ROW_BACKGROUND,
      onCreate: (obj) => obj.setData('clearable', true),
    });

    this.createPagination(centerX, height - 60, this.pagination, (newPage) => {
      this.filters.page = newPage;
      this.loadSessions();
    });
  }

  private createSummaryBar(centerX: number, y: number): void {
    if (!this.summary) return;

    const s = this.summary;
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

  private createFilterBar(): void {
    this.filterBar = new FilterBar('stats', 'stats-filters');
    const bar = this.filterBar;

    const label = bar.label('Filtrar por fecha:');

    const dateFrom = bar.input('date');
    dateFrom.value = this.filters.date_from || '';

    const dateTo = bar.input('date');
    dateTo.value = this.filters.date_to || '';

    const minScoreLabel = bar.label('Mín. puntos:');

    const minScoreInput = bar.input('number', 'short');
    minScoreInput.min = '0';
    minScoreInput.step = '10';
    minScoreInput.placeholder = '0';
    minScoreInput.value = this.filters.min_score !== undefined ? String(this.filters.min_score) : '';

    const applyBtn = bar.button('Aplicar', true);
    applyBtn.onclick = () => {
      this.filters.date_from = dateFrom.value || undefined;
      this.filters.date_to = dateTo.value || undefined;
      this.filters.min_score = minScoreInput.value ? parseInt(minScoreInput.value, 10) : undefined;
      this.filters.page = 1;
      this.loadSessions();
    };

    const clearBtn = bar.button('✕ Limpiar');
    clearBtn.onclick = () => {
      this.filters = { page: 1 };
      dateFrom.value = '';
      dateTo.value = '';
      minScoreInput.value = '';
      this.loadSessions();
    };

    bar
      .append(label, dateFrom, document.createTextNode(' a '), dateTo, minScoreLabel, minScoreInput, applyBtn, clearBtn)
      .mount(this.getCanvasTopOffset() + 135);
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
