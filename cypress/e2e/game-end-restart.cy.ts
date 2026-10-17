import { stubGameApi } from '../support/api';
import {
  addCorrectHits,
  clickGame,
  clickSceneText,
  doubleClickSceneText,
  endSessionNow,
  expectNoSceneText,
  expectSceneText,
  GAMES,
  getScene,
  overlayCount,
  shootCard,
  startGame,
  visitApp,
} from '../support/gameDriver';

const CONFIRM = '¿Seguro que deseas iniciar\nuna nueva sesión?';

GAMES.forEach((game) => {
  describe(`${game.name}: fin de sesión y reinicio`, () => {
    describe('con el backend disponible', () => {
      beforeEach(() => {
        stubGameApi({
          finishStats: { total_shots: 37, correct_shots: 25, wrong_shots: 12, accuracy: 67.57, duration_seconds: 300 },
        });
        visitApp();
        startGame(game);
        cy.wait('@createSession');
      });

      it('envía a PUT /sessions/{id}/finish el puntaje y la duración', () => {
        addCorrectHits(5); // 50 puntos
        expectSceneText(game.key, 'Score: 50');

        endSessionNow();

        cy.wait('@finishSession').then(({ request }) => {
          expect(request.body.final_score).to.equal(50);
          expect(request.body.duration_seconds).to.be.within(0, 30);
          expect(request.body.finished_at).to.match(/^\d{4}-\d{2}-\d{2}T.*Z$/);
          expect(request.body).to.have.all.keys('finished_at', 'final_score', 'duration_seconds');
        });
      });

      it('muestra el resumen con las estadísticas que devuelve el backend', () => {
        endSessionNow();
        cy.wait('@finishSession');

        expectSceneText(game.key, '¡SESIÓN COMPLETADA!');
        expectSceneText(game.key, 'Disparos Totales: 37');
        expectSceneText(game.key, 'Aciertos: 25 | Errores: 12');
        expectSceneText(game.key, 'Precisión: 67.57%');
        expectSceneText(game.key, 'Tiempo Jugado: 5:00');
        expectSceneText(game.key, 'Haz clic para nueva sesión');
      });

      it('finaliza la sesión una sola vez', () => {
        endSessionNow();
        cy.wait('@finishSession');
        cy.wait(500);

        cy.get('@finishSession.all').should('have.length', 1);
      });

      it('después de finalizar, un click ya no dispara', () => {
        endSessionNow();
        cy.wait('@finishSession');
        expectSceneText(game.key, '¡SESIÓN COMPLETADA!');

        clickGame(300, 400);

        expectSceneText(game.key, CONFIRM);
        cy.get('@recordShot.all').should('have.length', 0);
      });

      describe('confirmación de reinicio', () => {
        beforeEach(() => {
          endSessionNow();
          cy.wait('@finishSession');
          expectSceneText(game.key, 'Haz clic para nueva sesión');
          clickGame(300, 400);
          expectSceneText(game.key, CONFIRM);
        });

        it('ofrece SÍ y NO y oculta el resumen', () => {
          expectSceneText(game.key, 'SÍ');
          expectSceneText(game.key, 'NO');
          expectNoSceneText(game.key, 'Haz clic para nueva sesión');
        });

        // DEFECTO ACTUAL (bitácora 014, defecto 2): el manejador de NO llama a showSessionSummary(), que
        // registra un input.once('pointerdown'); como el mismo click sigue propagándose, ese manejador se
        // dispara de inmediato y vuelve a mostrar la confirmación. NO no lleva al resumen.
        // Cuando se corrija, esta prueba debe esperar 'Haz clic para nueva sesión' en lugar de la confirmación.
        it('(comportamiento actual) NO no vuelve al resumen: la confirmación reaparece', () => {
          clickSceneText(game.key, 'NO');
          cy.wait(800);

          expectSceneText(game.key, CONFIRM);
          expectNoSceneText(game.key, 'Haz clic para nueva sesión');
          cy.get('@createSession.all').should('have.length', 1);
        });

        // DEFECTO ACTUAL (bitácora 014, defecto 5): cada NO crea otra capa oscura sin retirar la anterior.
        it('(comportamiento actual) cada NO añade otra capa oscura sin retirar la anterior', () => {
          cy.window().should((win) => expect(overlayCount(win, game.key)).to.equal(1));

          clickSceneText(game.key, 'NO');
          expectSceneText(game.key, CONFIRM);

          cy.window().should((win) => expect(overlayCount(win, game.key)).to.equal(2));
        });

        it('SÍ reinicia: crea una sesión nueva del mismo juego y el puntaje vuelve a 0', () => {
          clickSceneText(game.key, 'SÍ');

          cy.get('@createSession.all').should('have.length', 2);
          cy.get('@createSession.all').then((calls: any) => {
            expect(calls[1].request.body.game_mode).to.equal(game.mode);
          });
          expectSceneText(game.key, 'Score: 0');
          expectNoSceneText(game.key, '¡SESIÓN COMPLETADA!');
          cy.window().should((win) => {
            expect(getScene(win, game.key).scoreManager.getScore()).to.equal(0);
            expect(getScene(win, game.key).progressionManager.getCurrentLevel()).to.equal(1);
          });
        });

        // Bitácora 008: el doble clic en SÍ no debe crear dos sesiones (una quedaba huérfana).
        it('un doble clic en SÍ crea una sola sesión nueva', () => {
          doubleClickSceneText(game.key, 'SÍ');

          cy.get('@createSession.all').should('have.length', 2);
          cy.wait(1000);
          cy.get('@createSession.all').should('have.length', 2);
        });

        // DEFECTO ACTUAL (bitácora 014, defecto 1): scene.restart() reutiliza la instancia y `sessionEnded`
        // nunca vuelve a false, así que onShoot() descarta todos los disparos de la partida nueva.
        // Cuando se corrija, esta prueba debe esperar Score: 10 y un POST a /shots.
        it('(comportamiento actual) tras reiniciar los disparos se ignoran: sessionEnded sigue en true', () => {
          clickSceneText(game.key, 'SÍ');
          cy.get('@createSession.all').should('have.length', 2);
          expectSceneText(game.key, 'Score: 0');
          cy.window().should((win) => expect(getScene(win, game.key).sessionEnded).to.equal(true));

          shootCard({ correct: true });
          cy.wait(800);

          expectSceneText(game.key, 'Score: 0');
          cy.get('@recordShot.all').should('have.length', 0);
        });
      });
    });

    describe('si el backend no puede finalizar la sesión', () => {
      beforeEach(() => {
        stubGameApi({ finishFails: true });
        visitApp();
        startGame(game);
        cy.wait('@createSession');
      });

      it('muestra el resumen local con la puntuación del cliente', () => {
        addCorrectHits(5);
        endSessionNow();
        cy.wait('@finishSession');

        expectSceneText(game.key, '¡SESIÓN COMPLETADA!');
        expectSceneText(game.key, 'Puntuación Final: 50');
        expectNoSceneText(game.key, 'Disparos Totales');
      });
    });

    describe('sin sesión en el backend', () => {
      it('no llama a finish y muestra el resumen local', () => {
        stubGameApi({ createFails: true });
        visitApp();
        startGame(game);
        cy.wait('@createSession');

        endSessionNow();

        expectSceneText(game.key, '¡SESIÓN COMPLETADA!');
        expectSceneText(game.key, 'Puntuación Final: 0');
        cy.get('@finishSession.all').should('have.length', 0);
      });
    });
  });
});
