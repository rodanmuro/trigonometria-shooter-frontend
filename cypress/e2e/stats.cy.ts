import { stubSessionsApi } from '../support/api';
import { mySession, mySessions, sessionSummary } from '../support/fixtures';
import {
  clickSceneText,
  expectNoSceneText,
  expectSceneText,
  expectSnapshot,
  expectTextColor,
  getScene,
  openStatsFromMenu,
  statsFilterBars,
  textsOf,
  visitApp,
  waitForScene,
} from '../support/gameDriver';

function openStats(options: Parameters<typeof stubSessionsApi>[0]) {
  stubSessionsApi(options);
  visitApp();
  return openStatsFromMenu();
}

const bar = () => cy.get('#stats-filters');
const dateFrom = () => bar().find('input[type="date"]').eq(0);
const dateTo = () => bar().find('input[type="date"]').eq(1);
const minPoints = () => bar().find('input[type="number"]');
const apply = () => bar().contains('button', 'Aplicar').click();

describe('Estadísticas del estudiante', () => {
  describe('carga inicial', () => {
    it('pide la página 1 sin filtros', () => {
      openStats({ sessions: mySessions(3) });

      cy.wait('@getSessions').its('request.query').should('deep.equal', { page: '1' });
    });

    it('envía el token del usuario', () => {
      stubSessionsApi({ sessions: mySessions(1) });
      const { token } = visitApp();
      openStatsFromMenu();

      cy.wait('@getSessions').its('request.headers.authorization').should('equal', `Bearer ${token}`);
    });

    it('muestra el título, el botón de volver y el nombre del usuario', () => {
      openStats({ sessions: mySessions(3) });

      expectSceneText('StatsScene', 'MIS ESTADÍSTICAS');
      expectSceneText('StatsScene', '← Volver al Menú');
      expectSceneText('StatsScene', 'Ana Pérez');
    });
  });

  describe('resumen', () => {
    it('muestra los totales y el desglose por modo que envía el backend', () => {
      openStats({
        sessions: mySessions(3),
        summary: sessionSummary({
          total_sessions: 12, total_sessions_ratio: 7, total_sessions_triangle: 5,
          avg_score: 1100, best_score: 1850, total_playtime_minutes: 45,
        }),
      });

      expectSceneText(
        'StatsScene',
        'Total: 12 sesiones válidas | Promedio: 1100 pts | Mejor: 1850 pts | Tiempo jugado: 45 min\n' +
          'Razones: 7 válidos | Triángulo: 5 válidos'
      );
    });

    it('cuando el backend informa cero sesiones, el resumen lo refleja', () => {
      openStats({
        sessions: [],
        summary: sessionSummary({
          total_sessions: 0, total_sessions_ratio: 0, total_sessions_triangle: 0,
          avg_score: 0, best_score: 0, total_playtime_minutes: 0,
        }),
      });

      expectSceneText('StatsScene', 'Total: 0 sesiones válidas');
      expectSceneText('StatsScene', 'Razones: 0 válidos | Triángulo: 0 válidos');
    });
  });

  describe('lista de sesiones', () => {
    it('muestra los encabezados de la tabla', () => {
      openStats({ sessions: mySessions(3) });

      for (const header of ['#', 'Fecha', 'Hora', 'Puntuación', 'Modo', 'Disparos', 'Aciertos', 'Precisión']) {
        expectSceneText('StatsScene', header);
      }
    });

    it('cada fila muestra número, puntuación, modo, disparos, aciertos y precisión', () => {
      openStats({
        sessions: [
          mySession({ row_number: 1, id: 2, final_score: 1250, game_mode: 'ratio_identification', total_shots: 40, correct_shots: 29, accuracy: 72.5 }),
          mySession({ row_number: 2, id: 1, final_score: 1800, game_mode: 'triangle_application', total_shots: 38, correct_shots: 22, accuracy: 55 }),
        ],
      });

      expectSceneText('StatsScene', '1250');
      expectSceneText('StatsScene', 'Razones');
      expectSceneText('StatsScene', '40');
      expectSceneText('StatsScene', '29');
      expectSceneText('StatsScene', '72.5%');
      expectSceneText('StatsScene', '1800');
      expectSceneText('StatsScene', 'Triángulo');
      expectSceneText('StatsScene', '38');
      expectSceneText('StatsScene', '22');
      expectSceneText('StatsScene', '55%');
    });

    it('la precisión es verde desde 80, naranja desde 60 y roja por debajo', () => {
      openStats({
        sessions: [
          mySession({ row_number: 1, accuracy: 80 }),
          mySession({ row_number: 2, accuracy: 79.99 }),
          mySession({ row_number: 3, accuracy: 60 }),
          mySession({ row_number: 4, accuracy: 59.9 }),
        ],
      });

      expectTextColor('StatsScene', '80%', '#00ff00');
      expectTextColor('StatsScene', '79.99%', '#ffaa00');
      expectTextColor('StatsScene', '60%', '#ffaa00');
      expectTextColor('StatsScene', '59.9%', '#ff6666');
    });

    // DEFECTO ACTUAL (bitácora 014, defecto 4): fecha y hora salen de toLocaleDateString() y
    // toLocaleTimeString() sin idioma, así que el formato depende del navegador (3/20/2026 en inglés,
    // 20/3/2026 en español). Por eso aquí solo se comprueba la forma general; al corregirlo
    // (utils/format.ts, es-ES fijo) estas expresiones pasan a dd/mm/aaaa y hh:mm.
    it('(comportamiento actual) la fecha y la hora dependen del idioma del navegador', () => {
      openStats({ sessions: mySessions(2) });

      expectSceneText('StatsScene', /^\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4}$/);
      expectSceneText('StatsScene', /^\d{1,2}:\d{2}/);
    });

    it('muestra el contador "Mostrando a-b de N sesiones"', () => {
      openStats({ sessions: mySessions(20) });

      expectSceneText('StatsScene', 'Mostrando 1-7 de 20 sesiones');
    });

    it('(comportamiento actual) solo se dibujan 7 filas aunque el backend envíe 10', () => {
      openStats({ sessions: mySessions(10), perPage: 10 });
      expectSceneText('StatsScene', 'Mostrando 1-10 de 10 sesiones');

      cy.window().should((win) => {
        const texts = textsOf(getScene(win, 'StatsScene'));
        expect(texts.filter((t) => t === 'Razones' || t === 'Triángulo')).to.have.length(7);
      });
    });

    it('sin sesiones muestra el contador en cero, la tabla vacía y una sola página', () => {
      openStats({ sessions: [] });

      expectSceneText('StatsScene', 'Mostrando 0-0 de 0 sesiones');
      expectSceneText('StatsScene', 'Página 1 de 1');
      expectNoSceneText('StatsScene', /^Razones$/);
      expectNoSceneText('StatsScene', /^Triángulo$/);
    });
  });

  describe('barra de filtros (HTML)', () => {
    it('muestra las fechas vacías, los puntos mínimos y los botones Aplicar y Limpiar', () => {
      openStats({ sessions: mySessions(3) });

      bar().should('contain.text', 'Filtrar por fecha:').and('contain.text', 'Mín. puntos:');
      dateFrom().should('have.value', '');
      dateTo().should('have.value', '');
      minPoints().should('have.value', '').and('have.attr', 'min', '0').and('have.attr', 'step', '10');
      bar().contains('button', 'Aplicar');
      bar().contains('button', '✕ Limpiar');
    });

    it('"Aplicar" pide la página 1 con date_from, date_to y min_score', () => {
      openStats({ sessions: mySessions(3) });
      cy.wait('@getSessions');

      dateFrom().invoke('val', '2026-02-01').trigger('change');
      dateTo().invoke('val', '2026-02-28').trigger('change');
      minPoints().clear().type('300');
      apply();

      cy.wait('@getSessions').its('request.query').should('deep.equal', {
        page: '1', date_from: '2026-02-01', date_to: '2026-02-28', min_score: '300',
      });
    });

    it('cambiar un campo no pide nada hasta pulsar "Aplicar"', () => {
      openStats({ sessions: mySessions(3) });
      cy.wait('@getSessions');

      minPoints().clear().type('300');
      cy.wait(800);

      cy.get('@getSessions.all').should('have.length', 1);
    });

    it('(comportamiento actual) con 0 SÍ envía min_score=0; vacío no lo envía', () => {
      openStats({ sessions: mySessions(3) });
      cy.wait('@getSessions');

      minPoints().clear().type('0');
      apply();
      cy.wait('@getSessions').its('request.query.min_score').should('equal', '0');

      minPoints().clear();
      apply();
      cy.wait('@getSessions').its('request.query').should('not.have.property', 'min_score');
    });

    it('tras aplicar, la barra conserva los valores elegidos', () => {
      openStats({ sessions: mySessions(3) });
      cy.wait('@getSessions');

      dateFrom().invoke('val', '2026-02-01').trigger('change');
      minPoints().clear().type('300');
      apply();
      cy.wait('@getSessions');

      dateFrom().should('have.value', '2026-02-01');
      minPoints().should('have.value', '300');
    });

    it('"✕ Limpiar" quita todos los filtros y vuelve a la página 1', () => {
      openStats({ sessions: mySessions(3) });
      cy.wait('@getSessions');
      dateFrom().invoke('val', '2026-02-01').trigger('change');
      minPoints().clear().type('300');
      apply();
      cy.wait('@getSessions');

      bar().contains('button', '✕ Limpiar').click();

      cy.wait('@getSessions').its('request.query').should('deep.equal', { page: '1' });
      dateFrom().should('have.value', '');
      minPoints().should('have.value', '');
    });

    it('un filtro nuevo regresa a la página 1 aunque se estuviera en otra', () => {
      openStats({ sessions: mySessions(20) });
      cy.wait('@getSessions');
      clickSceneText('StatsScene', 'Siguiente →');
      cy.wait('@getSessions').its('request.query.page').should('equal', '2');

      minPoints().clear().type('1500');
      apply();

      cy.wait('@getSessions').its('request.query.page').should('equal', '1');
    });
  });

  describe('paginación', () => {
    it('con una sola página muestra "Página 1 de 1" y ningún botón', () => {
      openStats({ sessions: mySessions(5) });

      expectSceneText('StatsScene', 'Página 1 de 1');
      expectNoSceneText('StatsScene', 'Siguiente →');
      expectNoSceneText('StatsScene', '← Anterior');
    });

    it('en la primera página solo hay "Siguiente"; en el medio ambos; en la última solo "Anterior"', () => {
      openStats({ sessions: mySessions(20) });

      expectSceneText('StatsScene', 'Página 1 de 3');
      expectSceneText('StatsScene', 'Siguiente →');
      expectNoSceneText('StatsScene', '← Anterior');

      clickSceneText('StatsScene', 'Siguiente →');
      expectSceneText('StatsScene', 'Página 2 de 3');
      expectSceneText('StatsScene', '← Anterior');
      expectSceneText('StatsScene', 'Siguiente →');

      clickSceneText('StatsScene', 'Siguiente →');
      expectSceneText('StatsScene', 'Página 3 de 3');
      expectSceneText('StatsScene', '← Anterior');
      expectNoSceneText('StatsScene', 'Siguiente →');
    });

    it('cada cambio de página pide esa página, reemplaza las filas y conserva los filtros', () => {
      openStats({ sessions: mySessions(20) });
      cy.wait('@getSessions');
      minPoints().clear().type('300');
      apply();
      cy.wait('@getSessions');
      expectSceneText('StatsScene', '2000');

      clickSceneText('StatsScene', 'Siguiente →');

      cy.wait('@getSessions').its('request.query').should('deep.include', { page: '2', min_score: '300' });
      expectSceneText('StatsScene', 'Mostrando 8-14 de 20 sesiones');
      expectSceneText('StatsScene', '1300');
      expectNoSceneText('StatsScene', '2000');

      clickSceneText('StatsScene', '← Anterior');
      expectSceneText('StatsScene', '2000');
    });
  });

  describe('errores', () => {
    it('si no se pueden cargar las sesiones muestra el error y "Cerrar" vuelve al menú', () => {
      openStats({ sessions: [], listFails: true });

      expectSceneText('StatsScene', 'ERROR');
      expectSceneText('StatsScene', 'Request failed with status code 500');

      clickSceneText('StatsScene', 'Cerrar');

      waitForScene('MenuScene');
    });

    it('en el error no hay barra de filtros', () => {
      openStats({ sessions: [], listFails: true });
      expectSceneText('StatsScene', 'ERROR');

      cy.window().should((win) => expect(statsFilterBars(win)).to.have.length(0));
    });
  });

  describe('navegación', () => {
    it('"← Volver al Menú" regresa al menú y retira la barra de filtros', () => {
      openStats({ sessions: mySessions(3) });
      bar().should('exist');

      clickSceneText('StatsScene', '← Volver al Menú');

      waitForScene('MenuScene');
      cy.window().should((win) => expect(statsFilterBars(win)).to.have.length(0));
    });

    it('se puede volver a entrar a Estadísticas y la barra no se duplica', () => {
      openStats({ sessions: mySessions(3) });
      clickSceneText('StatsScene', '← Volver al Menú');
      waitForScene('MenuScene');

      openStatsFromMenu();

      expectSceneText('StatsScene', 'MIS ESTADÍSTICAS');
      cy.window().should((win) => expect(statsFilterBars(win)).to.have.length(1));
    });

    // DEFECTO LATENTE (bitácora 014, defecto 3): `shutdown()` es un método de la clase, pero Phaser no lo
    // invoca por nombre y la escena nunca lo registra en SHUTDOWN. Hoy las salidas de la interfaz
    // (volver, cerrar) retiran la barra a mano, por lo que no se ve; si la escena se cierra de otra forma
    // (aquí, scene.start desde fuera) la barra queda en la página. Al corregirlo esperar 0 barras.
    it('(comportamiento actual) si la escena se cierra sin pasar por sus botones, la barra queda en el DOM', () => {
      openStats({ sessions: mySessions(3) });
      bar().should('exist');

      cy.window().then((win) => (win as any).game.scene.start('MenuScene'));

      waitForScene('MenuScene');
      cy.window().should((win) => expect(statsFilterBars(win)).to.have.length(1));
    });
  });

  describe('instantáneas de la escena', () => {
    it('lista con paginación', () => {
      openStats({ sessions: mySessions(12) });
      expectSceneText('StatsScene', 'Página 1 de 2');
      bar();

      expectSnapshot('stats-lista-paginada', { scene: 'StatsScene', dom: (win) => statsFilterBars(win)[0] });
    });

    it('estado vacío', () => {
      openStats({
        sessions: [],
        summary: sessionSummary({ total_sessions: 0, total_sessions_ratio: 0, total_sessions_triangle: 0, avg_score: 0, best_score: 0, total_playtime_minutes: 0 }),
      });
      expectSceneText('StatsScene', 'Mostrando 0-0 de 0 sesiones');
      bar();

      expectSnapshot('stats-vacio', { scene: 'StatsScene', dom: (win) => statsFilterBars(win)[0] });
    });

    it('error al cargar', () => {
      openStats({ sessions: [], listFails: true });
      expectSceneText('StatsScene', 'Request failed with status code 500');

      expectSnapshot('stats-error-carga', { scene: 'StatsScene' });
    });
  });
});
