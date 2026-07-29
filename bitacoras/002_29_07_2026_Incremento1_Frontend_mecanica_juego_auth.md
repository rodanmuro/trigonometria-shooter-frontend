# 002 - 29/07/2026 - Incremento 1: Mecánica de juego + auth Google (Frontend)

## Resumen

Implementación completa del frontend Phaser 3 + TypeScript + Vite para el Incremento 1: login con Google, y la mecánica de disparo de razones trigonométricas (carta superior con la razón a identificar — seno/coseno/tangente — y cartas cayendo con las fórmulas CO/H, CA/H, CO/CA), con sesión y disparos persistidos contra el backend.

## Cambios realizados

- Scaffold `npm create vite@latest trigonometria-shooter-frontend -- --template vanilla-ts`, luego se fijaron las versiones para igualar al proyecto anterior: `phaser@^3.90.0` (el scaffold instaló por defecto Phaser 4, incompatible con los patrones reutilizados), `typescript@~5.9.3`, `vite@^7.3.6`, `axios`, `jwt-decode@^4.0.0`.
- Copiados sin cambios de lógica: `tsconfig.json`, `main.ts`, `AuthManager.ts`, `apiService.ts`, `authApiService.ts`, `PreloadScene.ts`, `LoginScene.ts` (solo textos/branding), `Crosshair.ts`, `ShotMarker.ts`, `AudioManager.ts`, `CardExplosion.ts`, `ScoreManager.ts`, `ScoreDisplay.ts`, `SessionTimer.ts`, sonidos (`public/sounds/*`).
- Nuevos/adaptados para trigonometría:
  - `types/index.ts`: `TrigFunction`, `RatioLabel`, `Question { trigFunction, correctRatio }`.
  - `utils/constants.ts`: `TRIG_FUNCTIONS`, `RATIO_LABELS` (mapeo función→fórmula), `RATIO_TO_BACKEND` (traduce `CO/H`→`co_h` para la API), `SCORE`, `CARD_CONFIG` (máx. 5 cartas en pantalla), `GAME_CONFIG.SESSION_DURATION = 120000` (2 min).
  - `utils/mathHelpers.ts`: `getWrongRatios()` reemplaza la generación numérica de respuestas incorrectas — con solo 3 fórmulas posibles, simplemente retorna las 2 restantes.
  - `systems/QuestionGenerator.ts` → `TrigQuestionGenerator`: elige una razón al azar y su fórmula correcta (sin dificultad/tabla, mucho más simple que el original).
  - `entities/Card.ts`, `systems/CardSpawner.ts`: renderizan/spawnaean las fórmulas en vez de números.
  - `components/QuestionDisplay.ts`: muestra el nombre de la razón en mayúsculas.
  - `scenes/GameScene.ts`: sin `ProgressionManager`/niveles. Al acertar la carta correcta se registra el disparo y se genera una nueva pregunta (nueva ronda); al fallar, se resta puntaje y continúa la misma ronda. Timer fijo de 2 minutos vía `Phaser.Time.TimerEvent` (`getRemaining()`/`getElapsed()` alimentan el display y el payload de `finish`).
  - `config/gameConfig.ts`: escenas `[PreloadScene, LoginScene, GameScene]` (sin `StatsScene`/`AdminScene`, quedan para incrementos futuros).
- `index.html`: agregado el script de Google Identity Services (`accounts.google.com/gsi/client`), título actualizado.
- `.env`: `VITE_API_URL=http://localhost:8001/api` (backend en 8001, no 8000 — puerto ocupado por otro proceso del usuario), `VITE_GOOGLE_CLIENT_ID` reutilizado de multiplication-shooter-frontend.
- `.gitignore`: agregado bloque de variables de entorno (no estaba en el scaffold por defecto de Vite).

## Testing manual

- [x] `npx tsc --noEmit` sin errores.
- [x] `npm run build` genera el bundle sin errores (warning esperado de chunk grande por Phaser, igual que el proyecto anterior).
- [x] Verificado con Playwright headless (no hay cuenta Google real disponible en este entorno, así que no se pudo probar el flujo de login real de punta a punta):
  - Pantalla de login renderiza correctamente: título, subtítulo, botón real de Google ("Acceder con Google").
  - Bypaseando el login (token JWT simulado en localStorage, sin firma válida) se llegó a `GameScene`: carta superior muestra la razón (`TANGENTE`, `COSENO`...), timer cuenta regresivo desde 1:58, cartas de fórmula caen correctamente (`CO/H`, `CA/H`, `CO/CA`), máximo 5 en pantalla.
  - Disparos aleatorios repetidos: el score cambió correctamente (ej. `Score: 5` tras aciertos/fallos mezclados), y al acertar la carta correcta se logueó "Nueva pregunta" con una razón distinta — confirma el ciclo completo de ronda.
  - El backend **rechazó correctamente** el token falso (401 "Algorithm not supported" desde la verificación real de Google) y el frontend degradó con gracia ("El juego continuará sin sincronización con backend"), sin romper la partida.
- [ ] **Pendiente de validar por el usuario**: login real con una cuenta de Google (requiere agregar `http://localhost:5173` a los orígenes autorizados del Client ID en Google Cloud Console si aún no está, y luego jugar una partida completa para confirmar que sesión y disparos se persisten correctamente en la BD).

## Testing automático

No aplica (sin tests automáticos de frontend en este incremento, igual que el proyecto anterior — debilidad conocida, documentada, no resuelta).

## Archivos creados/modificados

`src/{types,utils,systems,entities,components,scenes,config,services,managers,effects}/*`, `index.html`, `vite.config.ts`, `tsconfig.json`, `.env`, `.env.example`, `.gitignore`, `public/sounds/*`.

## Checkpoint

✅ Incremento 1 frontend completo. Mecánica de juego verificada de punta a punta (excepto el login real de Google, que requiere intervención manual del usuario). NO AVANZAR al incremento 2 sin que el usuario confirme una partida jugada con su cuenta real de Google.
