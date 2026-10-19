import { COLOR } from './theme';
import type { RowBackground, TableColumn } from './widgets/DataTable';
import type { GameMode } from '../types/api';
import { formatDate, formatTime } from '../utils/format';

/**
 * Tabla de sesiones de juego. La comparten el historial del estudiante
 * (Estadísticas) y las sesiones de un usuario en el panel de administración:
 * mismas columnas, mismas posiciones, mismo aspecto.
 */

/** Campos de una sesión que muestra la tabla (los dos listados los tienen). */
export interface SessionTableRow {
  row_number: number;
  started_at: string;
  final_score: number;
  game_mode: GameMode;
  total_shots: number;
  correct_shots: number;
  accuracy: number;
}

/** Columnas de la tabla de sesiones; los desplazamientos son respecto al centro. */
export const SESSION_COLUMNS: TableColumn<SessionTableRow>[] = [
  {
    header: '#',
    headerX: -500,
    x: -500,
    cell: (s) => ({ text: s.row_number.toString(), color: COLOR.grayMid }),
  },
  {
    header: 'Fecha',
    headerX: -430,
    x: -430,
    cell: (s) => ({ text: formatDate(s.started_at), color: COLOR.white }),
  },
  {
    header: 'Hora',
    headerX: -300,
    x: -300,
    cell: (s) => ({ text: formatTime(s.started_at), color: COLOR.grayLight }),
  },
  {
    header: 'Puntuación',
    headerX: -150,
    x: -150,
    cell: (s) => ({ text: s.final_score.toString(), color: COLOR.mint }),
  },
  {
    header: 'Modo',
    headerX: -20,
    x: -20,
    cell: (s) => ({
      text: s.game_mode === 'triangle_application' ? 'Triángulo' : 'Razones',
      color: COLOR.white,
    }),
  },
  {
    header: 'Disparos',
    headerX: 100,
    x: 100,
    cell: (s) => ({ text: s.total_shots.toString(), color: COLOR.white }),
  },
  {
    header: 'Aciertos',
    headerX: 220,
    x: 220,
    cell: (s) => ({ text: s.correct_shots.toString(), color: COLOR.teal }),
  },
  {
    header: 'Precisión',
    headerX: 360,
    x: 360,
    cell: (s) => ({
      text: `${s.accuracy}%`,
      color: s.accuracy >= 80 ? COLOR.green : s.accuracy >= 60 ? COLOR.amber : COLOR.salmon,
    }),
  },
];

/** Fondo de las filas de la tabla de sesiones (1050 × 45). */
export const SESSION_ROW_BACKGROUND: RowBackground = {
  width: 1050,
  height: 45,
  fill: 0x16213e,
  alpha: 0.8,
  stroke: { width: 1, color: 0x0f3460 },
};

/** Filas visibles de la tabla de sesiones y separación entre ellas. */
export const SESSION_TABLE = { maxRows: 7, rowSpacing: 50, headerWidth: 1100 } as const;
