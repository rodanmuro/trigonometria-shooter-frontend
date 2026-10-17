/**
 * Único punto de las pruebas E2E que conoce los internos de Phaser y del juego.
 *
 * El canvas no se puede consultar con selectores, así que se usa `window.game`
 * (expuesto en main.ts) y se leen campos que en TypeScript son `private` pero que en
 * tiempo de ejecución son accesibles. Si el refactor renombra algo, SOLO debe tocarse
 * este archivo: los specs afirman sobre HTTP, localStorage, DOM y textos visibles.
 *
 * Hay dos juegos con la misma infraestructura (BaseGameScene): las funciones de juego
 * detectan cuál está activo, así que los mismos escenarios sirven para ambos.
 */
import { makeJwt } from '../../tests/helpers/jwt';
import { userData } from './fixtures';

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyObj = any;

export const GAME_WIDTH = 1200;
export const GAME_HEIGHT = 800;

/** Zona del canvas sin el HUD (pregunta, puntaje y temporizador arriba). */
const SAFE_BOUNDS = { minX: 100, maxX: 1100, minY: 150, maxY: 730 };

export type Profile = 'student' | 'teacher' | 'admin';
export type GameMode = 'ratio_identification' | 'triangle_application';

export interface GameInfo {
  mode: GameMode;
  key: string;
  /** Título del botón en MenuScene. */
  menuLabel: string;
  name: string;
}

export const GAMES: GameInfo[] = [
  {
    mode: 'ratio_identification',
    key: 'RatioIdentificationScene',
    menuLabel: 'JUEGO 1: Identificar razones',
    name: 'Juego 1 (identificar razones)',
  },
  {
    mode: 'triangle_application',
    key: 'TriangleApplicationScene',
    menuLabel: 'JUEGO 2: Aplicar en el triángulo',
    name: 'Juego 2 (aplicar en el triángulo)',
  },
];

export const RATIO_GAME = GAMES[0];
export const TRIANGLE_GAME = GAMES[1];

export interface VisitOptions {
  /** Siembra una sesión de Google ya iniciada (por defecto sí). */
  authenticated?: boolean;
  profile?: Profile;
  name?: string;
  /** El token guardado ya venció. */
  tokenExpired?: boolean;
  /** Define window.google con un doble que registra initialize/renderButton. */
  googleStub?: boolean;
  /** Semilla de Math.random para reducir la variación entre ejecuciones. */
  seed?: number;
}

export interface VisitResult {
  token: string;
}

// PRNG determinista (mulberry32).
function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Abre la app. Devuelve el JWT sembrado para poder comprobar la cabecera Authorization. */
export function visitApp(options: VisitOptions = {}): VisitResult {
  const {
    authenticated = true,
    profile = 'student',
    name = 'Ana Pérez',
    tokenExpired = false,
    googleStub = false,
    seed = 20260301,
  } = options;

  const nowSec = Math.floor(Date.now() / 1000);
  const token = makeJwt({ name, exp: nowSec + (tokenExpired ? -60 : 3600) });

  // En desarrollo la app se sirve en la raíz (la base /trigonometria/ solo se aplica al compilar).
  cy.visit('/', {
    onBeforeLoad(win) {
      win.Math.random = seededRandom(seed);

      if (authenticated) {
        win.localStorage.setItem('google_auth_token', token);
        win.localStorage.setItem(
          'google_user_data',
          JSON.stringify({
            id: '106839451234567890123',
            email: 'estudiante@cevu.edu.co',
            name,
            picture: '',
            given_name: name.split(' ')[0],
            family_name: name.split(' ').slice(1).join(' '),
            profile,
          })
        );
      }

      if (googleStub) {
        const w = win as AnyObj;
        w.__gsi = { initialized: null, buttonRendered: false };
        w.google = {
          accounts: {
            id: {
              initialize: (config: AnyObj) => {
                w.__gsi.initialized = config;
              },
              renderButton: (el: HTMLElement) => {
                w.__gsi.buttonRendered = true;
                el.textContent = 'Sign in with Google (stub)';
              },
              prompt: () => {},
            },
          },
        };
      }
    },
  });

  return { token };
}

/** Usuario de ejemplo coherente con la sesión sembrada por visitApp. */
export function backendUser(profile: Profile = 'student', overrides: Record<string, unknown> = {}) {
  return userData({ profile, ...overrides });
}

/* ------------------------------------------------------------------ */
/* Escenas y textos                                                    */
/* ------------------------------------------------------------------ */

export function getGame(win: Window): AnyObj {
  return (win as AnyObj).game;
}

export function getScene(win: Window, key: string): AnyObj {
  return getGame(win).scene.getScene(key);
}

/** Espera a que la escena esté activa y la entrega. */
export function waitForScene(key: string): Cypress.Chainable<AnyObj> {
  return cy
    .window({ log: false })
    .should((win) => {
      const game = getGame(win);
      expect(game, 'window.game').to.exist;
      expect(game.scene.isActive(key), `escena ${key} activa`).to.equal(true);
    })
    .then((win) => getScene(win, key));
}

function collectTexts(objects: AnyObj[], out: AnyObj[]): void {
  for (const obj of objects) {
    if (obj.type === 'Text') out.push(obj);
    else if (Array.isArray(obj.list)) collectTexts(obj.list, out);
  }
}

/** Todos los objetos Text de la escena, incluidos los que están dentro de contenedores. */
export function textObjects(scene: AnyObj): AnyObj[] {
  const out: AnyObj[] = [];
  collectTexts(scene.children.list, out);
  return out;
}

export function textsOf(scene: AnyObj): string[] {
  return textObjects(scene).map((t) => t.text as string);
}

/** Reintenta hasta que algún texto de la escena contenga (string) o cumpla (RegExp) lo esperado. */
export function expectSceneText(key: string, expected: string | RegExp): void {
  cy.window({ log: false }).should((win) => {
    const all = textsOf(getScene(win, key));
    const found =
      typeof expected === 'string' ? all.some((t) => t.includes(expected)) : all.some((t) => expected.test(t));
    expect(found, `texto ${String(expected)} en ${key}. Textos: ${JSON.stringify(all)}`).to.equal(true);
  });
}

export function expectNoSceneText(key: string, unexpected: string | RegExp): void {
  cy.window({ log: false }).should((win) => {
    const all = textsOf(getScene(win, key));
    const found =
      typeof unexpected === 'string' ? all.some((t) => t.includes(unexpected)) : all.some((t) => unexpected.test(t));
    expect(found, `no debe haber texto ${String(unexpected)} en ${key}`).to.equal(false);
  });
}

/* ------------------------------------------------------------------ */
/* Clicks sobre el canvas                                              */
/* ------------------------------------------------------------------ */

/** Click en coordenadas del mundo del juego (1200x800), sin importar el tamaño en pantalla. */
export function clickGame(x: number, y: number): void {
  cy.get('canvas').then(($canvas) => {
    const rect = $canvas[0].getBoundingClientRect();
    cy.wrap($canvas).click((x / GAME_WIDTH) * rect.width, (y / GAME_HEIGHT) * rect.height);
  });
}

/**
 * Espera a que Phaser dibuje `count` fotogramas más. Los objetos interactivos creados dentro de un
 * manejador de input (p. ej. los botones SÍ / NO) solo reciben clicks desde el fotograma siguiente;
 * un test es más rápido que cualquier persona y puede clickear antes de que existan para el input.
 */
export function waitFrames(count = 3): void {
  cy.window({ log: false })
    .then((win) => getGame(win).loop.frame as number)
    .then((start) => {
      cy.window({ log: false }).should((win) => {
        expect(getGame(win).loop.frame, `${count} fotogramas desde ${start}`).to.be.at.least(start + count);
      });
    });
}

/** Click en el centro de un texto interactivo (p. ej. los botones SÍ / NO o los del menú). */
export function clickSceneText(key: string, label: string): void {
  waitFrames();
  cy.window({ log: false })
    .then((win) => {
      const text = textObjects(getScene(win, key)).find((t) => t.text === label);
      expect(text, `texto "${label}" en ${key}`).to.exist;
      const b = text.getBounds();
      return { x: b.centerX as number, y: b.centerY as number };
    })
    .then(({ x, y }) => clickGame(x, y));
}

/** Doble clic (dos pulsaciones seguidas) en el centro de un texto interactivo. */
export function doubleClickSceneText(key: string, label: string): void {
  waitFrames();
  cy.window({ log: false })
    .then((win) => {
      const text = textObjects(getScene(win, key)).find((t) => t.text === label);
      expect(text, `texto "${label}" en ${key}`).to.exist;
      const b = text.getBounds();
      return { x: b.centerX as number, y: b.centerY as number };
    })
    .then(({ x, y }) => {
      cy.get('canvas').then(($canvas) => {
        const rect = $canvas[0].getBoundingClientRect();
        cy.wrap($canvas).dblclick((x / GAME_WIDTH) * rect.width, (y / GAME_HEIGHT) * rect.height);
      });
    });
}

/**
 * Espera a que la sesión del backend esté asignada a la escena (la respuesta de POST /sessions ya llegó).
 * Que la petición haya salido no basta: hasta que llega la respuesta `sessionId` es null, y terminar o
 * disparar antes no habla con el backend.
 */
export function expectSessionId(key: string, id: number): void {
  cy.window({ log: false }).should((win) => {
    expect(getScene(win, key).sessionId, `sessionId de ${key}`).to.equal(id);
  });
}

/** Cantidad de capas oscuras (rectángulos a profundidad 3000) del resumen de sesión. */
export function overlayCount(win: Window, key: string): number {
  return getScene(win, key).children.list.filter((o: AnyObj) => o.type === 'Rectangle' && o.depth === 3000).length;
}

/* ------------------------------------------------------------------ */
/* Menú y juego                                                        */
/* ------------------------------------------------------------------ */

/** Desde el menú, abre el juego pulsando su botón (camino real del estudiante). */
export function startGame(game: GameInfo): Cypress.Chainable<AnyObj> {
  waitForScene('MenuScene');
  clickSceneText('MenuScene', game.menuLabel);
  return waitForScene(game.key);
}

/** Escena de juego activa (la del Juego 1 o la del Juego 2). */
export function activeGameScene(win: Window): AnyObj {
  const game = getGame(win);
  const info = GAMES.find((g) => game.scene.isActive(g.key));
  if (!info) throw new Error('No hay ninguna escena de juego activa');
  return game.scene.getScene(info.key);
}

/** Espera a que haya una escena de juego activa y la entrega. */
export function gameScene(): Cypress.Chainable<AnyObj> {
  return cy
    .window({ log: false })
    .should((win) => {
      const game = getGame(win);
      expect(GAMES.some((g) => game.scene.isActive(g.key)), 'alguna escena de juego activa').to.equal(true);
    })
    .then((win) => activeGameScene(win));
}

/** Clave de la escena de juego activa (para usar con expectSceneText y compañía). */
export function activeKey(win: Window): string {
  return GAMES.find((g) => getGame(win).scene.isActive(g.key))!.key;
}

export function cardsOf(scene: AnyObj): AnyObj[] {
  return scene.cardSpawner.cards;
}

/** Primer punto de la zona segura sin tarjetas a menos de 140 px (salvo `ignore`). */
function findFreeSpot(scene: AnyObj, ignore?: AnyObj): { x: number; y: number } {
  const cards = cardsOf(scene).filter((c) => c !== ignore);
  for (let y = SAFE_BOUNDS.minY; y <= SAFE_BOUNDS.maxY; y += 50) {
    for (let x = SAFE_BOUNDS.minX; x <= SAFE_BOUNDS.maxX; x += 50) {
      if (cards.every((c) => Math.hypot(c.x - x, c.y - y) > 140)) return { x, y };
    }
  }
  throw new Error('No se encontró un punto libre en el canvas');
}

/** Detiene las tarjetas guardando su velocidad para devolvérsela después del click. */
function freezeCards(scene: AnyObj): void {
  for (const card of cardsOf(scene)) {
    if (card.__frozenVelocity) continue;
    card.__frozenVelocity = [card.velocityX, card.velocityY];
    card.velocityX = 0;
    card.velocityY = 0;
  }
}

function unfreezeCards(scene: AnyObj): void {
  for (const card of cardsOf(scene)) {
    if (!card.__frozenVelocity) continue;
    [card.velocityX, card.velocityY] = card.__frozenVelocity;
    delete card.__frozenVelocity;
  }
}

export interface ShotTarget {
  /** Etiqueta de la tarjeta: 'CO/H' | 'CA/H' | 'CO/CA' (Juego 1) o 'seno' | 'coseno' | 'tangente' (Juego 2). */
  value: string;
  correct: boolean;
  x: number;
  y: number;
  /** Referencia a la tarjeta, para comprobar después si fue retirada. */
  card: AnyObj;
}

/**
 * Nota: no pasar objetos de Phaser a `expect()`. Cypress los inspecciona para el log y falla con
 * los ya destruidos ("Cannot read properties of null"); comparar siempre con booleanos o valores simples.
 *
 * Dispara de verdad (click en el canvas) a una tarjeta correcta o incorrecta.
 *
 * Espera a que exista una del tipo pedido, la coloca en un punto libre de la zona segura y detiene
 * las demás mientras se hace el click, para que la elección del objetivo no dependa de dónde esté
 * cada tarjeta en ese instante. Después les devuelve su velocidad. El click, el hit-test de
 * CardSpawner.checkHit y el registro del disparo son los reales.
 */
export function shootCard(options: { correct: boolean }): Cypress.Chainable<ShotTarget> {
  const { correct } = options;
  return cy
    .window({ log: false, timeout: 20000 })
    .should((win) => {
      const scene = activeGameScene(win);
      const cards = cardsOf(scene);
      const card = cards.find((c) => c.active && c.isCorrect() === correct);
      const state = {
        tarjetas: cards.length,
        activas: cards.filter((c) => c.active).length,
        correctas: cards.filter((c) => c.isCorrect()).length,
        fps: Math.round(getGame(win).loop.actualFps),
        sessionEnded: scene.sessionEnded,
      };
      expect(card, `tarjeta ${correct ? 'correcta' : 'incorrecta'} disponible. Estado: ${JSON.stringify(state)}`).to.exist;
    })
    .then((win) => {
      const scene = activeGameScene(win);
      const card = cardsOf(scene).find((c) => c.active && c.isCorrect() === correct)!;
      freezeCards(scene);
      const spot = findFreeSpot(scene, card);
      card.setPosition(spot.x, spot.y);
      expect(scene.cardSpawner.checkHit(card.x, card.y) === card, 'el click daría a la tarjeta elegida').to.equal(true);
      return { value: card.getValue(), correct, x: card.x, y: card.y, card } as ShotTarget;
    })
    .then((target) => {
      clickGame(target.x, target.y);
      cy.window({ log: false }).then((win) => unfreezeCards(activeGameScene(win)));
      return cy.wrap(target, { log: false });
    });
}

/** Dispara a un punto del canvas donde no hay ninguna tarjeta cerca. */
export function shootEmptySpace(): void {
  cy.window({ log: false })
    .then((win) => {
      const scene = activeGameScene(win);
      freezeCards(scene);
      return findFreeSpot(scene);
    })
    .then(({ x, y }) => {
      clickGame(x, y);
      cy.window({ log: false }).then((win) => unfreezeCards(activeGameScene(win)));
    });
}

export function currentScore(win: Window): number {
  return activeGameScene(win).scoreManager.getScore();
}

export function currentLevel(win: Window): number {
  return activeGameScene(win).progressionManager.getCurrentLevel();
}

/** Suma puntos sin disparar (atajo para llegar a otro nivel sin disparos reales). */
export function addCorrectHits(count: number): void {
  cy.window({ log: false }).then((win) => {
    const scene = activeGameScene(win);
    for (let i = 0; i < count; i++) scene.scoreManager.addCorrectHit();
  });
}

/** Termina la sesión ya, en lugar de esperar los 5 minutos reales. */
export function endSessionNow(): void {
  cy.window({ log: false }).then((win) => {
    activeGameScene(win).endSession();
  });
}

/** Pregunta actual según el generador del juego activo. */
export function currentQuestion(win: Window): AnyObj {
  return activeGameScene(win).questionGenerator.getCurrentQuestion();
}

/** Etiqueta de la tarjeta correcta de la pregunta actual ('CO/H'…, o 'seno'…). */
export function correctLabel(win: Window): string {
  const scene = activeGameScene(win);
  const q = scene.questionGenerator.getCurrentQuestion();
  return q.correctRatio ?? q.correctFunction;
}
