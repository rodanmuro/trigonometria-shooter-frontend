import { stubEmptyAdmin, stubEmptyHistory, stubGameApi } from '../support/api';
import {
  clickSceneText,
  expectNoSceneText,
  expectSceneText,
  RATIO_GAME,
  startGame,
  TRIANGLE_GAME,
  visitApp,
  waitForScene,
} from '../support/gameDriver';

describe('Menú de juegos', () => {
  describe('contenido', () => {
    beforeEach(() => {
      visitApp();
      waitForScene('MenuScene');
    });

    it('muestra el título y los dos juegos', () => {
      expectSceneText('MenuScene', 'TRIGONOMETRIA SHOOTER');
      expectSceneText('MenuScene', 'Elegí un juego');
      expectSceneText('MenuScene', RATIO_GAME.menuLabel);
      expectSceneText('MenuScene', 'Seno, coseno o tangente → ¿qué fórmula la resuelve?');
      expectSceneText('MenuScene', TRIANGLE_GAME.menuLabel);
      expectSceneText('MenuScene', 'Un triángulo con datos → ¿qué razón resuelve X?');
    });

    it('ofrece "Mis estadísticas" a cualquier usuario', () => {
      expectSceneText('MenuScene', 'MIS ESTADÍSTICAS');
    });

    it('un estudiante no ve el panel de administración', () => {
      expectNoSceneText('MenuScene', 'PANEL ADMIN');
    });
  });

  it('un administrador ve el botón del panel', () => {
    visitApp({ profile: 'admin' });
    waitForScene('MenuScene');

    expectSceneText('MenuScene', 'PANEL ADMIN');
  });

  it('un profesor no ve el panel de administración', () => {
    visitApp({ profile: 'teacher' });
    waitForScene('MenuScene');

    expectNoSceneText('MenuScene', 'PANEL ADMIN');
  });

  describe('navegación', () => {
    it('"Juego 1" abre el juego de identificar razones', () => {
      stubGameApi();
      visitApp();

      startGame(RATIO_GAME);

      cy.window().its('game.scene').invoke('isActive', 'MenuScene').should('equal', false);
      cy.wait('@createSession').its('request.body.game_mode').should('equal', 'ratio_identification');
    });

    it('"Juego 2" abre el juego del triángulo', () => {
      stubGameApi();
      visitApp();

      startGame(TRIANGLE_GAME);

      cy.window().its('game.scene').invoke('isActive', 'MenuScene').should('equal', false);
      cy.wait('@createSession').its('request.body.game_mode').should('equal', 'triangle_application');
    });

    it('"Mis estadísticas" abre el reporte propio', () => {
      stubEmptyHistory();
      visitApp();
      waitForScene('MenuScene');

      clickSceneText('MenuScene', 'MIS ESTADÍSTICAS');

      waitForScene('StatsScene');
      expectSceneText('StatsScene', 'MIS ESTADÍSTICAS');
    });

    it('"Panel admin" abre el panel de administración', () => {
      stubEmptyAdmin();
      visitApp({ profile: 'admin' });
      waitForScene('MenuScene');

      clickSceneText('MenuScene', 'PANEL ADMIN');

      waitForScene('AdminScene');
      expectSceneText('AdminScene', 'PANEL DE ADMINISTRACIÓN');
    });
  });
});
