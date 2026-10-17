# Bitácora 014 - 17/10/2026

## Planeación: Pruebas → Refactor → Frontend responsivo (celular)

---

## Objetivo

Que Trigonometría Shooter pueda jugarse desde un celular, siguiendo **el mismo camino que se recorrió con Multiplication Shooter** (bitácoras 012 a 028 de ese proyecto), para no romper lo que ya funciona en producción (`https://voyeducando.com/trigonometria/`):

1. **Escribir pruebas** (unitarias, integración y E2E) que fijen el comportamiento actual.
2. **Refactorizar** los archivos grandes y eliminar duplicación.
3. **Hacer el frontend responsivo** sobre el código ya ordenado.

**Alcance:** solo el frontend. El backend (`trigonometria-shooter-backend`) no se toca. Se trabaja directamente en la rama `main`, como en multiplicación.

**Estado:** solo planeación. No se ha modificado código fuente ni dependencias.

---

## 1. Punto de partida

Trigonometría es una bifurcación de Multiplication Shooter tomada **antes** de las pruebas, el refactor y el responsivo. Sigue siendo Phaser 3.90 + TypeScript 5.9 + Vite 7, sin pruebas ni linter (solo `tsc` en `npm run build`).

### Lo que es propio de este proyecto
| Pieza | Descripción |
|-------|-------------|
| `scenes/BaseGameScene.ts` (507 líneas) | Clase abstracta con sesión, temporizador, puntaje, progresión, disparo y resúmenes. Cada juego solo define la pregunta |
| `RatioIdentificationScene` (Juego 1) | Seno/coseno/tangente → disparar la fórmula (CO/H, CA/H, CO/CA) |
| `TriangleApplicationScene` (Juego 2) | Triángulo con dos lados y un ángulo de referencia → disparar la función que resuelve X |
| `systems/TriangleQuestionGenerator.ts` | Regla opuesto/adyacente/hipotenusa según el ángulo de referencia (A o B) |
| `components/TriangleDisplay.ts` | Dibuja el triángulo fijo, las etiquetas de lados y el valor decorativo en grados |
| `scenes/MenuScene.ts` | Menú: Juego 1, Juego 2, Mis estadísticas, Panel admin (solo admin) |
| Progresión | Cada 30 puntos sube un nivel; solo cambian la velocidad (hasta 2,5×) y la pregunta. 3 etiquetas posibles; sin tablas |
| Checkpoint | Cada disparo envía `current_score` y `elapsed_seconds` (bitácora 010) |
| `StatsScene` | Reporte propio del estudiante con resumen por modo (bitácoras 011 y 012) |
| `game_mode` | `ratio_identification` / `triangle_application` en sesión, listados y payloads de disparo |

### Lo que es idéntico o casi idéntico a multiplicación
`ShotMarker`, `CardExplosion` y `AudioManager` (idénticos); `AuthManager`, `apiService`, `authApiService`, `shotApiService` (diferencias menores); `LoginScene`, `Crosshair`, `Card`, `CardSpawner`, `ScoreDisplay`, `SessionTimer`, `QuestionDisplay` (misma estructura, textos distintos).

### Diferencias de estructura con multiplicación que cambian el plan
- **No hay `UserMenu`:** no existe menú de usuario HTML ni botón de cerrar sesión (`AuthManager.logout()` no tiene interfaz). Desaparecen del plan la compactación del menú en celular y la prueba del defecto de manejadores duplicados. Estadísticas y Admin se alcanzan solo desde `MenuScene`.
- **No hay `src/ui/`** (ni `theme`, `widgets`, `FilterBar`, `layout`): se crean trayéndolos de multiplicación y adaptándolos.
- **`adminApiService` difiere mucho** (188 líneas añadidas, 47 quitadas): no se puede copiar su prueba tal cual.
- **`index.html` y `style.css`** conservan el maquetado heredado de la plantilla de Vite (`body` flex, `#app` con padding de 2 rem y ancho máximo), sin protecciones táctiles, aviso de rotación ni `dvh`.
- `StatsScene` es una escena de 426 líneas con su propia tabla (8 columnas, 7 filas), filtros HTML y paginación; el listado de Admin es la `AdminScene` de 877 líneas, aún sin dividir.

---

## 2. Evaluación del estado actual para celular

Por lectura de código (no se ejecutó en un navegador ni en un celular).

| # | Problema | Dónde |
|---|----------|-------|
| 1 | Canvas fijo de 1200×800 sin Scale Manager; en celular se desborda. `body` flex y `#app` con padding | `config/gameConfig.ts`, `style.css` |
| 2 | Al escalar (~0,49 en un celular horizontal) las tarjetas de 140×80 y los textos de 14–38 px quedan ilegibles; el triángulo y sus etiquetas (24 px) también | `utils/constants.ts`, `Card`, `TriangleDisplay`, HUD |
| 3 | `CardSpawner.checkHit` exige el punto exacto dentro del rectángulo; con el dedo casi todo se falla | `systems/CardSpawner.ts` |
| 4 | HTML superpuesto posicionado respecto a la página: botón de Google (`margin-top: 80px`), barras de filtros de Stats y Admin | `LoginScene`, `StatsScene`, `AdminScene` |
| 5 | Faltan protecciones táctiles: `touch-action`, `overscroll-behavior`, `user-select`, `100dvh`, zoom por doble toque | `style.css`, `index.html` |
| 6 | Tablas de Stats y Admin con coordenadas fijas (columnas hasta ±530 px) | `StatsScene`, `AdminScene` |
| 7 | El resumen de sesión tiene el mismo texto escrito dos veces (local y backend) y textos de 64 px | `BaseGameScene` |

### Riesgos que no son de código (heredados)
- **Navegadores incrustados** (WhatsApp, Instagram, Facebook): Google bloquea el login (`disallowed_useragent`).
- **Orientación y pantalla completa:** el juego es 3:2 (horizontal); iPhone no permite Fullscreen API.
- **Audio** en móvil exige un gesto previo; **rendimiento** en gama baja.

---

## 3. Defectos que se esperan (a confirmar con las pruebas)

Deducidos por lectura. Siguiendo la regla de caracterización, **las pruebas los fijan como "(comportamiento actual)"** y se corrigen después.

| # | Defecto | Dónde | Corrección prevista |
|---|---------|-------|---------------------|
| 1 | **Tras reiniciar no se puede disparar:** `scene.restart()` reutiliza la instancia y `create()` no restablece `sessionEnded`, `sessionId` ni `lastFinishedSessionData` (la bitácora 008 solo arregló el doble clic) | `BaseGameScene` | Antes del refactor, como en multiplicación (bitácora 015) |
| 2 | **El botón NO** llama a `showSessionSummary()`, que registra un `input.once('pointerdown')`; el mismo clic vuelve a mostrar la confirmación | `BaseGameScene` | Ídem: mostrar el resumen en el fotograma siguiente |
| 3 | **Barras de filtros HTML:** `shutdown()` nunca se registra en el evento SHUTDOWN. Con las salidas actuales (botones de volver) las barras sí se retiran; el defecto aparece si se cambia de escena de otra forma | `StatsScene`, `AdminScene` | Etapa 4 del refactor (suscripción a `SHUTDOWN`) |
| 4 | **Fechas con el idioma del navegador** (`toLocaleDateString()`, `toLocaleTimeString().substring(0, 5)`) en Stats y Admin | `StatsScene`, `AdminScene` | Etapa 2 (`utils/format.ts`, `es-ES` fijo) |
| 5 | **Capa oscura acumulada** al alternar resumen y confirmación | `BaseGameScene` | Etapa 6 (`SessionSummaryOverlay`) |
| 6 | Un error de servidor no JSON en `adminApiService` puede perder el mensaje | `adminApiService` | A decidir |

Otras particularidades que se fijarán sin corregir: Stats dibuja como máximo 7 filas aunque el backend envíe más; el cálculo de nivel puede bajar si baja el puntaje.

---

## 4. Estrategia de pruebas

Mismas herramientas y mismo enfoque que en multiplicación (bitácoras 013 a 016). Node es 22.11.0, igual que allá: **jsdom 26** (no la 27).

### Pirámide

| Capa | Herramienta | Cobertura |
|------|-------------|-----------|
| Unitarias | Vitest 3 | `mathHelpers` (`randomInt`, `shuffleArray`, `getOtherLabels`); `TrigQuestionGenerator` (las 3 funciones y sus fórmulas); **`TriangleQuestionGenerator`** (las 6 combinaciones de ángulo A/B × par de lados contra la función correcta; `angleDegrees` 20–70 sin influir en la respuesta; el valor conocido 4–20 y la `X` en uno de los dos lados); `ScoreManager` (+10 / −5 / mínimo 0 / callback); `ProgressionManager` (nivel cada 30 puntos, multiplicador 1,0 a 2,5 con tope en el nivel 10); `constants` (invariantes: `ALL_RATIOS`, `RATIO_TO_BACKEND`); `AuthManager` (login válido, expirado, restauración de sesión, logout) |
| Integración (sin navegador) | Vitest + axios simulado | `apiService` (Bearer, 401/403/404/500, red); `sessionApiService` (incluye `game_mode` y `getMySessions` con filtros); `shotApiService`; `authApiService`; `adminApiService` (rehacer la prueba para su API real) |
| E2E | Cypress 14.5.4 | Escenas de Phaser y HTML superpuesto en navegador real, con el backend siempre simulado (`cy.intercept`) |

Phaser no carga en jsdom: `Card`, `CardSpawner`, `TriangleDisplay` y las escenas se cubren desde E2E.

### Cómo se hace el E2E sobre un canvas (igual que en multiplicación)
- **Backend siempre simulado**, con red de seguridad: `/api/**` sin simular devuelve 501.
- **Login:** el OAuth de Google no se automatiza; se siembra `localStorage` con un JWT falso vigente y se simula `POST /auth/verify`. `window.google` se sustituye por un doble.
- **Acceso al juego:** `main.ts` expone `window.game`; TypeScript borra `private`, así que un único `gameDriver.ts` lee el estado de la escena sin tocar `src/`.
- **Azar y tiempo:** `Math.random` con semilla; el fin de sesión se fuerza con `endSession`.
- **Instantáneas** de la lista de objetos de la escena y del DOM (tarea `matchSnapshot`, `cypress/snapshots/*.json`): red de seguridad del refactor.
- **Servidor de pruebas:** Vite en el puerto 5174 con `VITE_API_URL=/api`, para que no haya CORS. Scripts `env -u ELECTRON_RUN_AS_NODE` por el entorno de VS Code.

### Qué hay que adaptar respecto a multiplicación
- El **ancho del canvas** y la **base** `/trigonometria/` (en dev la base es `/`).
- `gameDriver`: apunta a `RatioIdentificationScene` y `TriangleApplicationScene` (clases hijas de `BaseGameScene`); los campos privados cambian de nombre respecto a `GameScene` (`cardSpawner`, `scoreManager`, `progressionManager`, `sessionTimer` se conservan).
- `fixtures`: sesiones con `game_mode`, resumen con `total_sessions_ratio` / `total_sessions_triangle`, payloads de Juego 1 (`trig_function`, `expected_ratio`, `selected_ratio`) y de Juego 2 (`expected_function`, `selected_function`).
- Sin `UserMenu`: las pruebas de navegación parten de `MenuScene`.

### Escenarios E2E previstos
- **Login y menú:** pantalla de login; GIS inicializado; sesión restaurada pasa a `MenuScene`; token vencido; el botón de admin solo aparece para admin; los cuatro botones del menú navegan a su escena.
- **Juego 1 y Juego 2** (los mismos escenarios, con el payload de cada uno): crea sesión con `game_mode` y dimensiones del canvas; acierto +10 y payload exacto; error −5 con piso en 0; disparo al aire no envía nada; checkpoint (`current_score`, `elapsed_seconds`); a los 30 puntos sube de nivel (aviso, nueva pregunta, mayor velocidad); fin de sesión con `PUT finish`, resumen del backend y resumen local si falla; confirmación de reinicio SÍ/NO; doble clic en SÍ/NO (bitácora 008) crea una sola sesión.
- **Juego 2:** el triángulo muestra los dos lados, la `X` y el valor en grados del ángulo A o B; la respuesta correcta coincide con la regla.
- **Estadísticas:** resumen por modo, tabla de 8 columnas, paginación, filtros (fecha, puntaje mínimo), vacío y error, volver al menú.
- **Admin:** lista, ordenar, filtros, sesiones de un usuario, subida y exportación de CSV, 403.

### Reglas
- **Caracterización:** las pruebas fijan el comportamiento *actual*; los defectos se anotan y no se corrigen durante esa fase, **salvo** los dos del reinicio (1 y 2), que se corrigen antes del refactor con las pruebas ya escritas, como en multiplicación.
- **Línea base:** todo en verde sobre el código sin cambios, en un commit, antes de refactorizar.
- **Sin GitHub Actions** por ahora: las pruebas se corren en local.
- **Scripts:** `npm test`, `npm run e2e`, `npm run dev:e2e`, `typecheck:tests`, `typecheck:e2e`.

---

## 5. Refactor (después de las pruebas)

### Diagnóstico
| Archivo | Líneas | Mezcla |
|---------|--------|--------|
| `scenes/AdminScene.ts` | 877 | Estado de dos vistas, carga de API, tablas, barras de filtros HTML (`cssText` repetido), CSV, modal de error |
| `scenes/BaseGameScene.ts` | 507 | Sesión, disparo, progresión, aviso de nivel y **resumen duplicado** (local/backend) + confirmación |
| `scenes/StatsScene.ts` | 426 | Resumen, filtros HTML, tabla, paginación, error |
| `scenes/LoginScene.ts` | 287 | Escena + DOM del botón de Google |

### Estructura objetivo (la de multiplicación, adaptada)
```
src/
  ui/
    theme.ts            colores y tamaños de fuente
    layout.ts           (fase responsiva) escala del canvas → tokens
    widgets/            Button, Pagination, Modal, DataTable<T>
    html/               FilterBar (+ clases CSS en style.css)
    SessionSummaryOverlay.ts
  scenes/
    admin/              AdminScene (orquestador), UsersView, UserSessionsView
  utils/                format.ts, download.ts, environment.ts
```
`BaseGameScene` conserva su papel (es la mejor pieza de arquitectura de este proyecto) y solo cede el resumen a `SessionSummaryOverlay`. Meta: ninguna escena por encima de ~300 líneas.

### Etapas
| Etapa | Qué | Riesgo |
|-------|-----|--------|
| 1 | `theme.ts`: `fontSize` y colores sueltos | Bajo, mecánico |
| 2 | `format.ts` y `download.ts` (corrige defecto 4) | Bajo |
| 3 | Widgets `Button`, `Pagination`, `Modal` | Bajo-medio |
| 4 | Filtros HTML: `cssText` → clases CSS + `FilterBar` (corrige defecto 3) | Medio |
| 5 | `DataTable<T>` para Stats y Admin | Medio |
| 6 | `SessionSummaryOverlay` en `BaseGameScene` (corrige defecto 5); modal de error de Stats | Medio |
| 7 | `AdminScene` → orquestador + `UsersView` + `UserSessionsView` | Medio-alto |

El refactor **conserva el comportamiento**; cada etapa se valida con la suite completa (instantáneas sin regenerar) y deja su bitácora y su commit.

---

## 6. Plan responsivo (después del refactor)

Idéntico al de multiplicación, con estos ajustes:

1. **Base:** Scale Manager (`FIT` + centrado), CSS táctil con `dvh`, retiro del maquetado de la plantilla de Vite, aviso de rotación, botón de Google anclado al canvas. **Sin menú de usuario que compactar.**
2. **Jugabilidad táctil:** `layout.ts` (función pura `computeLayout`) con escala de tarjetas (140×80 en origen), HUD y mira; tolerancia de impacto; `setResolution` en los textos; menos tarjetas simultáneas. Pantalla completa (botón ⛶ y primer toque). **Atención al triángulo del Juego 2:** `TriangleDisplay` se dibuja a 24–26 px en el centro de la pantalla; hay que escalarlo y comprobar que las tarjetas no lo tapen.
3. **Pantallas secundarias:** resumen y confirmación; Estadísticas compactas (8 columnas, quitar columnas, resumen por modo en dos líneas); barras de filtros ancladas al canvas; panel admin solo escritorio con aviso; aviso de navegador incrustado.
4. **Mundo ancho** (alto 800, ancho 1200–1800 según la pantalla), como en la bitácora 028 de multiplicación.

Decisiones ya tomadas en multiplicación que se asumen aquí (confirmar si se quieren distintas): orientación **solo horizontal**; pruebas **solo en local**; panel admin **solo escritorio**; modo demostración `?demo=1` solo en desarrollo para probar en un celular real por la red local.

---

## 7. Orden de ejecución

| Fase | Contenido | Bitácora |
|------|-----------|----------|
| A | Vitest + pruebas unitarias y de integración (sin tocar `src/`) | 015 |
| B | Cypress + `gameDriver` + login, menú y los dos juegos | 016 |
| C | Corrección de los defectos 1 y 2 (reinicio y NO) con sus pruebas ya escritas | 017 |
| D | E2E de Estadísticas y Admin con instantáneas; línea base verde y commit | 018 |
| E | Refactor, etapas 1 a 7 | 019 en adelante |
| F | Responsivo, fases 1 a 3, ajustes con un celular real y mundo ancho | siguientes |
| G | Despliegue a `public_html/trigonometria/` (solo cuando el usuario lo pida) | última |

Cada fase deja su propia bitácora al terminar, y el flujo de siempre: implementar → suite completa → bitácora → `git add/commit/push` (sin trailer de coautoría).

---

## 8. Despliegue (referencia para el final)

- Destino: `public_html/trigonometria/` en voyeducando.com, por FTP con `lftp` (credenciales en `~/proyectos/web-javascript-react/.ftp-voyeducando.env`, fuera de git). El backend vive en `public_html/trigonometria/api/`: **nunca** usar `mirror --delete` (bitácora 010).
- Antes de subir: copia de seguridad del `index.html`, `.htaccess` y assets servidos; build con `.env.production` + `.htaccess.production` a `dist/`; subir assets, comprobar que se sirven y subir `index.html` al final.
- Reversión: volver a subir el `index.html` de la copia (los assets antiguos no se borran).

---

## 9. Decisiones y riesgos

**Pendientes de confirmar antes de empezar:**
- Orientación en celular (se asume solo horizontal, como en multiplicación).
- Si, ya que no hay menú de usuario, se quiere **añadir** cerrar sesión (hoy no existe interfaz para ello). Es una función nueva; se deja fuera del plan salvo que se pida.

**Riesgos:**
- Las pruebas de caracterización pueden fijar comportamientos que son errores; se documentan, no se corrigen en esa pasada (excepto los defectos 1 y 2).
- El `gameDriver` depende de nombres privados de `BaseGameScene`; se concentra en un único archivo.
- Las instantáneas son sensibles a cualquier cambio de posición; los cambios intencionales exigen revisión.
- Vitest y Cypress añaden dependencias de desarrollo (no afectan el bundle de producción).
- `TriangleDisplay` y `TriangleQuestionGenerator` no existen en multiplicación: el responsivo del triángulo y sus pruebas son trabajo nuevo, sin experiencia previa que copiar.

---

**Documento creado por:** Claude (Sonnet 5.5)
**Fecha:** 17 de octubre de 2026
**Estado:** Planeación - pendiente de aprobación para empezar la fase A
