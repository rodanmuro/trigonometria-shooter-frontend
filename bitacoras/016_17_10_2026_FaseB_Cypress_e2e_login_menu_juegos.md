# Bitácora 016 - 17/10/2026

## Fase B: Cypress y pruebas E2E de login, menú y los dos juegos

---

## Resumen

Segunda fase del plan de la bitácora 014. Se instaló Cypress y se escribieron **93 pruebas end-to-end** que ejercitan el juego real en un navegador (Electron) con el backend simulado. **No se modificó ningún archivo de `src/`.**

Al fijar el comportamiento actual se **confirmaron tres defectos** deducidos por lectura en la planeación (sección "Defectos confirmados"). Se documentan como pruebas "(comportamiento actual)" y **no se corrigieron**, según la regla de caracterización.

**Estado:** ✅ Completada. E2E 93/93, Vitest 116/116, `npm run build`, `typecheck:tests` y `typecheck:e2e` sin errores.

---

## Cambios realizados

### Dependencias (solo desarrollo)
- `cypress@14.5.4` (el binario ya estaba en la caché de la máquina) y `start-server-and-test@^3.0.13`.

### Archivos nuevos
```
cypress.config.ts                 baseUrl 127.0.0.1:5174, viewport 1280x900, tareas `log` y `matchSnapshot` (copiado de multiplicación)
cypress/tsconfig.json
cypress/support/e2e.ts            red de seguridad: /api/** sin simular → 501; script de Google vacío
cypress/support/fixtures.ts       respuestas de ejemplo con la forma del backend (con game_mode, trig_game_session_id, resumen por modo)
cypress/support/api.ts            stubGameApi(), stubEmptyHistory(), stubEmptyAdmin()
cypress/support/gameDriver.ts     ÚNICO punto que conoce los internos de Phaser
cypress/e2e/login.cy.ts           8 pruebas
cypress/e2e/menu.cy.ts            9 pruebas
cypress/e2e/game-start.cy.ts      24 pruebas
cypress/e2e/game-shots.cy.ts      28 pruebas
cypress/e2e/game-end-restart.cy.ts 24 pruebas
```
`.gitignore`: se añadieron `cypress/screenshots`, `cypress/videos` y `cypress/downloads`.

### Scripts nuevos en `package.json`
| Script | Qué hace |
|--------|----------|
| `npm run e2e` | Levanta Vite en el puerto 5174 y ejecuta toda la suite en modo headless |
| `npm run e2e:open` | Igual, pero abre la interfaz interactiva de Cypress |
| `npm run dev:e2e` | Solo el servidor de pruebas (`VITE_API_URL=/api`, Client ID de prueba) |
| `npm run cypress:run` / `cypress:open` | Cypress sin levantar el servidor (con `env -u ELECTRON_RUN_AS_NODE`) |
| `npm run typecheck:e2e` | `tsc -p cypress/tsconfig.json` |
| `npm run e2e:update-snapshots` | `UPDATE_SNAPSHOTS=1 npm run e2e` (se usará desde la fase D) |

Para ejecutar un spec concreto: dejar `npm run dev:e2e` corriendo en otra terminal y luego
`env -u ELECTRON_RUN_AS_NODE npx cypress run --spec cypress/e2e/login.cy.ts`.

---

## Decisiones de diseño

- **Mismos escenarios para los dos juegos.** Ambos extienden `BaseGameScene`, así que `game-start`, `game-shots` y `game-end-restart` recorren `GAMES` (Juego 1 y Juego 2) con las mismas pruebas; lo que es propio de cada juego va aparte (pregunta del Juego 1, triángulo del Juego 2 y contenido de cada payload de disparo).
- **El `gameDriver` detecta el juego activo** (`activeGameScene`): los specs no necesitan saber qué escena es. `startGame(game)` entra por el menú pulsando su botón, que es el camino real del estudiante.
- **Backend siempre simulado** con `cy.intercept`, por `pathname` y método. `POST /sessions` devuelve el `game_mode` que pidió el juego.
- **API en el mismo origen:** el servidor de pruebas arranca con `VITE_API_URL=/api`, así que no hay CORS.
- **Base de la aplicación:** en desarrollo el servidor sirve en `/` (la base `/trigonometria/` solo se aplica al compilar), a diferencia de multiplicación, que usa `/multiplicacion/` también en desarrollo.
- **Sesión sembrada:** `visitApp()` guarda un JWT falso vigente y los datos del usuario en `localStorage`; `Math.random` usa una semilla fija. La app arranca en `MenuScene`, no directamente en el juego.
- **Google Identity Services:** script externo sustituido por uno vacío, y `window.google` por un doble.
- **Acceso al juego sin tocar `src/`:** `main.ts` ya expone `window.game`. A diferencia de multiplicación, `CardSpawner` no tiene `getCards()`, así que el driver lee su campo privado `cards`; también `speedMultiplier`, `scoreManager`, `progressionManager`, `questionGenerator` y llama a `endSession()`. Todo concentrado en `gameDriver.ts`.
- **Disparos reales:** `shootCard({ correct })` coloca una tarjeta del tipo pedido en un punto libre, detiene las demás durante el click y después les devuelve la velocidad. El click, `checkHit` y el registro del disparo son los reales.
- **Atajos acotados:** los puntos se suman con `scoreManager.addCorrectHit()` (tres disparos reales por nivel serían lentos) y el fin de sesión se fuerza con `endSession()`.

---

## Qué cubren las pruebas

| Spec | Pruebas | Cubre |
|------|---------|-------|
| `login` | 8 | Pantalla de login (título, subtítulo, instrucciones); GIS inicializado con el Client ID y botón pintado; aviso si GIS no cargó; token vencido (se descarta); login completo (verify → bienvenida → **menú**, perfil del backend guardado); error del backend; credential vencido sin llamar al backend; sesión vigente salta el login |
| `menu` | 9 | Título y descripciones de los dos juegos; "Mis estadísticas" para todos; "Panel admin" solo para admin (no para estudiante ni profesor); cada botón navega a su escena y el juego crea la sesión con su `game_mode` |
| `game-start` (×2 juegos + propios) | 24 | `POST /sessions` con hora ISO, canvas 1200×800, modo y token; una sola sesión; el juego arranca aunque falle el backend; HUD inicial (Score 0, 5:00, nivel 1, velocidad 1); tarjetas (aparecen, máx. 20, solo etiquetas del conjunto del juego, correctas = respuesta, texto en mayúsculas, se mueven). **Juego 1:** razón mostrada y fórmula correcta. **Juego 2:** vértices A/B/C, una X, un valor 4–20 y los grados; la función correcta sale de los roles de los lados |
| `game-shots` (×2 + propios) | 28 | Acierto +10 con payload (coordenadas, `shot_at`, **`current_score` y `elapsed_seconds`**); tarjeta retirada; error con 0 puntos, con piso en 0 y −5 con puntaje previo; disparo al aire; solo se registran impactos; fallo del backend; **subida de nivel a los 30 puntos** (aviso, velocidad ×1,15 en progresión y spawner, pregunta nueva), 20 puntos no sube, disparos posteriores con la pregunta nueva. **Juego 1:** `trig_function`, `expected_ratio`, `selected_ratio` traducidos a `co_h`/`ca_h`/`co_ca`. **Juego 2:** `expected_function`/`selected_function`. Sin sesión en el backend no se registran disparos |
| `game-end-restart` (×2) | 24 | `PUT finish` con puntaje, duración y exactamente tres campos; resumen con datos del backend; una sola finalización; un click tras finalizar no dispara; confirmación SÍ/NO; SÍ reinicia del mismo juego; **doble clic en SÍ crea una sola sesión** (bitácora 008); resumen local si falla `finish` o no hubo sesión; defectos de abajo |

---

## Defectos confirmados (comportamiento actual, NO corregidos)

Las pruebas marcadas "(comportamiento actual)" los fijan en los dos juegos. Al corregirlos deben invertirse. Coinciden con los defectos 1, 2 y 5 de la bitácora 014.

### 1. Después de reiniciar la partida no se puede disparar (grave)
Tras **SÍ → nueva sesión** el juego arranca, genera tarjetas y crea la sesión en el backend, pero todos los disparos se ignoran: el puntaje no sube y no se envía nada. `scene.restart()` reutiliza la instancia de la escena y `sessionEnded` queda en `true` (`create()` no lo restablece). La bitácora 008 solo corrigió el doble clic.
- **Prueba:** `game-end-restart` → "tras reiniciar los disparos se ignoran: sessionEnded sigue en true".
- **Por revisar (no probado):** por el mismo motivo `sessionId` y `lastFinishedSessionData` conservan el valor de la partida anterior.
- **Corrección prevista:** restablecer los tres campos al inicio de `create()` (fase C).

### 2. El botón NO de la confirmación no vuelve al resumen
La confirmación reaparece al instante: el manejador de NO llama a `showSessionSummary()`, que registra un `input.once('pointerdown')`, y el mismo click lo dispara.
- **Prueba:** `game-end-restart` → "NO no vuelve al resumen: la confirmación reaparece".
- **Corrección prevista:** mostrar el resumen en el fotograma siguiente (fase C).

### 3. Capa oscura acumulada
Cada NO crea otra capa oscura (rectángulo a profundidad 3000) sin retirar la anterior; tras un NO hay dos.
- **Prueba:** `game-end-restart` → "cada NO añade otra capa oscura sin retirar la anterior".
- **Corrección prevista:** etapa 6 del refactor (`SessionSummaryOverlay`).

---

## Diferencias respecto a multiplicación

- No existe el defecto del menú de usuario con manejadores duplicados (aquí no hay `UserMenu`).
- El resumen local de trigonometría solo muestra "Puntuación Final"; no hay nivel ni tabla alcanzada.
- `finish` envía tres campos (sin `max_level_reached`).
- Un nivel son 30 puntos (3 aciertos) y la pregunta cambia al subir de nivel una vez termina la animación del aviso (~1,6 s).
- El login lleva al **menú**, no al juego, y tarda 2 s en pasar tras la bienvenida.

---

## Tropiezos de entorno y de herramientas (heredados de multiplicación)

1. `ELECTRON_RUN_AS_NODE` en terminales de VS Code rompe el binario de Cypress: los scripts usan `env -u ELECTRON_RUN_AS_NODE`.
2. `npm run e2e -- --spec …` no funciona; para un spec suelto, servidor aparte (ver arriba).
3. No pasar objetos de Phaser a `expect()` (Cypress los inspecciona y falla con los destruidos).
4. Los objetos interactivos creados dentro de un manejador de input (SÍ/NO) solo reciben clicks desde el fotograma siguiente: `clickSceneText()` espera tres fotogramas.
5. **Un fallo degrada el resto de la ejecución** (el navegador baja a ~1 fps): ante varios fallos seguidos, buscar el **primero**.
6. Para esperar el final de una ejecución en segundo plano, mirar un log **nuevo**; los logs de Cypress mezclan bytes binarios (`grep -a`).

---

## Verificación de que las pruebas E2E detectan errores

Mutaciones temporales en `src/` (restauradas con `git checkout`):

| Mutación | Spec ejecutado | Resultado |
|----------|----------------|-----------|
| El Juego 2 envía como `selected_function` la función esperada en vez de la de la tarjeta | `game-shots` | Falla "error: la función elegida es distinta de la esperada" (las dos siguientes son consecuencia en cadena) |
| El disparo no envía `current_score` | `game-shots` | Fallan las pruebas de acierto/checkpoint de los dos juegos (y las posteriores, en cadena) |
| Se elimina la guarda `choiceMade` del doble clic | `game-end-restart` | **No falla** (24/24): `disableInteractive()` ya impide el segundo clic |
| Se eliminan `choiceMade` **y** `disableInteractive()` | `game-end-restart` | Falla "un doble clic en SÍ crea una sola sesión nueva" en los dos juegos |

La última fila muestra que la prueba del doble clic es real, y que las dos protecciones de la bitácora 008 son redundantes entre sí (se cubren mutuamente). Tras restaurar, `src/` quedó sin cambios (`git status --short src` vacío).

---

## Lo que queda fuera de esta fase

- `StatsScene` (resumen por modo, tabla, filtros, paginación) y `AdminScene`: fase D, con instantáneas de la lista de objetos de la escena.
- Pantalla de resumen: verificada por texto; el diseño visual lo cubrirá la instantánea de la fase D.
- Audio, efectos visuales (explosiones, tweens) y rendimiento en celular.
- Apariencia del triángulo (posición de etiquetas y forma): sin instantánea todavía.

---

## Próximo paso

**Fase C:** corregir los defectos 1 y 2 (reinicio y botón NO) con estas pruebas ya escritas como red de seguridad, invirtiendo las que hoy los fijan, y añadiendo las que cubren sus consecuencias (`sessionId` y `lastFinishedSessionData`). El defecto 3 se deja para el refactor.

---

**Documento creado por:** Claude (Sonnet 5.5)
**Fecha:** 17 de octubre de 2026
**Estado:** Fase B completada
