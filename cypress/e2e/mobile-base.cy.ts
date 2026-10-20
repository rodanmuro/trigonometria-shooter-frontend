import { stubEmptyHistory, stubGameApi } from '../support/api';
import { GAME_HEIGHT, GAME_WIDTH, RATIO_GAME, gameScene, openStatsFromMenu, startGame, visitApp, worldWidth } from '../support/gameDriver';

/** Teléfono en horizontal (≈ iPhone 12) y en vertical */
const PHONE_LANDSCAPE: [number, number] = [844, 390];
const PHONE_PORTRAIT: [number, number] = [390, 844];

describe('Celular: base responsiva', () => {
  describe('en horizontal', () => {
    beforeEach(() => {
      cy.viewport(...PHONE_LANDSCAPE);
    });

    it('el mundo se ensancha a la proporción de la pantalla y el lienzo la llena', () => {
      stubGameApi();
      visitApp({ authenticated: true });
      startGame(RATIO_GAME);
      gameScene();

      cy.get('canvas').then(($canvas) => {
        const r = $canvas[0].getBoundingClientRect();
        expect(r.width, 'ancho').to.be.at.most(PHONE_LANDSCAPE[0] + 0.5);
        expect(r.height, 'alto').to.be.at.most(PHONE_LANDSCAPE[1] + 0.5);
        // La proporción del lienzo es la de la pantalla (≈ 2,16), no 3:2: ya no quedan franjas laterales
        expect(r.width / r.height, 'proporción').to.be.closeTo(PHONE_LANDSCAPE[0] / PHONE_LANDSCAPE[1], 0.05);
        expect(r.width, 'llena el ancho').to.be.closeTo(PHONE_LANDSCAPE[0], 6);
        expect(Math.abs(r.left + r.width / 2 - PHONE_LANDSCAPE[0] / 2), 'centro x').to.be.lessThan(1);
        expect(Math.abs(r.top + r.height / 2 - PHONE_LANDSCAPE[1] / 2), 'centro y').to.be.lessThan(1);
        expect(r.height, 'usa todo el alto').to.be.closeTo(PHONE_LANDSCAPE[1], 1);
      });
    });

    it('la página no desplaza ni desborda', () => {
      stubGameApi();
      visitApp({ authenticated: true });
      startGame(RATIO_GAME);
      gameScene();

      cy.document().then((doc) => {
        const el = doc.documentElement;
        expect(el.scrollWidth, 'sin desborde horizontal').to.be.at.most(el.clientWidth);
        expect(el.scrollHeight, 'sin desborde vertical').to.be.at.most(el.clientHeight);
      });
    });

    it('el lienzo bloquea gestos del navegador y no se puede seleccionar', () => {
      stubGameApi();
      visitApp({ authenticated: true });
      startGame(RATIO_GAME);
      gameScene();

      cy.window().then((win) => {
        const w = worldWidth(win);
        expect(w, 'ancho del mundo').to.be.within(1700, 1800);
        expect(w % 2, 'par').to.equal(0);
      });

      cy.get('canvas').should('have.css', 'touch-action', 'none');
      cy.get('body').should('have.css', 'overscroll-behavior-y', 'none');
      cy.get('body').should('have.css', 'user-select', 'none');
    });

    it('no muestra el aviso de rotación', () => {
      stubGameApi();
      visitApp({ authenticated: true });
      cy.get('#rotate-notice').should('not.be.visible');
    });

    it('el botón de Google del login queda sobre el botón dibujado en el lienzo', () => {
      visitApp({ authenticated: false, googleStub: true });
      cy.get('#google-signin-button').should('exist');

      cy.window().then((win) => {
        const world = worldWidth(win);
        const c = win.document.querySelector('canvas')!.getBoundingClientRect();
        const scale = c.width / world;
        cy.get('#google-signin-button').then(($b) => {
          const b = $b[0].getBoundingClientRect();
          // Centro del botón de Phaser: (mitad del ancho del mundo, 480)
          expect(b.left + b.width / 2, 'centro x').to.be.closeTo(c.left + (world / 2) * scale, 2);
          expect(b.top + b.height / 2, 'centro y').to.be.closeTo(c.top + 480 * scale, 2);
        });
      });
    });

    it('un toque en el lienzo sigue llegando al juego (coordenadas escaladas)', () => {
      stubGameApi();
      visitApp({ authenticated: true });
      startGame(RATIO_GAME);
      gameScene();

      cy.get('canvas').then(($canvas) => {
        const r = $canvas[0].getBoundingClientRect();
        cy.wrap($canvas).trigger('mousemove', r.width / 2, r.height / 2, { force: true });
      });
      cy.window().should((win) => {
        const pointer = (win as unknown as { game: { input: { activePointer: { worldX: number; worldY: number } } } })
          .game.input.activePointer;
        expect(pointer.worldX, 'x del mundo').to.be.closeTo(worldWidth(win) / 2, 3);
        expect(pointer.worldY, 'y del mundo').to.be.closeTo(GAME_HEIGHT / 2, 3);
      });
    });

    it('Estadísticas se abre desde el menú con el lienzo escalado', () => {
      stubGameApi();
      stubEmptyHistory();
      visitApp({ authenticated: true });
      openStatsFromMenu();
    });
  });

  describe('en vertical', () => {
    beforeEach(() => {
      cy.viewport(...PHONE_PORTRAIT);
    });

    // Cypress no emula `pointer: coarse`, así que el aviso se comprueba por su regla de CSS y no por visibilidad.
    it('el aviso de rotación existe y su regla solo aplica a táctiles en vertical', () => {
      stubGameApi();
      visitApp({ authenticated: true });

      cy.get('#rotate-notice').should('contain.text', 'Gira el celular para jugar');
      cy.document().then((doc) => {
        const rule = Array.from(doc.styleSheets)
          .flatMap((sheet) => Array.from(sheet.cssRules))
          .find(
            (r): r is CSSMediaRule =>
              'conditionText' in r && (r as CSSMediaRule).conditionText.includes('orientation: portrait')
          );
        expect(rule, 'regla @media de orientación').to.exist;
        expect(rule!.conditionText).to.contain('pointer: coarse');
      });
    });

    it('con ratón (escritorio estrecho) no se tapa el juego', () => {
      stubGameApi();
      visitApp({ authenticated: true });
      cy.get('#rotate-notice').should('not.be.visible');
    });
  });
});

describe('Escritorio: el mundo conserva 1200 de ancho', () => {
  it('en una ventana 3:2 o más cuadrada el mundo mide 1200×800', () => {
    stubGameApi();
    visitApp({ authenticated: true });
    startGame(RATIO_GAME);
    gameScene();
    cy.window().then((win) => {
      expect(worldWidth(win)).to.equal(GAME_WIDTH);
    });
  });

  it('en una ventana muy ancha (1920×1080) el mundo se ensancha (1422) y el lienzo mantiene su proporción', () => {
    cy.viewport(1920, 1080);
    stubGameApi();
    visitApp({ authenticated: true });
    startGame(RATIO_GAME);
    gameScene();
    cy.window().then((win) => {
      expect(worldWidth(win)).to.equal(1422);
    });
    cy.get('canvas').then(($canvas) => {
      const r = $canvas[0].getBoundingClientRect();
      expect(r.width / r.height).to.be.closeTo(1422 / 800, 0.02);
    });
  });
});
