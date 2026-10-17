import { stubGameApi } from '../support/api';
import {
  cardsOf,
  correctLabel,
  currentQuestion,
  expectSceneText,
  GAMES,
  gameScene,
  getScene,
  RATIO_GAME,
  startGame,
  textsOf,
  TRIANGLE_GAME,
  visitApp,
} from '../support/gameDriver';

const RATIOS = ['CO/H', 'CA/H', 'CO/CA'];
const FUNCTIONS = ['seno', 'coseno', 'tangente'];

GAMES.forEach((game) => {
  describe(`${game.name}: inicio de sesión`, () => {
    describe('creación de la sesión en el backend', () => {
      it('hace POST /sessions con la hora de inicio, el tamaño del canvas, el modo y el token', () => {
        stubGameApi();
        const { token } = visitApp();
        startGame(game);

        cy.wait('@createSession').then(({ request }) => {
          expect(request.headers.authorization).to.equal(`Bearer ${token}`);
          expect(request.body.started_at).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
          expect(request.body.canvas_width).to.equal(1200);
          expect(request.body.canvas_height).to.equal(800);
          expect(request.body.game_mode).to.equal(game.mode);
        });
      });

      it('crea una sola sesión por partida', () => {
        stubGameApi();
        visitApp();
        startGame(game);
        cy.wait('@createSession');

        cy.get('@createSession.all').should('have.length', 1);
      });

      it('si el backend falla, el juego arranca igual', () => {
        stubGameApi({ createFails: true });
        visitApp();
        startGame(game);
        cy.wait('@createSession');

        expectSceneText(game.key, /^Score: 0$/);
        cy.window().should((win) => {
          expect(cardsOf(getScene(win, game.key)).length).to.be.greaterThan(0);
        });
      });
    });

    describe('HUD inicial', () => {
      beforeEach(() => {
        stubGameApi();
        visitApp();
        startGame(game);
      });

      it('muestra el puntaje en 0', () => {
        expectSceneText(game.key, 'Score: 0');
      });

      it('muestra el temporizador con la duración de la sesión (5:00)', () => {
        expectSceneText(game.key, /^[45]:\d{2}$/);
      });

      it('arranca en el nivel 1 con velocidad normal', () => {
        cy.window().should((win) => {
          const scene = getScene(win, game.key);
          expect(scene.progressionManager.getCurrentLevel()).to.equal(1);
          expect(scene.progressionManager.getSpeedMultiplier()).to.equal(1);
        });
      });
    });

    describe('tarjetas', () => {
      beforeEach(() => {
        stubGameApi();
        visitApp();
        startGame(game);
      });

      it('aparecen con el tiempo, nunca más de 20 a la vez', () => {
        cy.window().should((win) => {
          expect(cardsOf(getScene(win, game.key)).length).to.be.greaterThan(2);
        });
        cy.wait(3000);
        cy.window().then((win) => {
          expect(cardsOf(getScene(win, game.key)).length).to.be.at.most(20);
        });
      });

      it('solo llevan etiquetas del conjunto de este juego; las correctas llevan la respuesta y las demás no', () => {
        cy.window().should((win) => {
          const answer = correctLabel(win);
          const allowed = game === RATIO_GAME ? RATIOS : FUNCTIONS;
          const cards = cardsOf(getScene(win, game.key));
          expect(cards.length).to.be.greaterThan(3);
          for (const card of cards) {
            expect(allowed).to.include(card.getValue());
            if (card.isCorrect()) expect(card.getValue()).to.equal(answer);
            else expect(card.getValue()).to.not.equal(answer);
          }
        });
      });

      it('las tarjetas muestran su etiqueta en mayúsculas', () => {
        cy.window().should((win) => {
          const scene = getScene(win, game.key);
          const labels = textsOf(scene);
          const card = cardsOf(scene)[0];
          expect(labels, 'texto de la primera tarjeta').to.include(card.getValue().toUpperCase());
        });
      });

      it('se mueven (no están quietas)', () => {
        cy.window().then((win) => {
          const scene = getScene(win, game.key);
          const before = cardsOf(scene).map((c) => ({ c, x: c.x, y: c.y }));
          expect(before.length).to.be.greaterThan(0);
          cy.wait(600).then(() => {
            const moved = before.some(({ c, x, y }) => c.active && (c.x !== x || c.y !== y));
            expect(moved, 'alguna tarjeta cambió de posición').to.equal(true);
          });
        });
      });
    });
  });
});

describe('Juego 1: pregunta', () => {
  beforeEach(() => {
    stubGameApi();
    visitApp();
    startGame(RATIO_GAME);
  });

  it('muestra la razón a identificar (SENO, COSENO o TANGENTE) y su fórmula es la correcta', () => {
    expectSceneText(RATIO_GAME.key, /^(SENO|COSENO|TANGENTE)$/);
    cy.window().should((win) => {
      const q = currentQuestion(win);
      const expected = { seno: 'CO/H', coseno: 'CA/H', tangente: 'CO/CA' }[q.trigFunction as string];
      expect(q.correctRatio).to.equal(expected);
      expect(textsOf(getScene(win, RATIO_GAME.key))).to.include(q.trigFunction.toUpperCase());
    });
  });
});

describe('Juego 2: triángulo', () => {
  beforeEach(() => {
    stubGameApi();
    visitApp();
    startGame(TRIANGLE_GAME);
  });

  it('dibuja los vértices A, B y C', () => {
    gameScene();
    for (const vertex of ['A', 'B', 'C']) expectSceneText(TRIANGLE_GAME.key, new RegExp(`^${vertex}$`));
  });

  it('muestra un lado con la incógnita X, otro con un valor de 4 a 20 y el ángulo de referencia en grados', () => {
    cy.window().should((win) => {
      const q = currentQuestion(win);
      const texts = textsOf(getScene(win, TRIANGLE_GAME.key));

      const labels = Object.values(q.sideLabels) as string[];
      expect(labels).to.have.length(2);
      expect(labels.filter((l) => l === 'X')).to.have.length(1);
      const known = Number(labels.find((l) => l !== 'X'));
      expect(known).to.be.within(4, 20);

      expect(texts).to.include('X');
      expect(texts).to.include(String(known));
      expect(texts).to.include(`${q.angleDegrees}°`);
      expect(q.angleDegrees).to.be.within(20, 70);
    });
  });

  it('la pregunta correcta sale de los roles de los lados mostrados', () => {
    cy.window().should((win) => {
      const q = currentQuestion(win);
      const role = (side: string) => {
        if (side === 'c') return 'hypotenuse';
        if (q.referenceAngle === 'A') return side === 'a' ? 'opposite' : 'adjacent';
        return side === 'b' ? 'opposite' : 'adjacent';
      };
      const roles = (q.shownSides as string[]).map(role).sort().join(',');
      const expected = { 'hypotenuse,opposite': 'seno', 'adjacent,hypotenuse': 'coseno', 'adjacent,opposite': 'tangente' }[
        roles
      ];
      expect(q.correctFunction).to.equal(expected);
    });
  });
});
