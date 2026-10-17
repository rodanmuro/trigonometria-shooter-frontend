import { stubGameApi } from '../support/api';
import {
  addCorrectHits,
  cardsOf,
  correctLabel,
  currentLevel,
  currentQuestion,
  currentScore,
  expectSceneText,
  GAMES,
  getScene,
  RATIO_GAME,
  shootCard,
  shootEmptySpace,
  startGame,
  textsOf,
  visitApp,
} from '../support/gameDriver';

const TO_BACKEND: Record<string, string> = { 'CO/H': 'co_h', 'CA/H': 'ca_h', 'CO/CA': 'co_ca' };

GAMES.forEach((game) => {
  describe(`${game.name}: disparos`, () => {
    beforeEach(() => {
      stubGameApi();
      visitApp();
      startGame(game);
      cy.wait('@createSession');
    });

    describe('a una tarjeta correcta', () => {
      it('suma 10 puntos y registra el disparo en el backend con el puntaje y el tiempo (checkpoint)', () => {
        shootCard({ correct: true }).then((target) => {
          cy.wait('@recordShot').then(({ request }) => {
            const body = request.body;
            expect(body.is_correct).to.equal(true);
            expect(body.shot_at).to.match(/^\d{4}-\d{2}-\d{2}T.*Z$/);
            expect(body.coordinate_x).to.be.closeTo(target.x, 1.5);
            expect(body.coordinate_y).to.be.closeTo(target.y, 1.5);
            expect(body.current_score).to.equal(10);
            expect(body.elapsed_seconds).to.be.within(0, 30);
          });
        });
        expectSceneText(game.key, 'Score: 10');
      });

      it('retira la tarjeta golpeada', () => {
        shootCard({ correct: true }).then((target) => {
          cy.wait('@recordShot');
          cy.window().should((win) => {
            // Se compara con booleanos: Cypress no puede inspeccionar una tarjeta de Phaser ya destruida.
            expect(cardsOf(getScene(win, game.key)).includes(target.card), 'sigue en el spawner').to.equal(false);
            expect(target.card.active, 'la tarjeta fue destruida').to.equal(false);
          });
        });
      });
    });

    describe('a una tarjeta incorrecta', () => {
      it('registra is_correct=false', () => {
        shootCard({ correct: false });
        cy.wait('@recordShot').its('request.body.is_correct').should('equal', false);
      });

      it('con 0 puntos el puntaje se queda en 0', () => {
        shootCard({ correct: false });
        cy.wait('@recordShot');
        cy.window().should((win) => expect(currentScore(win)).to.equal(0));
        expectSceneText(game.key, 'Score: 0');
      });

      it('resta 5 puntos cuando ya había puntaje, y el checkpoint lo refleja', () => {
        shootCard({ correct: true });
        cy.wait('@recordShot');
        expectSceneText(game.key, 'Score: 10');

        shootCard({ correct: false });

        cy.wait('@recordShot').its('request.body.current_score').should('equal', 5);
        expectSceneText(game.key, 'Score: 5');
        cy.window().should((win) => expect(currentScore(win)).to.equal(5));
      });
    });

    describe('al aire', () => {
      it('no registra nada en el backend ni cambia el puntaje', () => {
        shootEmptySpace();
        cy.wait(500);

        cy.get('@recordShot.all').should('have.length', 0);
        cy.window().should((win) => expect(currentScore(win)).to.equal(0));
      });

      it('solo se registran los disparos que impactan una tarjeta', () => {
        shootEmptySpace();
        shootCard({ correct: true });
        shootEmptySpace();
        cy.wait('@recordShot');
        cy.wait(500);

        cy.get('@recordShot.all').should('have.length', 1);
      });
    });

    describe('si el backend no registra el disparo', () => {
      it('el juego sigue y el puntaje cuenta igual', () => {
        cy.intercept(
          { method: 'POST', pathname: '/api/sessions/7/shots' },
          { statusCode: 500, body: { success: false } }
        ).as('recordShot');

        shootCard({ correct: true });
        cy.wait('@recordShot');

        expectSceneText(game.key, 'Score: 10');
      });
    });

    describe('subida de nivel (cada 30 puntos)', () => {
      it('a los 30 puntos pasa al nivel 2: avisa, sube la velocidad y cambia de pregunta', () => {
        cy.window().then((win) => {
          const first = currentQuestion(win);
          cy.wrap(first, { log: false }).as('firstQuestion');
        });

        addCorrectHits(3);

        expectSceneText(game.key, '¡NIVEL 2!\nCartas más rápidas');
        cy.window().should((win) => {
          expect(currentLevel(win)).to.equal(2);
          expect(getScene(win, game.key).progressionManager.getSpeedMultiplier()).to.be.closeTo(1.15, 0.001);
          expect(getScene(win, game.key).cardSpawner.speedMultiplier).to.be.closeTo(1.15, 0.001);
        });
        // La pregunta nueva se genera al terminar la animación del aviso, no en cada acierto.
        cy.get('@firstQuestion').then((first) => {
          cy.window().should((win) => {
            expect(currentQuestion(win) !== first, 'se generó una pregunta nueva').to.equal(true);
          });
        });
      });

      it('con 20 puntos todavía no sube; el tercer acierto sí', () => {
        addCorrectHits(2);

        expectSceneText(game.key, 'Score: 20');
        cy.wait(1500);
        cy.window().should((win) => {
          expect(currentLevel(win)).to.equal(1);
          expect(textsOf(getScene(win, game.key)).join('\n')).to.not.include('¡NIVEL');
        });

        addCorrectHits(1);

        expectSceneText(game.key, '¡NIVEL 2!');
      });

      it('después de subir, los disparos usan la pregunta nueva', () => {
        cy.window().then((win) => {
          cy.wrap(currentQuestion(win), { log: false }).as('firstQuestion');
        });
        addCorrectHits(3);
        cy.get('@firstQuestion').then((first) => {
          cy.window().should((win) => {
            expect(currentQuestion(win) !== first, 'se generó una pregunta nueva').to.equal(true);
          });
        });

        shootCard({ correct: true });

        cy.wait('@recordShot').then(({ request }) => {
          cy.window().then((win) => {
            const label = correctLabel(win);
            if (game === RATIO_GAME) {
              expect(request.body.expected_ratio).to.equal(TO_BACKEND[label]);
            } else {
              expect(request.body.expected_function).to.equal(label);
            }
          });
        });
      });
    });
  });
});

describe('Juego 1: contenido del disparo', () => {
  beforeEach(() => {
    stubGameApi();
    visitApp();
    startGame(RATIO_GAME);
    cy.wait('@createSession');
  });

  it('acierto: envía la razón pedida, la fórmula esperada y la elegida (traducidas al backend)', () => {
    shootCard({ correct: true }).then((target) => {
      cy.wait('@recordShot').then(({ request }) => {
        cy.window().then((win) => {
          const q = currentQuestion(win);
          const body = request.body;
          expect(body.trig_function).to.equal(q.trigFunction);
          expect(body.expected_ratio).to.equal(TO_BACKEND[q.correctRatio]);
          expect(body.selected_ratio).to.equal(TO_BACKEND[target.value]);
          expect(body.selected_ratio).to.equal(body.expected_ratio);
          expect(body).not.to.have.property('expected_function');
        });
      });
    });
  });

  it('error: la fórmula elegida es distinta de la esperada', () => {
    shootCard({ correct: false }).then((target) => {
      cy.wait('@recordShot').then(({ request }) => {
        const body = request.body;
        expect(body.selected_ratio).to.equal(TO_BACKEND[target.value]);
        expect(body.selected_ratio).to.not.equal(body.expected_ratio);
      });
    });
  });
});

describe('Juego 2: contenido del disparo', () => {
  beforeEach(() => {
    stubGameApi();
    visitApp();
    startGame(GAMES[1]);
    cy.wait('@createSession');
  });

  it('acierto: envía la función esperada y la elegida', () => {
    shootCard({ correct: true }).then((target) => {
      cy.wait('@recordShot').then(({ request }) => {
        cy.window().then((win) => {
          const body = request.body;
          expect(body.expected_function).to.equal(currentQuestion(win).correctFunction);
          expect(body.selected_function).to.equal(target.value);
          expect(body.selected_function).to.equal(body.expected_function);
          expect(body).not.to.have.property('trig_function');
          expect(body).not.to.have.property('expected_ratio');
        });
      });
    });
  });

  it('error: la función elegida es distinta de la esperada', () => {
    shootCard({ correct: false }).then((target) => {
      cy.wait('@recordShot').then(({ request }) => {
        expect(request.body.selected_function).to.equal(target.value);
        expect(request.body.selected_function).to.not.equal(request.body.expected_function);
      });
    });
  });
});

describe('Disparos sin sesión en el backend', () => {
  GAMES.forEach((game) => {
    it(`${game.name}: no intenta registrar disparos`, () => {
      stubGameApi({ createFails: true });
      visitApp();
      startGame(game);
      cy.wait('@createSession');

      shootCard({ correct: true });
      expectSceneText(game.key, 'Score: 10');
      cy.wait(500);

      cy.get('@recordShot.all').should('have.length', 0);
    });
  });
});
