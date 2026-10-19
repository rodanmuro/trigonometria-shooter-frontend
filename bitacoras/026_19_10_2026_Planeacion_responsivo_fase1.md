# Bitácora 026 - 19/10/2026

## Planeación del plan responsivo y de su fase 1 (base)

---

## Punto de partida

Refactor terminado (bitácoras 019 a 025): E2E 195/195, Vitest 130/130, `AdminScene` 153 líneas, `BaseGameScene` 278, `StatsScene` 296. Defectos 1 a 5 corregidos; el 6 (mensajes de error de axios) sigue sin decidir y no bloquea el responsivo.

Esta bitácora detalla el plan responsivo previsto en la sección 6 de la bitácora 014 y la **fase 1**, antes de tocar `src/`. Se parte de la experiencia de multiplicación (bitácoras 024 a 028 de ese proyecto).

**Estado:** solo planeación. No se ha modificado código.

## Decisiones asumidas (de multiplicación; avisar si alguna cambia)
- Orientación **solo horizontal** (en vertical, aviso para girar el celular).
- Pruebas **solo en local** (sin GitHub Actions).
- Panel admin **solo escritorio** (aviso en celular).
- Modo `?demo=1` **solo en desarrollo**, para probar en un celular real por la red local.
- Mundo de 800 de alto y 1200–1800 de ancho según la pantalla (al final).

## Estado actual relevante (leído del código)
- `config/gameConfig.ts`: 1200×800 fijo, sin `scale`.
- `index.html`: `viewport` sin `maximum-scale`/`user-scalable`/`viewport-fit`.
- `style.css`: sigue el maquetado de la plantilla de Vite (`body` flex con `min-height: 100vh`, `#app` con `max-width: 1280px`, `padding: 2rem`, `text-align: center`).
- `LoginScene`: el `div` del botón de Google se coloca en `left/top: 50%` + `margin-top: 80px` **respecto a la página**; hay que anclarlo al canvas. No hay `resize` suscrito en ninguna escena.
- No hay menú de usuario HTML: no hay nada que compactar.
- Las barras de filtros (`FilterBar.mount(top)`) siguen posicionadas con el desplazamiento del canvas (fase 3).

## Fase 1: base
Objetivo: el canvas se ajusta a cualquier pantalla sin deformarse ni desbordar la página; el dedo no hace scroll ni zoom; el botón de Google queda sobre el botón dibujado. **En escritorio el aspecto debe quedar igual.**

| Archivo | Cambio previsto |
|---------|-----------------|
| `config/gameConfig.ts` | `scale: { mode: FIT, autoCenter: CENTER_BOTH, width: 1200, height: 800, max: 1200×800 }`: se reduce para caber, nunca se agranda |
| `index.html` | `viewport` con `maximum-scale=1, user-scalable=no, viewport-fit=cover`; aviso `#rotate-notice` |
| `style.css` | Retirar el maquetado de la plantilla (`body` flex, `#app` con padding y ancho máximo). `html/body` al 100 %, `#app` a `100vw × 100dvh`, `overflow: hidden`, `overscroll-behavior: none`, sin selección de texto ni *callout* táctil (salvo `input`/`select`), `touch-action: none` en el canvas |
| `style.css` | Aviso de rotación con `@media (orientation: portrait) and (pointer: coarse)` |
| `LoginScene.ts` | Función `placeOverCanvas` que calcula la posición con `getBoundingClientRect()` del canvas y se recalcula en cada `resize` del Scale Manager (y se desuscribe al cerrar la escena) |

### Riesgos específicos y cómo se cubren
- **Instantáneas del DOM** (barras de filtros guardan `top`/`left`): quitar el relleno de `#app` y el `flex` del `body` mueve el canvas y por tanto el `top` de esas barras. Si las instantáneas cambian **solo por eso**, se regeneran de forma deliberada y se explica en la bitácora; si cambian por otra cosa, se investiga. Las instantáneas de Phaser (coordenadas del mundo) no deben cambiar.
- **Con viewport de Cypress 1280×900 el canvas queda a 1200×800**: las pruebas existentes (coordenadas de clic, `sceneText`) no deberían notar el cambio; se comprueba con la suite completa.
- **Aviso de rotación y `pointer: coarse`:** Cypress no emula puntero táctil; se comprueba la regla de CSS, no la visibilidad.
- **Partida corriendo detrás del aviso:** limitación conocida (el tiempo es por reloj); se documenta, no se resuelve en esta fase.

### Pruebas nuevas (`cypress/e2e/mobile-base.cy.ts`)
Con viewport 844×390 (horizontal) y 390×844 (vertical):
1. El canvas cabe, está centrado, mide 3:2 y aprovecha todo el alto.
2. Sin desborde horizontal ni vertical de la página.
3. `touch-action: none` en el canvas; `overscroll-behavior: none` y `user-select: none` en el cuerpo.
4. Sin aviso de rotación en horizontal; en vertical existe y su regla solo aplica a `pointer: coarse`.
5. El botón de Google queda centrado sobre el botón del canvas con el canvas escalado.
6. Un movimiento en el centro del canvas escalado llega al mundo como (600, 400).
7. El menú, un juego y Estadísticas siguen funcionando con el canvas escalado (humo).

Más pruebas Vitest solo si aparece lógica pura nueva (p. ej. el cálculo de posición del botón).

## Plan completo (fases siguientes, sin detalle aún)
| Fase | Contenido |
|------|-----------|
| 2 | Jugabilidad táctil: `ui/layout.ts` con `computeLayout` puro; escala de tarjetas (140×80), HUD y mira; `setResolution` en textos; tolerancia de impacto (`checkHit`); tope de tarjetas simultáneas; botón de pantalla completa ⛶ y primer toque. **`TriangleDisplay` (Juego 2):** escalarlo y verificar que las tarjetas no lo tapen |
| 3 | Pantallas secundarias: resumen y confirmación compensados por escala; Estadísticas compactas (8 columnas → menos, resumen por modo en dos líneas); barras de filtros ancladas al canvas (se quitan `top`/`left` de las instantáneas del DOM y de las pruebas de geometría); admin solo escritorio con aviso; aviso de navegador incrustado (WhatsApp/Instagram/Facebook) para el login de Google |
| Ajustes | Prueba con un celular real (`?demo=1` + `dev:lan`) y correcciones |
| Mundo ancho | `computeWorldWidth`: ancho 1200–1800 según la proporción de la pantalla |
| Despliegue | Solo cuando se pida: copia de seguridad, build con `.env.production` + `.htaccess.production`, subir `assets` y al final `index.html`, nunca `mirror --delete`; compartir solo enlaces `https` |

Cada fase: implementar → suite completa (E2E y Vitest) → bitácora → `git add/commit/push` sin trailer de coautoría.

## Próximo paso
Implementar la fase 1 según la tabla de arriba.

---

**Documento creado por:** Claude (Sonnet 5.5)
**Fecha:** 19 de octubre de 2026
**Estado:** Planeación de la fase 1
