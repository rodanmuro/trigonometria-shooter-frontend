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
import { formatDate, formatTime } from '../utils/format';
import { createButton } from '../ui/widgets/Button';
import { createPagination } from '../ui/widgets/Pagination';
import { createModalFrame } from '../ui/widgets/Modal';
import { LIST_BUTTON_STYLE } from '../ui/buttonStyles';

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

  private filterContainer: HTMLDivElement | null = null;

  constructor() {
    super({ key: 'StatsScene' });
  }

  create(): void {
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
    const headers = ['#', 'Fecha', 'Hora', 'Puntuación', 'Modo', 'Disparos', 'Aciertos', 'Precisión'];
    const positions = [centerX - 500, centerX - 430, centerX - 300, centerX - 150, centerX - 20, centerX + 100, centerX + 220, centerX + 360];

    this.createTableHeader(centerX, tableY, headers, positions);

    const maxVisible = 7;
    const itemHeight = 50;

    this.sessions.slice(0, maxVisible).forEach((session, index) => {
      const rowY = tableY + 45 + index * itemHeight;
      this.createSessionRow(session, rowY, positions, itemHeight);
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
    this.filterContainer = document.createElement('div');
    this.filterContainer.id = 'stats-filters';
    this.filterContainer.style.cssText = `
      position: absolute;
      top: ${this.getCanvasTopOffset() + 135}px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      align-items: center;
      background: rgba(26, 26, 46, 0.95);
      padding: 10px 20px;
      border-radius: 8px;
      border: 1px solid #333;
      z-index: 1000;
    `;

    const label = document.createElement('span');
    label.textContent = 'Filtrar por fecha:';
    label.style.color = '#aaa';
    label.style.fontSize = '14px';

    const dateFrom = document.createElement('input');
    dateFrom.type = 'date';
    dateFrom.value = this.filters.date_from || '';
    dateFrom.style.cssText = this.getInputStyle();

    const dateTo = document.createElement('input');
    dateTo.type = 'date';
    dateTo.value = this.filters.date_to || '';
    dateTo.style.cssText = this.getInputStyle();

    const minScoreLabel = document.createElement('span');
    minScoreLabel.textContent = 'Mín. puntos:';
    minScoreLabel.style.color = '#aaa';
    minScoreLabel.style.fontSize = '14px';

    const minScoreInput = document.createElement('input');
    minScoreInput.type = 'number';
    minScoreInput.min = '0';
    minScoreInput.step = '10';
    minScoreInput.placeholder = '0';
    minScoreInput.value = this.filters.min_score !== undefined ? String(this.filters.min_score) : '';
    minScoreInput.style.cssText = this.getInputStyle() + 'width: 80px;';

    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Aplicar';
    applyBtn.style.cssText = `
      padding: 8px 16px;
      border-radius: 4px;
      border: none;
      background: #0066cc;
      color: #fff;
      font-size: 14px;
      cursor: pointer;
    `;
    applyBtn.onclick = () => {
      this.filters.date_from = dateFrom.value || undefined;
      this.filters.date_to = dateTo.value || undefined;
      this.filters.min_score = minScoreInput.value ? parseInt(minScoreInput.value, 10) : undefined;
      this.filters.page = 1;
      this.loadSessions();
    };

    const clearBtn = document.createElement('button');
    clearBtn.textContent = '✕ Limpiar';
    clearBtn.style.cssText = `
      padding: 8px 12px;
      border-radius: 4px;
      border: none;
      background: #444;
      color: #fff;
      font-size: 14px;
      cursor: pointer;
    `;
    clearBtn.onclick = () => {
      this.filters = { page: 1 };
      dateFrom.value = '';
      dateTo.value = '';
      minScoreInput.value = '';
      this.loadSessions();
    };

    this.filterContainer.appendChild(label);
    this.filterContainer.appendChild(dateFrom);
    this.filterContainer.appendChild(document.createTextNode(' a '));
    this.filterContainer.appendChild(dateTo);
    this.filterContainer.appendChild(minScoreLabel);
    this.filterContainer.appendChild(minScoreInput);
    this.filterContainer.appendChild(applyBtn);
    this.filterContainer.appendChild(clearBtn);

    document.body.appendChild(this.filterContainer);
  }

  private createSessionRow(
    session: MySessionListItem,
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

  private createTableHeader(centerX: number, y: number, headers: string[], positions: number[]): void {
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
    if (this.filterContainer) {
      this.filterContainer.remove();
      this.filterContainer = null;
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

  private getInputStyle(): string {
    return `
      padding: 8px 12px;
      border-radius: 4px;
      border: 1px solid #444;
      background: #1a1a2e;
      color: #fff;
      font-size: 14px;
    `;
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

  shutdown(): void {
    this.removeFilterContainer();
  }
}
