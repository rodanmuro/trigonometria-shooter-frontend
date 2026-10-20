import { stubAdminApi, stubGameApi, stubSessionsApi } from '../support/api';
import { adminUsers, mySessions } from '../support/fixtures';
import {
  clickGame,
  clickSceneText,
  endSessionNow,
  expectNoSceneText,
  expectSceneText,
  GAME_WIDTH,
  gameScene,
  getScene,
  openAdminFromMenu,
  openStatsFromMenu,
  RATIO_GAME,
  startGame,
  textObjects,
  visitApp,
  waitForScene,
} from '../support/gameDriver';

const PHONE_LANDSCAPE: [number, number] = [844, 390];

describe('Celular: pantallas secundarias', () => {
  describe('Panel de administración (solo escritorio)', () => {
    it('con el canvas reducido avisa, no pide datos y permite volver', () => {
      cy.viewport(...PHONE_LANDSCAPE);
      stubAdminApi({ users: adminUsers(3) });
      visitApp({ authenticated: true, profile: 'admin' });
      openAdminFromMenu();

      expectSceneText('AdminScene', 'El panel de administración\nestá disponible solo en computador.');
      expectNoSceneText('AdminScene', 'Mostrando 1-3 de 3 usuarios');
      cy.get('#admin-filters').should('not.exist');
      cy.get('@getUsers.all').should('have.length', 0);
      cy.get('@getGroups.all').should('have.length', 0);

      clickSceneText('AdminScene', '← Volver al Menú');
      waitForScene('MenuScene');
    });

    it('en escritorio el panel sigue funcionando', () => {
      stubAdminApi({ users: adminUsers(3) });
      visitApp({ authenticated: true, profile: 'admin' });
      openAdminFromMenu();

      expectSceneText('AdminScene', 'PANEL DE ADMINISTRACIÓN');
      expectSceneText('AdminScene', 'Mostrando 1-3 de 3 usuarios');
      cy.get('#admin-filters').should('exist');
    });
  });

  describe('Resumen de sesión y confirmación de reinicio', () => {
    function finishSession() {
      stubGameApi();
      visitApp({ authenticated: true });
      startGame(RATIO_GAME);
      gameScene();
      cy.wait('@createSession');
      endSessionNow();
      cy.wait('@finishSession');
      expectSceneText(RATIO_GAME.key, 'Haz clic para nueva sesión');
    }

    const boundsOf = (win: Window, label: string) => {
      const text = textObjects(getScene(win, RATIO_GAME.key)).find((t) => t.text === label);
      expect(!!text, `texto "${label}"`).to.equal(true);
      return text.getBounds();
    };

    it('en celular el título y las estadísticas se agrandan y no se pisan', () => {
      cy.viewport(...PHONE_LANDSCAPE);
      finishSession();

      cy.window().then((win) => {
        const title = boundsOf(win, '¡SESIÓN COMPLETADA!');
        const stats = textObjects(getScene(win, RATIO_GAME.key)).find((t) => t.text.startsWith('Puntuación Final'));
        const sb = stats.getBounds();
        const restart = boundsOf(win, 'Haz clic para nueva sesión');
        expect(stats.scaleX, 'estadísticas agrandadas').to.be.greaterThan(1.1);
        expect(title.bottom, 'el título termina sobre las estadísticas').to.be.at.most(sb.top);
        expect(sb.bottom, 'las estadísticas terminan sobre "Haz clic"').to.be.at.most(restart.top);
        expect(restart.bottom, 'todo cabe en el mundo').to.be.lessThan(800);
        expect(title.top, 'el título no sale por arriba').to.be.greaterThan(0);
      });
    });

    it('en celular los botones SÍ y NO son lo bastante grandes para el dedo', () => {
      cy.viewport(...PHONE_LANDSCAPE);
      finishSession();
      clickGame(300, 400);
      expectSceneText(RATIO_GAME.key, '¿Seguro que deseas iniciar\nuna nueva sesión?');

      cy.window().then((win) => {
        const scale = win.document.querySelector('canvas')!.getBoundingClientRect().width / GAME_WIDTH;
        for (const label of ['SÍ', 'NO']) {
          const b = boundsOf(win, label);
          expect(b.width * scale, `ancho de ${label} en pantalla`).to.be.at.least(48);
          expect(b.height * scale, `alto de ${label} en pantalla`).to.be.at.least(48);
        }
        const yes = boundsOf(win, 'SÍ');
        const no = boundsOf(win, 'NO');
        expect(no.left - yes.right, 'separación entre botones').to.be.greaterThan(20);
      });
    });

    it('en escritorio las posiciones y tamaños no cambian', () => {
      finishSession();

      cy.window().then((win) => {
        const texts = textObjects(getScene(win, RATIO_GAME.key));
        const title = texts.find((t) => t.text === '¡SESIÓN COMPLETADA!');
        const restart = texts.find((t) => t.text === 'Haz clic para nueva sesión');
        expect(title.scaleX).to.equal(1);
        expect(title.y).to.equal(250);
        expect(restart.y).to.equal(550);
      });
      clickGame(300, 400);
      expectSceneText(RATIO_GAME.key, 'SÍ');
      cy.window().then((win) => {
        const yes = textObjects(getScene(win, RATIO_GAME.key)).find((t) => t.text === 'SÍ');
        expect(yes.scaleX).to.equal(1);
        expect(yes.x).to.equal(500);
        expect(yes.y).to.equal(480);
      });
    });
  });

  describe('Estadísticas', () => {
    const bounds = (t: any) => t.getBounds();

    it('en celular: columnas reducidas, filas sin solapes y todo dentro del mundo', () => {
      cy.viewport(...PHONE_LANDSCAPE);
      stubSessionsApi({ sessions: mySessions(7) });
      visitApp();
      openStatsFromMenu();
      expectSceneText('StatsScene', 'Puntos');

      cy.window().then((win) => {
        const texts = textObjects(getScene(win, 'StatsScene'));
        const headers = texts.map((t) => t.text);
        expect(headers, 'sin la columna Disparos').not.to.include('Disparos');
        expect(headers, 'sin la columna Hora').not.to.include('Hora');
        for (const h of ['#', 'Fecha', 'Puntos', 'Modo', 'Aciertos', 'Precisión']) expect(headers).to.include(h);
        // La fecha es corta: dd/mm hh:mm
        expect(headers.some((t) => /^\d{2}\/\d{2} \d{2}:\d{2}$/.test(t)), 'fecha corta').to.equal(true);
        // Nada se sale del mundo
        texts.forEach((t) => {
          const b = bounds(t);
          expect(b.left, `${t.text} dentro (izq.)`).to.be.at.least(-1);
          expect(b.right, `${t.text} dentro (der.)`).to.be.at.most(GAME_WIDTH + 1);
          expect(b.bottom, `${t.text} dentro (abajo)`).to.be.at.most(801);
        });
        // Las filas (columna "#") no se solapan entre sí
        const rows = texts.filter((t) => /^\d+$/.test(t.text) && Math.abs(t.x - (GAME_WIDTH / 2 - 500)) < 2);
        const ys = rows.map((t) => t.y).sort((a, b) => a - b);
        for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1], 'separación de filas').to.be.at.least(45);
      });
    });

    it('en celular la barra de filtros está anclada al canvas, es compacta y no tapa la tabla', () => {
      cy.viewport(...PHONE_LANDSCAPE);
      stubSessionsApi({ sessions: mySessions(3) });
      visitApp();
      openStatsFromMenu();

      cy.get('#stats-filters').should('have.class', 'filter-bar--compact');
      cy.get('canvas').then(($canvas) => {
        const c = $canvas[0].getBoundingClientRect();
        const scale = c.width / GAME_WIDTH;
        cy.get('#stats-filters').then(($bar) => {
          const b = $bar[0].getBoundingClientRect();
          expect(b.top, `borde superior a 135 del mundo (canvas top ${c.top}, escala ${scale})`).to.be.closeTo(c.top + 135 * scale, 2);
          expect(b.left + b.width / 2, 'centrada en el canvas').to.be.closeTo(c.left + c.width / 2, 2);
          expect(b.width, 'cabe en el canvas').to.be.at.most(c.width);
          cy.window().then((win) => {
            const header = textObjects(getScene(win, 'StatsScene')).find((t) => t.text === 'Puntos');
            expect(b.bottom, 'termina antes del encabezado de la tabla').to.be.lessThan(
              c.top + (header.getBounds().top as number) * scale
            );
          });
        });
      });
    });

    it('en escritorio la barra está a 135 del borde superior del canvas y no es compacta', () => {
      stubSessionsApi({ sessions: mySessions(3) });
      visitApp();
      openStatsFromMenu();

      cy.get('#stats-filters').should('not.have.class', 'filter-bar--compact');
      cy.get('canvas').then(($canvas) => {
        const c = $canvas[0].getBoundingClientRect();
        cy.get('#stats-filters').then(($bar) => {
          expect($bar[0].getBoundingClientRect().top, `borde superior (canvas top ${c.top}, h ${c.height})`).to.be.closeTo(c.top + 135, 2);
        });
      });
      expectSceneText('StatsScene', 'Disparos');
      expectSceneText('StatsScene', 'Hora');
    });
  });
});
