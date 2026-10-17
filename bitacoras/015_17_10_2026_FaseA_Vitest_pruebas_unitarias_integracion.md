# Bitácora 015 - 17/10/2026

## Fase A: Vitest y pruebas unitarias y de integración

---

## Resumen

Primera fase del plan de la bitácora 014. Se instaló Vitest y se escribieron **116 pruebas** que fijan el comportamiento actual de la lógica del juego, la autenticación y la capa HTTP. **No se modificó ningún archivo de `src/`.**

**Estado:** ✅ Completada. 116/116 en verde (~1 s), `npm run build` y `npm run typecheck:tests` sin errores.

---

## Cambios realizados

### Dependencias (solo desarrollo)
- `vitest@^3.2.7`
- `jsdom@^26.1.0` — **no** la 27: exige Node ≥ 22.12 y esta máquina tiene Node 22.11.0.

### Archivos nuevos
```
vitest.config.ts                          jsdom, incluye tests/**/*.test.ts (copiado de multiplicación)
tests/tsconfig.json                       tipado estricto de las pruebas
tests/helpers/setup.ts                    silencia console.*; limpia localStorage y relojes
tests/helpers/jwt.ts                      makeJwt(): JWT sin firma válida (el front solo decodifica)
tests/helpers/mockAdapter.ts              mockApi() / mockApiNetworkError(); ahora admite `headers` en la respuesta
tests/unit/mathHelpers.test.ts            8
tests/unit/QuestionGenerator.test.ts      6
tests/unit/TriangleQuestionGenerator.test.ts  16
tests/unit/ScoreManager.test.ts           8
tests/unit/ProgressionManager.test.ts     16
tests/unit/constants.test.ts              7
tests/unit/AuthManager.test.ts            15
tests/integration/apiService.test.ts      13
tests/integration/services.test.ts        12
tests/integration/adminApiService.test.ts 15
```

### Scripts nuevos en `package.json`
| Script | Qué hace |
|--------|----------|
| `npm test` | `vitest run` |
| `npm run test:watch` | Vitest en modo observación |
| `npm run typecheck:tests` | `tsc -p tests/tsconfig.json` |

---

## Qué cubren las pruebas

| Archivo | Pruebas | Cubre |
|---------|---------|-------|
| `mathHelpers` | 8 | `randomInt` (extremos inclusivos, enteros), `getOtherLabels` (las otras dos etiquetas, orden, sin mutar), `shuffleArray` |
| `QuestionGenerator` | 6 | Juego 1: seno→CO/H, coseno→CA/H, tangente→CO/CA; aparecen las tres razones |
| `TriangleQuestionGenerator` | 16 | **Juego 2:** las 6 combinaciones ángulo (A/B) × par de lados contra la función correcta; el mismo par {a, c} da seno con A y coseno con B; la incógnita X y el valor conocido (4–20) en uno u otro lado; el lado no mostrado sin etiqueta; grados 20–70 que no influyen en la respuesta; 400 preguntas con invariantes |
| `ScoreManager` | 8 | +10 / −5, piso en 0, callback, `reset` |
| `ProgressionManager` | 16 | Nivel cada 30 puntos, subidas, salto de varios niveles, multiplicador +0,15 por nivel con tope en el nivel 10 |
| `constants` | 7 | Invariantes (tres razones, traducción al backend, sesión de 5 min, progresión) |
| `AuthManager` | 15 | Login válido/expirado/mal formado, persistencia, logout, expiración, restauración, `updateUserFromBackend` (idéntico al de multiplicación) |
| `apiService` | 13 | Bearer, cabeceras, credenciales, timeout 10 s, manejo de 401/403/404/500/otros y caída de red |
| `services` | 12 | `verifyGoogleToken`; `createSession` con `game_mode` y redondeo del canvas; `finishSession`; `getMySessions` (URL, filtros); `recordShot` del Juego 1 y del Juego 2 con `current_score` y `elapsed_seconds` |
| `adminApiService` | 15 | **Aquí el servicio usa axios, no `fetch` como en multiplicación:** URLs, filtros como parámetros, error del servidor, subida de CSV (FormData), exportaciones (nombre del archivo, `usuarios.csv`/`sesiones.csv` por defecto, URL temporal liberada, DOM limpio) |

---

## Verificación de que las pruebas detectan errores

Cuatro mutaciones temporales en `src/`, restauradas con `git checkout`:

| Mutación | Resultado |
|----------|-----------|
| `'adjacent,hypotenuse': 'coseno'` → `'seno'` (regla del triángulo) | 4 pruebas fallan |
| Roles del ángulo B invertidos (`b` opuesto → `a` opuesto) | 3 fallan |
| `POINTS_PER_LEVEL: 30` → `40` | Fallan 9 o más (progresión y constantes) |
| `createSession` deja de enviar `game_mode` | 2 fallan |

Tras restaurar, `src/` quedó sin cambios y las 116 pruebas vuelven a pasar.

---

## Comportamientos actuales fijados (no se corrigen en esta pasada)

1. **`ScoreManager`:** al recortar el puntaje en 0, el callback recibe `delta = −5` aunque el puntaje no cambió.
2. **`ProgressionManager`:** el nivel puede bajar si baja el puntaje.
3. **`apiService`:** un 401 solo escribe un aviso; no borra el token ni redirige.
4. **`adminApiService`:** sin token la petición sale igualmente, sin `Authorization` (en multiplicación fallaba antes de llamar a la red). Es una diferencia real entre los dos proyectos.
5. **Multiplicador de velocidad:** el máximo configurado es 2,5, pero con el tope en el nivel 10 el valor real máximo es 2,35; el máximo nunca se alcanza.
6. **`adminApiService.downloadBlob`:** el nombre del archivo se toma con la expresión `filename="(.+)"`; una cabecera sin comillas se ignora y se usa el nombre por defecto. (Duplicado también en las dos exportaciones; candidato a la etapa 2 del refactor.)

---

## Lo que queda fuera de esta fase

- `Card`, `CardSpawner`, `Crosshair`, `TriangleDisplay` y las escenas dependen de Phaser, que no carga bien en jsdom. Se cubren con Cypress (fases B y D).
- `StatsScene` y `AdminScene` (listas, filtros, paginación) → fase D.

---

## Próximo paso

**Fase B:** instalar Cypress, crear `gameDriver.ts` y los escenarios E2E de login, menú y los dos juegos.

---

**Documento creado por:** Claude (Sonnet 5.5)
**Fecha:** 17 de octubre de 2026
**Estado:** Fase A completada
