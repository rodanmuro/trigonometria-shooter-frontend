# 005 - 29/07/2026 - Incremento 2: Juego 2 (aplicación en triángulo) + menú (Frontend)

## Resumen

Se agrega un segundo juego: en vez de identificar la fórmula de una razón nombrada (Juego 1), el estudiante ve un **triángulo rectángulo fijo** (ángulo recto siempre en C, sin rotar) con dos de sus tres lados etiquetados — uno con un valor decorativo, otro como incógnita **X** — y dispara el **nombre de la función** (seno/coseno/tangente) que resuelve X, para el ángulo de referencia marcado (A o B). Se agrega un menú inicial para elegir entre ambos juegos.

## Regla matemática (verificada antes de integrarla a Phaser)

La razón correcta depende únicamente de qué par de lados está etiquetado, relativo al ángulo de referencia (nunca de cuál sea el lado físico): opuesto+hipotenusa→seno, adyacente+hipotenusa→coseno, opuesto+adyacente→tangente. Esto se logra generando la pregunta en términos de **lados físicos mostrados** (a, b o c) y calculando su rol según el ángulo de referencia elegido — así el mismo dibujo (mismos 2 lados con valores) puede dar respuestas distintas según si se pregunta por A o por B, que es justo el punto pedagógico del ejercicio.

Se verificó con un script Node suelto (`verify_triangle_rules.js`, no forma parte del repo) que las 6 combinaciones posibles (2 ángulos × 3 pares de lados) mapean correctamente, incluyendo el caso cruzado: mismos lados {a,c} o {b,c}, ángulo A da una función y ángulo B da la otra.

## Cambios realizados

- **Refactor**: se extrajo `scenes/BaseGameScene.ts` (clase abstracta) con toda la infraestructura genérica que antes vivía en `GameScene.ts` (~500 líneas): ciclo de vida de sesión, timer, score, progresión de velocidad, pantallas de resumen/reinicio, y el flujo de disparo. Los juegos concretos solo implementan: `gameMode`, `initQuestion()`, `generateNewQuestion()`, `buildShotPayload()`, `onCorrectFeedback()`, `onWrongFeedback()`.
- `GameScene.ts` → renombrado a `scenes/RatioIdentificationScene.ts` (Juego 1, ahora extiende `BaseGameScene`, sin cambios de comportamiento).
- `scenes/TriangleApplicationScene.ts` (nuevo, Juego 2): usa `TriangleQuestionGenerator` + `TriangleDisplay`.
- `scenes/MenuScene.ts` (nuevo): dos botones, uno por juego.
- `systems/TriangleQuestionGenerator.ts` (nuevo): implementa la regla matemática de arriba.
- `components/TriangleDisplay.ts` (nuevo): dibuja el triángulo con `Phaser.GameObjects.Graphics` (proporciones fijas en pantalla, no a escala real de los valores), vértices A/B/C, marcador de ángulo recto en C, resalta en verde el vértice del ángulo de referencia, y etiqueta los 2 lados mostrados (valor o "X"); el tercer lado no se dibuja.
- **Generalización de `Card`/`CardSpawner`**: antes tipados a `RatioLabel` (fórmulas), ahora genéricos sobre `string` — sirven igual para las fórmulas del Juego 1 y los nombres de función del Juego 2. `CardSpawner.startSpawning(question)` → `startSpawning(pool: string[], correctLabel: string)`. `mathHelpers.getWrongRatios` → `getOtherLabels<T>(pool, correct)` (genérico).
- `types/index.ts`: nuevos `TriangleSide`, `ReferenceAngle`, `TriangleQuestion`.
- `types/api.ts`: `GameMode`, `game_mode` en `GameSessionData`; `RecordShotPayload` ahora es una unión `RatioShotPayload | FunctionShotPayload`.
- `sessionApiService.createSession()` ahora recibe y envía `game_mode`.
- `PreloadScene`/`LoginScene`: destino tras autenticar cambia de `'GameScene'` a `'MenuScene'`.
- `gameConfig.ts`: escenas `[PreloadScene, LoginScene, MenuScene, RatioIdentificationScene, TriangleApplicationScene]`.

## Testing manual

- [x] `npx tsc --noEmit` y `npm run build` sin errores tras el refactor.
- [x] Verificado con Playwright (bypass de login):
  - `MenuScene` renderiza los 2 botones; cada uno navega a la escena correcta.
  - **Juego 1** sigue funcionando exactamente igual tras el refactor a `BaseGameScene` (regresión: score, cartas, timer, subida de nivel, todo OK).
  - **Juego 2**: captura confirma el triángulo con A (arriba, resaltado en verde cuando es el ángulo de referencia), B (abajo-derecha), C (abajo-izquierda, con marcador de ángulo recto), un lado con valor numérico, otro con "X", el tercero sin etiqueta; cartas cayendo con `SENO`/`COSENO`/`TANGENTE`; subida de nivel (velocidad) funcionando igual que en Juego 1, reutilizando `ProgressionManager` vía `BaseGameScene`.
- [ ] **Pendiente de validar por el usuario**: partida completa jugando manualmente con login real de Google en ambos juegos.

## Testing automático

No aplica (sin tests automáticos de frontend, debilidad conocida ya documentada en incrementos anteriores).

## Archivos creados/modificados

Nuevos: `scenes/BaseGameScene.ts`, `scenes/TriangleApplicationScene.ts`, `scenes/MenuScene.ts`, `systems/TriangleQuestionGenerator.ts`, `components/TriangleDisplay.ts`.
Renombrado: `scenes/GameScene.ts` → `scenes/RatioIdentificationScene.ts`.
Modificados: `scenes/PreloadScene.ts`, `scenes/LoginScene.ts`, `config/gameConfig.ts`, `entities/Card.ts`, `systems/CardSpawner.ts`, `utils/mathHelpers.ts`, `types/index.ts`, `types/api.ts`, `services/sessionApiService.ts`.

## Checkpoint

✅ Incremento 2 frontend completo y verificado (menú + ambos juegos funcionando, sin regresión en Juego 1). NO AVANZAR al incremento 3 sin que el usuario confirme una partida real del Juego 2 con su cuenta de Google.
