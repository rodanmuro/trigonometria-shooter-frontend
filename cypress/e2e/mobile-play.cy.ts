import { stubGameApi } from '../support/api';
import {
  activeGameScene,
  cardsOf,
  clickGame,
  expectSceneText,
  GAME_WIDTH,
  GAMES,
  gameScene,
  shootCard,
  startGame,
  visitApp,
  waitFrames,
} from '../support/gameDriver';

const PHONE_LANDSCAPE: [number, number] = [844, 390];

/** Deja una sola tarjeta quieta en el centro del mundo y devuelve su escala y media anchura. */
function parkCardAtCenter() {
  return cy
    .window({ log: false, timeout: 20000 })
    .should((win) => expect(cardsOf(activeGameScene(win)).length).to.be.greaterThan(0))
    .then((win) => {
      const scene = activeGameScene(win);
      const [card, ...others] = cardsOf(scene);
      others.forEach((c) => c.setPosition(-2000, -2000));
      scene.cardSpawner.stopSpawning();
      card.velocityX = 0;
      card.velocityY = 0;
      card.setPosition(GAME_WIDTH / 2, 400);
      return { scale: card.scaleX as number, halfWidth: 70 * (card.scaleX as number), card };
    });
}

GAMES.forEach((game) => {
  describe(`${game.name}: jugabilidad táctil`, () => {
    beforeEach(() => {
      stubGameApi();
    });

    describe('en horizontal (844×390, canvas a ≈ 0,49×)', () => {
      beforeEach(() => {
        cy.viewport(...PHONE_LANDSCAPE);
        visitApp();
        startGame(game);
        gameScene();
        cy.wait('@createSession');
      });

      it('las tarjetas se agrandan para seguir siendo tocables', () => {
        parkCardAtCenter().then(({ scale }) => {
          expect(scale, 'escala de la tarjeta').to.be.greaterThan(1.3);
          cy.window().then((win) => {
            const canvasWidth = win.document.querySelector('canvas')!.getBoundingClientRect().width;
            const screenHeight = 80 * scale * (canvasWidth / GAME_WIDTH);
            expect(screenHeight, 'alto de la tarjeta en pantalla').to.be.at.least(50);
          });
        });
      });

      it('un toque un poco fuera del borde de la tarjeta la acierta (tolerancia del dedo)', () => {
        parkCardAtCenter().then(({ halfWidth, card }) => {
          // 8 px del mundo (≈ 4 px en pantalla) fuera del borde horizontal
          clickGame(GAME_WIDTH / 2 + halfWidth + 8, 400);
          cy.window().should(() => expect(card.active, 'la tarjeta fue golpeada').to.equal(false));
        });
      });

      it('un toque muy lejos de la tarjeta no la acierta', () => {
        parkCardAtCenter().then(({ halfWidth, card }) => {
          clickGame(GAME_WIDTH / 2 + halfWidth + 120, 400);
          waitFrames(3);
          cy.window().should(() => expect(card.active, 'la tarjeta sigue en pantalla').to.equal(true));
        });
      });

      it('hay menos tarjetas simultáneas para no saturar el campo', () => {
        cy.window().then((win) => {
          expect(activeGameScene(win).cardSpawner.getMaxCards(), 'máximo de tarjetas').to.equal(12);
        });
      });

      it('el texto de las tarjetas se dibuja a mayor resolución al agrandarse', () => {
        cy.window({ log: false, timeout: 20000 })
          .should((win) => expect(cardsOf(activeGameScene(win)).length).to.be.greaterThan(0))
          .then((win) => {
            const card = cardsOf(activeGameScene(win))[0];
            expect(card.labelText.style.resolution, 'resolución del texto').to.equal(card.scaleX);
          });
      });

      it('el HUD se agranda y el temporizador baja con él', () => {
        cy.window().then((win) => {
          const scene = activeGameScene(win);
          const hud = scene.sessionTimerDisplay.timerText.scaleX as number;
          expect(hud, 'escala del HUD').to.be.greaterThan(1.3);
          expect(scene.scoreDisplay.scaleX, 'escala del puntaje').to.equal(hud);
          expect(scene.crosshair.scaleX, 'escala de la mira').to.be.greaterThan(1.5);
          if (scene.questionDisplay) {
            const questionBottom = scene.questionDisplay.y + 30 * hud;
            expect(scene.sessionTimerDisplay.timerText.y, 'temporizador debajo de la caja').to.be.greaterThan(
              questionBottom
            );
          }
        });
      });

      it('se puede jugar con toques: acertar suma puntos', () => {
        shootCard({ correct: true });
        expectSceneText(game.key, 'Score: 10');
      });
    });

    describe('en escritorio (1280×900, escala 1)', () => {
      beforeEach(() => {
        visitApp();
        startGame(game);
        gameScene();
        cy.wait('@createSession');
      });

      it('nada cambia: tarjetas, HUD y mira a tamaño natural, hasta 20 tarjetas', () => {
        parkCardAtCenter().then(({ scale }) => expect(scale).to.equal(1));
        cy.window().then((win) => {
          const scene = activeGameScene(win);
          expect(scene.sessionTimerDisplay.timerText.scaleX).to.equal(1);
          expect(scene.sessionTimerDisplay.timerText.y).to.equal(90);
          expect(scene.scoreDisplay.scaleX).to.equal(1);
          expect(scene.crosshair.scaleX).to.equal(1);
          expect(scene.cardSpawner.getMaxCards()).to.equal(20);
        });
      });

      it('el impacto sigue siendo exacto: un toque fuera del borde no acierta', () => {
        parkCardAtCenter().then(({ halfWidth, card }) => {
          clickGame(GAME_WIDTH / 2 + halfWidth + 8, 400);
          waitFrames(3);
          cy.window().should(() => expect(card.active, 'la tarjeta sigue en pantalla').to.equal(true));
        });
      });
    });
  });
});

describe('Juego 2: el triángulo en celular', () => {
  beforeEach(() => {
    stubGameApi();
  });

  // El triángulo entra con una animación de escala (0,85 → escala base, 300 ms): se comprueba su escala
  // base y no la instantánea, para no depender del momento en que se lea.
  it('se agranda, queda debajo del temporizador y por encima de las tarjetas', () => {
    cy.viewport(...PHONE_LANDSCAPE);
    visitApp();
    startGame(GAMES[1]);
    gameScene();
    cy.window().should((win) => {
      const scene = activeGameScene(win);
      const tri = scene.triangleDisplay;
      const timer = scene.sessionTimerDisplay.timerText;
      expect(tri.baseScale, 'escala del triángulo').to.equal(timer.scaleX);
      const topOfA = tri.y + (tri.vertexTextA.y - tri.vertexTextA.height / 2) * tri.baseScale;
      expect(topOfA, 'la A queda debajo del temporizador').to.be.greaterThan(timer.y + timer.displayHeight / 2);
      expect(tri.depth, 'por encima de las tarjetas').to.be.greaterThan(cardsOf(scene)[0]?.depth ?? 0);
    });
  });

  it('en escritorio conserva su posición y tamaño de siempre', () => {
    visitApp();
    startGame(GAMES[1]);
    gameScene();
    cy.window().should((win) => {
      const tri = activeGameScene(win).triangleDisplay;
      expect(tri.baseScale).to.equal(1);
      expect(tri.y).to.equal(300);
    });
  });
});
